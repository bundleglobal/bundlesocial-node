import { Client, type OpenAPIConfig, OpenAPI, PostGetResponse, CommentGetResponse, TeamGetTeamResponse } from '../client';
import crypto from 'crypto';

export const webhookEventTypes = [
  "post.published",
  "comment.published",
  "team.created",
  "team.updated",
  "team.deleted",
  "social-account.created",
  "social-account.updated",
  "social-account.deleted",
] as const;

export type WebhookEventType = typeof webhookEventTypes[number];

type WebhookEventMap = {
  "post.published": PostGetResponse;
  "comment.published": CommentGetResponse;
  "team.created": TeamGetTeamResponse;
  "team.updated": TeamGetTeamResponse;
  "team.deleted": TeamGetTeamResponse;
  "social-account.created": TeamGetTeamResponse["socialAccounts"][number];
  "social-account.updated": TeamGetTeamResponse["socialAccounts"][number];
  "social-account.deleted": TeamGetTeamResponse["socialAccounts"][number];
};

export type WebhookEvent = {
  [K in keyof WebhookEventMap]: {
    type: K;
    data: WebhookEventMap[K];
  }
}[keyof WebhookEventMap];

class Webhooks {
  constructor() {}

  /**
   * Verify the signature of a webhook request
   * @param body - Stringified body of the webhook request
   * @param signature - The signature passed in the `x-signature` header
   * @param secret - The webhook secret used to sign the request
   * @returns Whether the signature is valid
   */
  private verifySignature(
    body: string,
    signature: string,
    secret: string,
  ): boolean {
    const sig = crypto.createHmac('sha256', secret).update(body).digest('hex');

    return sig === signature;
  }

  /**
   * Construct a webhook event from a request
   * @param rawBody - The raw body of the webhook request
   * @param signature - The signature passed in the `x-signature` header
   * @param secret - The webhook secret used to sign the request
   * @returns Parsed webhook event
   */
  public constructEvent(rawBody: string, signature: string, secret: string) {
    const body = typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody);

  if (!this.verifySignature(body, signature, secret)) {
    throw new Error('Invalid signature');
  }

  return JSON.parse(body) as WebhookEvent;
  }
}

export class Bundlesocial extends Client {
  public webhooks: Webhooks;

  constructor(apiKey: string, options?: OpenAPIConfig) {
    super({
      ...options,
      HEADERS: {
        ...OpenAPI.HEADERS,
        ...options?.HEADERS,
        'x-api-key': apiKey,
      },
    });

    this.webhooks = new Webhooks();
  }
}

export * from '../client/types.gen';
export { ApiError } from '../client/core/ApiError';
export { BaseHttpRequest } from '../client/core/BaseHttpRequest';
export { CancelablePromise, CancelError } from '../client/core/CancelablePromise';
export { OpenAPIConfig, OpenAPI };
