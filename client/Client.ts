import type { BaseHttpRequest } from './core/BaseHttpRequest';
import type { OpenAPIConfig } from './core/OpenAPI';
import { Interceptors } from './core/OpenAPI';
import { FetchHttpRequest } from './core/FetchHttpRequest';

import { AnalyticsService } from './services.gen';
import { AppService } from './services.gen';
import { CommentService } from './services.gen';
import { FacebookService } from './services.gen';
import { GoogleBusinessService } from './services.gen';
import { InstagramService } from './services.gen';
import { LinkedinService } from './services.gen';
import { MastodonService } from './services.gen';
import { MiscService } from './services.gen';
import { OrganizationService } from './services.gen';
import { PinterestService } from './services.gen';
import { PostService } from './services.gen';
import { RedditService } from './services.gen';
import { SlackService } from './services.gen';
import { SocialAccountService } from './services.gen';
import { TeamService } from './services.gen';
import { UploadService } from './services.gen';
import { YoutubeService } from './services.gen';

type HttpRequestConstructor = new (config: OpenAPIConfig) => BaseHttpRequest;

export class Client {

	public readonly analytics: AnalyticsService;
	public readonly app: AppService;
	public readonly comment: CommentService;
	public readonly facebook: FacebookService;
	public readonly googleBusiness: GoogleBusinessService;
	public readonly instagram: InstagramService;
	public readonly linkedin: LinkedinService;
	public readonly mastodon: MastodonService;
	public readonly misc: MiscService;
	public readonly organization: OrganizationService;
	public readonly pinterest: PinterestService;
	public readonly post: PostService;
	public readonly reddit: RedditService;
	public readonly slack: SlackService;
	public readonly socialAccount: SocialAccountService;
	public readonly team: TeamService;
	public readonly upload: UploadService;
	public readonly youtube: YoutubeService;

	public readonly request: BaseHttpRequest;

	constructor(config?: Partial<OpenAPIConfig>, HttpRequest: HttpRequestConstructor = FetchHttpRequest) {
		this.request = new HttpRequest({
			BASE: config?.BASE ?? 'https://api.bundle.social',
			VERSION: config?.VERSION ?? '1.0.0',
			WITH_CREDENTIALS: config?.WITH_CREDENTIALS ?? false,
			CREDENTIALS: config?.CREDENTIALS ?? 'include',
			TOKEN: config?.TOKEN,
			USERNAME: config?.USERNAME,
			PASSWORD: config?.PASSWORD,
			HEADERS: config?.HEADERS,
			ENCODE_PATH: config?.ENCODE_PATH,
			interceptors: {
				request: config?.interceptors?.request ?? new Interceptors(),
				response: config?.interceptors?.response ?? new Interceptors(),
      },
		});

		this.analytics = new AnalyticsService(this.request);
		this.app = new AppService(this.request);
		this.comment = new CommentService(this.request);
		this.facebook = new FacebookService(this.request);
		this.googleBusiness = new GoogleBusinessService(this.request);
		this.instagram = new InstagramService(this.request);
		this.linkedin = new LinkedinService(this.request);
		this.mastodon = new MastodonService(this.request);
		this.misc = new MiscService(this.request);
		this.organization = new OrganizationService(this.request);
		this.pinterest = new PinterestService(this.request);
		this.post = new PostService(this.request);
		this.reddit = new RedditService(this.request);
		this.slack = new SlackService(this.request);
		this.socialAccount = new SocialAccountService(this.request);
		this.team = new TeamService(this.request);
		this.upload = new UploadService(this.request);
		this.youtube = new YoutubeService(this.request);
	}
}
