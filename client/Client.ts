import type { BaseHttpRequest } from './core/BaseHttpRequest';
import type { OpenAPIConfig } from './core/OpenAPI';
import { Interceptors } from './core/OpenAPI';
import { FetchHttpRequest } from './core/FetchHttpRequest';

import { AppService } from './services.gen';
import { OrganizationService } from './services.gen';
import { PostService } from './services.gen';
import { SocialAccountService } from './services.gen';
import { TeamService } from './services.gen';
import { UploadService } from './services.gen';

type HttpRequestConstructor = new (config: OpenAPIConfig) => BaseHttpRequest;

export class Client {

	public readonly app: AppService;
	public readonly organization: OrganizationService;
	public readonly post: PostService;
	public readonly socialAccount: SocialAccountService;
	public readonly team: TeamService;
	public readonly upload: UploadService;

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

		this.app = new AppService(this.request);
		this.organization = new OrganizationService(this.request);
		this.post = new PostService(this.request);
		this.socialAccount = new SocialAccountService(this.request);
		this.team = new TeamService(this.request);
		this.upload = new UploadService(this.request);
	}
}
