import { Client, type OpenAPIConfig, OpenAPI, PostGetResponse, CommentGetResponse, TeamGetTeamResponse } from '../client';
import crypto from 'crypto';

export enum WebhookEventEnum {
  POST_PUBLISHED = "post.published",
  COMMENT_PUBLISHED = "comment.published",
  TEAM_CREATED = "team.created",
  TEAM_UPDATED = "team.updated",
  TEAM_DELETED = "team.deleted",
  SOCIAL_ACCOUNT_CREATED = "social-account.created",
  SOCIAL_ACCOUNT_UPDATED = "social-account.updated",
  SOCIAL_ACCOUNT_DELETED = "social-account.deleted",
}

export type WebhookEvent = {
  type: WebhookEventEnum.POST_PUBLISHED;
  data: PostGetResponse;
} | {
  type: WebhookEventEnum.COMMENT_PUBLISHED;
  data: CommentGetResponse;
} | {
  type: WebhookEventEnum.TEAM_CREATED;
  data: TeamGetTeamResponse;
} | {
  type: WebhookEventEnum.TEAM_UPDATED;
  data: TeamGetTeamResponse;
} | {
  type: WebhookEventEnum.TEAM_DELETED;
  data: TeamGetTeamResponse;
} | {
  type: WebhookEventEnum.SOCIAL_ACCOUNT_CREATED;
  data: TeamGetTeamResponse['socialAccounts'][number];
} | {
  type: WebhookEventEnum.SOCIAL_ACCOUNT_UPDATED;
  data: TeamGetTeamResponse['socialAccounts'][number];
} | {
  type: WebhookEventEnum.SOCIAL_ACCOUNT_DELETED;
  data: TeamGetTeamResponse['socialAccounts'][number];
}

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
