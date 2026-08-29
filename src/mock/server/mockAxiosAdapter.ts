import { AxiosError } from 'axios';
import type {
  AxiosAdapter,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { IDEMPOTENCY_KEY_HEADER } from '@/constants/api';
import { getPodTemplate } from './getPodTemplate';
import { getRoute } from './getRoute';
import {
  resolveDeliveryFailureInjection,
  waitForConfiguredMockLatency,
} from './mockDeliveryControls';
import { postRouteDelivery } from './postRouteDelivery';

function parseRequestBody(data: unknown): unknown {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data) as unknown;
    } catch {
      return data;
    }
  }

  return data;
}

function readHeader(
  config: InternalAxiosRequestConfig,
  name: string,
): string | undefined {
  const headers = config.headers;

  if (!headers) {
    return undefined;
  }

  if (typeof headers.get === 'function') {
    const value = headers.get(name);
    return typeof value === 'string' ? value : undefined;
  }

  const record = headers as Record<string, unknown>;
  const value = record[name] ?? record[name.toLowerCase()];

  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value) && typeof value[0] === 'string') {
    return value[0];
  }

  return undefined;
}

function buildResponseStatusText(status: number): string {
  if (status === 201) {
    return 'Created';
  }

  if (status === 200) {
    return 'OK';
  }

  if (status === 404) {
    return 'Not Found';
  }

  if (status === 409) {
    return 'Conflict';
  }

  if (status >= 500) {
    return 'Internal Server Error';
  }

  if (status >= 400) {
    return 'Bad Request';
  }

  return 'OK';
}

function buildResponse<T>(
  config: InternalAxiosRequestConfig,
  status: number,
  data: T,
): AxiosResponse<T> {
  return {
    data,
    status,
    statusText: buildResponseStatusText(status),
    headers: {},
    config,
  };
}

function matchPostRouteDelivery(url: string): { routeId: string } | null {
  const match = url.match(/^\/routes\/([^/]+)\/deliveries\/?$/);

  if (!match?.[1]) {
    return null;
  }

  return { routeId: match[1] };
}

function matchGetRoute(url: string): boolean {
  return /^\/route\/?$/.test(url);
}

function matchGetPodTemplate(url: string): { templateId: string } | null {
  const match = url.match(/^\/pod-templates\/([^/]+)\/?$/);

  if (!match?.[1]) {
    return null;
  }

  return { templateId: decodeURIComponent(match[1]) };
}

export const mockAxiosAdapter: AxiosAdapter = async config => {
  await waitForConfiguredMockLatency();

  const method = (config.method ?? 'get').toLowerCase();
  const url = config.url ?? '';

  if (method === 'get') {
    if (matchGetRoute(url)) {
      const result = getRoute();
      return buildResponse(config, result.status, result.data);
    }

    const templateMatch = matchGetPodTemplate(url);

    if (templateMatch) {
      const result = getPodTemplate(templateMatch.templateId);
      return buildResponse(config, result.status, result.data);
    }
  }

  if (method === 'post') {
    const routeMatch = matchPostRouteDelivery(url);

    if (routeMatch) {
      const idempotencyKey = readHeader(config, IDEMPOTENCY_KEY_HEADER);

      if (!idempotencyKey) {
        return buildResponse(config, 400, {
          message: 'Missing Idempotency-Key header',
        });
      }

      const injection = resolveDeliveryFailureInjection(idempotencyKey);

      if (injection.kind === 'network') {
        throw new AxiosError(
          'Network request failed',
          AxiosError.ERR_NETWORK,
          config,
        );
      }

      if (injection.kind === 'http') {
        return buildResponse(config, injection.status, {
          message: injection.message,
        });
      }

      const result = postRouteDelivery(
        routeMatch.routeId,
        parseRequestBody(config.data),
        idempotencyKey,
      );

      return buildResponse(config, result.status, result.data);
    }
  }

  return buildResponse(config, 404, {
    message: `No mock handler for ${method.toUpperCase()} ${url}`,
  });
};
