import type { ApiErrorBody, ApiResult } from './types';

export class ApiError extends Error {
  readonly status: number;
  readonly body: ApiErrorBody;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message);
    this.status = status;
    this.body = body;
  }
}

export async function requestJson<T>(
  input: string,
  init?: RequestInit,
): Promise<ApiResult<T>> {
  try {
    const response = await fetch(input, init);
    const text = await response.text();
    const body = text.length > 0 ? (JSON.parse(text) as unknown) : null;

    if (!response.ok) {
      const errorBody =
        body && typeof body === 'object' && 'message' in body
          ? (body as ApiErrorBody)
          : { message: response.statusText || 'Request failed' };

      return {
        ok: false,
        status: response.status,
        error: errorBody,
      };
    }

    return { ok: true, data: body as T };
  } catch {
    return {
      ok: false,
      status: 0,
      error: { message: 'Network request failed' },
    };
  }
}
