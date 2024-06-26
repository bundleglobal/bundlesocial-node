import { Client, type OpenAPIConfig, OpenAPI } from '../client';

export class Bundlesocial extends Client {
  constructor(apiKey: string, options?: OpenAPIConfig) {
    super({
      ...options,
      HEADERS: {
        ...OpenAPI.HEADERS,
        ...options?.HEADERS,
        'x-api-key': apiKey,
      },
    });
  }
}

export * from '../client/types.gen';
export { ApiError } from '../client/core/ApiError';
export { BaseHttpRequest } from '../client/core/BaseHttpRequest';
export { CancelablePromise, CancelError } from '../client/core/CancelablePromise';
export { OpenAPIConfig, OpenAPI };
