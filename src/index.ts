import { Client, type OpenAPIConfig, OpenAPI, PostGetResponse } from '../client';
import crypto from 'crypto';

export type WebhookEventType = 'post.published';
export type WebhookEvent = {
  type: 'post.published';
  data: PostGetResponse;
};

class Webhooks {
  constructor() {}

  /**
   * Verify the signature of a webhook request
   * @param rawBody - The raw body of the webhook request
   * @param signature - The signature passed in the `x-signature` header
   * @param secret - The webhook secret used to sign the request
   * @returns Whether the signature is valid
   */
  private verifySignature(
    rawBody: string,
    signature: string,
    secret: string,
  ): boolean {
    const body = typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody);

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
    if (!this.verifySignature(rawBody, signature, secret)) {
      throw new Error('Invalid signature');
    }

    return JSON.parse(rawBody) as WebhookEvent;
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
