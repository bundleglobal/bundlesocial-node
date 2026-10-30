#!/usr/bin/env node
// Describes how the OpenAPI spec changed since the last commit, so a generated pull request
// carries a commit message that semantic-release can turn into useful release notes.
//
// Usage: node scripts/describe-api-changes.mjs --spec <spec.json> --generated <path> [--generated <path>]
//          [--base <rev>] [--branch <pr branch>] [--title "feat: ..."]
//
// --title replaces the generated title. It is marked in the commit, so later runs that update the
// same --branch keep it instead of writing a new one.
//
// In GitHub Actions it writes `title`, `commit-message`, `body` and `breaking` to $GITHUB_OUTPUT,
// otherwise it prints the commit message and the pull request body.
// The same script lives in bundlesocial-node and bundlesocial-n8n; keep both copies in sync.

import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const METHODS = ['get', 'post', 'put', 'patch', 'delete'];
const MAX_DEPTH = 12;
const MAX_TITLE_LENGTH = 100;

function operations(spec) {
	const result = new Map();
	for (const [path, item] of Object.entries(spec.paths ?? {})) {
		for (const method of METHODS) {
			const operation = item[method];
			if (operation) result.set(`${method.toUpperCase()} ${path}`, operation);
		}
	}
	return result;
}

// Flattens a schema into dotted field paths (`items[].socialAccount.id`) with what a client relies on.
function flattenSchema(schema, prefix, fields, required, depth = 0, inVariant = false) {
	if (!schema || typeof schema !== 'object' || depth > MAX_DEPTH) return;
	const variants = schema.oneOf ?? schema.anyOf ?? schema.allOf;
	if (variants) {
		// Variants are merged into one shape; a field of a single variant is never required overall.
		for (const variant of variants) flattenSchema(variant, prefix, fields, false, depth + 1, true);
		if (prefix && !fields.has(prefix)) fields.set(prefix, { type: 'oneOf', required, enum: [] });
		return;
	}
	if (prefix) {
		const existing = fields.get(prefix);
		const type = [existing?.type, schema.type]
			.filter(Boolean)
			.filter((t, i, all) => all.indexOf(t) === i)
			.join(' | ');
		fields.set(prefix, {
			type,
			required: (existing?.required ?? true) && required,
			enum: [...new Set([...(existing?.enum ?? []), ...(schema.enum ?? [])])].map(String),
		});
	}
	const requiredNames = new Set(schema.required ?? []);
	for (const [name, child] of Object.entries(schema.properties ?? {})) {
		const childRequired = requiredNames.has(name) && !inVariant;
		flattenSchema(
			child,
			prefix ? `${prefix}.${name}` : name,
			fields,
			childRequired,
			depth + 1,
			inVariant,
		);
	}
	if (schema.items)
		flattenSchema(schema.items, `${prefix}[]`, fields, !inVariant, depth + 1, inVariant);
	if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
		flattenSchema(
			schema.additionalProperties,
			`${prefix}{}`,
			fields,
			!inVariant,
			depth + 1,
			inVariant,
		);
	}
}

function requestFields(operation) {
	const fields = new Map();
	for (const parameter of operation.parameters ?? []) {
		flattenSchema(parameter.schema ?? {}, parameter.name, fields, Boolean(parameter.required));
	}
	for (const content of Object.values(operation.requestBody?.content ?? {})) {
		flattenSchema(content.schema, '', fields, true);
	}
	return fields;
}

function responseFields(operation) {
	const fields = new Map();
	for (const [status, response] of Object.entries(operation.responses ?? {})) {
		if (!status.startsWith('2')) continue;
		for (const content of Object.values(response.content ?? {}))
			flattenSchema(content.schema, '', fields, true);
	}
	return fields;
}

const parentOf = (field) => field.replace(/(\[\]|\{\}|\.[^.[{]+)$/, '');
const leafOf = (field) =>
	field
		.replace(/(\[\]|\{\})+$/, '')
		.split('.')
		.pop();

// Compares two flattened schemas. Only the top of an added or removed subtree is reported.
function compareFields(before, after, side) {
	const changes = [];
	for (const [field, info] of after) {
		if (before.has(field)) continue;
		if (field.includes('.') || field.endsWith('[]') || field.endsWith('{}')) {
			if (!before.has(parentOf(field))) continue;
		}
		const breaking = side === 'request' && info.required;
		changes.push({ kind: 'add', side, field, required: info.required, breaking });
	}
	for (const [field] of before) {
		if (after.has(field)) continue;
		if (field.includes('.') || field.endsWith('[]') || field.endsWith('{}')) {
			if (!after.has(parentOf(field))) continue;
		}
		changes.push({ kind: 'remove', side, field, breaking: true });
	}
	for (const [field, info] of after) {
		const old = before.get(field);
		if (!old) continue;
		if (old.type !== info.type) {
			changes.push({ kind: 'type', side, field, from: old.type, to: info.type, breaking: true });
		}
		if (side === 'request' && !old.required && info.required) {
			changes.push({ kind: 'required', side, field, breaking: true });
		}
		const added = info.enum.filter((value) => !old.enum.includes(value));
		const removed = old.enum.filter((value) => !info.enum.includes(value));
		if (old.enum.length && added.length)
			changes.push({ kind: 'enum-add', side, field, values: added, breaking: false });
		if (removed.length) {
			changes.push({
				kind: 'enum-remove',
				side,
				field,
				values: removed,
				breaking: side === 'request',
			});
		}
	}
	return changes;
}

export function describeChanges(oldSpec, newSpec) {
	const before = operations(oldSpec);
	const after = operations(newSpec);
	const groups = [];
	for (const [key, operation] of after) {
		const old = before.get(key);
		const name = operation.summary || operation.operationId || key;
		if (!old) {
			groups.push({ key, name, changes: [{ kind: 'operation-add', breaking: false }] });
			continue;
		}
		const changes = [
			...compareFields(requestFields(old), requestFields(operation), 'request'),
			...compareFields(responseFields(old), responseFields(operation), 'response'),
		];
		if (!old.deprecated && operation.deprecated)
			changes.push({ kind: 'deprecate', breaking: false });
		if (changes.length) groups.push({ key, name, changes });
	}
	for (const [key, operation] of before) {
		if (!after.has(key)) {
			const name = operation.summary || operation.operationId || key;
			groups.push({ key, name, changes: [{ kind: 'operation-remove', breaking: true }] });
		}
	}
	return groups;
}

const code = (value) => `\`${value}\``;

function describeChange(change) {
	const where = change.side === 'request' ? 'request' : 'response';
	switch (change.kind) {
		case 'operation-add':
			return 'New endpoint';
		case 'operation-remove':
			return 'Endpoint removed';
		case 'deprecate':
			return 'Endpoint deprecated';
		case 'add':
			return `Added ${change.required ? 'required ' : ''}${where} field ${code(change.field)}`;
		case 'remove':
			return `Removed ${where} field ${code(change.field)}`;
		case 'type':
			return `Changed the type of ${where} field ${code(change.field)} from ${change.from} to ${change.to}`;
		case 'required':
			return `Made ${where} field ${code(change.field)} required`;
		case 'enum-add':
			return `Added ${change.values.map(code).join(', ')} to ${where} field ${code(change.field)}`;
		case 'enum-remove':
			return `Removed ${change.values.map(code).join(', ')} from ${where} field ${code(change.field)}`;
	}
}

const joinNames = (names) => {
	const unique = [...new Set(names)];
	const shown = unique.slice(0, 3);
	const rest = unique.length - shown.length;
	if (rest > 0) return `${shown.join(', ')} and ${rest} more`;
	return shown.length > 1 ? `${shown.slice(0, -1).join(', ')} and ${shown.at(-1)}` : shown[0];
};

// One short phrase per operation and side, most important first, used for the commit subject.
// Endpoints come first, then what a request can send, then what a response returns.
function phrases(groups) {
	const ranked = [];
	for (const { name, changes } of groups) {
		const pick = (side, ...kinds) =>
			changes.filter((change) => change.side === side && kinds.includes(change.kind));
		const fields = (list) => joinNames(list.map((change) => leafOf(change.field)));
		if (changes.some((change) => change.kind === 'operation-add'))
			ranked.push([0, `add "${name}"`]);
		if (changes.some((change) => change.kind === 'operation-remove'))
			ranked.push([1, `remove "${name}"`]);
		['request', 'response'].forEach((side, offset) => {
			const rank = 2 + offset * 3;
			const added = pick(side, 'add', 'enum-add');
			if (added.length) ranked.push([rank, `add ${fields(added)} to "${name}"`]);
			const removed = pick(side, 'remove', 'enum-remove');
			if (removed.length) ranked.push([rank + 1, `remove ${fields(removed)} from "${name}"`]);
			const changed = pick(side, 'type', 'required');
			if (changed.length) ranked.push([rank + 2, `change ${fields(changed)} in "${name}"`]);
		});
		if (changes.some((change) => change.kind === 'deprecate'))
			ranked.push([8, `deprecate "${name}"`]);
	}
	return ranked.sort((a, b) => a[0] - b[0]).map(([, phrase]) => phrase);
}

export function buildMessage(groups, generatedChanged) {
	if (!generatedChanged) {
		return { type: 'chore', subject: 'update the OpenAPI spec', breaking: false };
	}
	if (!groups.length) {
		return { type: 'fix', subject: 'update API descriptions', breaking: false };
	}
	const all = groups.flatMap((group) => group.changes);
	const adds = all.some((change) => ['operation-add', 'add', 'enum-add'].includes(change.kind));
	const list = phrases(groups);
	const others = list.length - 1;
	let subject =
		others > 0
			? `${list[0]} and ${others} more API ${others === 1 ? 'change' : 'changes'}`
			: list[0];
	if (subject.length > MAX_TITLE_LENGTH) subject = `${subject.slice(0, MAX_TITLE_LENGTH - 1)}…`;
	return { type: adds ? 'feat' : 'fix', subject, breaking: all.some((change) => change.breaking) };
}

export function formatChanges(groups) {
	return groups
		.map(({ key, name, changes }) => {
			const lines = changes.map(
				(change) =>
					`- ${describeChange(change)}${change.breaking ? ' (breaking for clients)' : ''}`,
			);
			return `${name} (${code(key)})\n${lines.join('\n')}`;
		})
		.join('\n\n');
}

function parseArgs(argv) {
	const args = { generated: [], base: 'HEAD', title: '' };
	for (let i = 0; i < argv.length; i += 2) {
		const [flag, value] = [argv[i], argv[i + 1]];
		if (flag === '--spec') args.spec = value;
		else if (flag === '--generated') args.generated.push(value);
		else if (flag === '--base') args.base = value;
		else if (flag === '--branch') args.branch = value;
		else if (flag === '--title') args.title = value.trim();
		else throw new Error(`Unknown argument ${flag}`);
	}
	if (!args.spec || !args.generated.length)
		throw new Error('Pass --spec and at least one --generated path');
	return args;
}

const MANUAL_TITLE_TRAILER = 'Release-Title: manual';
// The commit analyzer ignores anything else, so this is checked before a run publishes nothing.
const CONVENTIONAL_TITLE = /^\w+(\([^)]*\))?: \S/;

// The title given on an earlier run, read from the commit of the PR that is still open on the branch.
// A merged branch can stay behind, and its old title must not carry over to the next release.
export function previousManualTitle(git, branch, openPullRequestCount) {
	if (!branch) return '';
	try {
		if (openPullRequestCount(branch) === 0) return '';
		git('fetch', '--quiet', '--depth=1', 'origin', branch);
	} catch {
		return '';
	}
	const message = git('log', '-1', '--format=%B', 'FETCH_HEAD');
	return message.includes(MANUAL_TITLE_TRAILER) ? message.split('\n')[0].trim() : '';
}

function openPullRequestCount(branch) {
	const output = execFileSync(
		'gh',
		['pr', 'list', '--head', branch, '--state', 'open', '--json', 'number', '--jq', 'length'],
		{ encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
	);
	return Number(output.trim());
}

function writeOutput(name, value) {
	const delimiter = `EOF_${Math.random().toString(36).slice(2)}`;
	appendFileSync(process.env.GITHUB_OUTPUT, `${name}<<${delimiter}\n${value}\n${delimiter}\n`);
}

function main() {
	const args = parseArgs(process.argv.slice(2));
	const git = (...gitArgs) =>
		execFileSync('git', gitArgs, {
			encoding: 'utf8',
			maxBuffer: 256 * 1024 * 1024,
			// A missing PR branch is expected, so git's own error output stays out of the log.
			stdio: ['ignore', 'pipe', 'pipe'],
		});
	const oldSpec = JSON.parse(git('show', `${args.base}:${args.spec}`));
	const newSpec = JSON.parse(readFileSync(args.spec, 'utf8'));
	// Untracked files count too, so a newly generated file marks the output as changed.
	const generatedChanged = git('status', '--porcelain', '--', ...args.generated).trim() !== '';

	const groups = describeChanges(oldSpec, newSpec);
	const { type, subject, breaking } = buildMessage(groups, generatedChanged);
	const requestedTitle = args.title || previousManualTitle(git, args.branch, openPullRequestCount);
	if (requestedTitle && !CONVENTIONAL_TITLE.test(requestedTitle)) {
		throw new Error(
			`"${requestedTitle}" is not a conventional commit title, for example "feat: add DMs"`,
		);
	}
	// The same title is often given to every generated repo; one whose code did not change gets no release.
	const manualTitle = generatedChanged ? requestedTitle : '';
	const title = manualTitle || `${type}: ${subject}`;
	const changes = formatChanges(groups);
	// The commit body never says "BREAKING CHANGE", so a major release is always a deliberate edit.
	const commitMessage = [title, changes, manualTitle ? MANUAL_TITLE_TRAILER : '']
		.filter(Boolean)
		.join('\n\n');
	const body = [
		`Regenerated from https://api.bundle.social/swagger-json.`,
		generatedChanged
			? ''
			: `The generated code did not change, so merging this publishes no release${requestedTitle ? ` and the title "${requestedTitle}" was not used` : ''}.`,
		// Kept off the start of a line: the commit parser reads a line starting with the keyword as a note.
		breaking
			? '> [!WARNING]\n> Some changes can break existing clients. To publish them as a major version, add a footer line with BREAKING CHANGE and a colon to the commit message when merging.'
			: '',
		changes ? `## API changes\n\n${changes}` : 'No endpoint, field or enum changed.',
		manualTitle
			? 'The title was given when the workflow was run and stays on later runs. It becomes the release note.'
			: 'The title becomes the release note. To set your own, run the workflow with a title.',
	]
		.filter(Boolean)
		.join('\n\n');

	if (process.env.GITHUB_OUTPUT) {
		writeOutput('title', title);
		writeOutput('commit-message', commitMessage);
		writeOutput('body', body);
		writeOutput('breaking', String(breaking));
	} else {
		console.log(`${commitMessage}\n\n----- pull request body -----\n\n${body}`);
	}
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
