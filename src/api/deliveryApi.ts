import axios from 'axios';
import type {
  ApiResult,
  GetPodTemplateResponse,
  GetRouteResponse,
  PostDeliveryResponse,
} from '@/api/types';
import { IDEMPOTENCY_KEY_HEADER } from '@/constants/api';
import { classifyDeliveryFailureStatus } from '@/domain/sync/classifyDeliveryFailure';
import { parsePodTemplate, parseRoute } from '@/mock/parse';
import type { PodSubmission } from '@/types/pod';
import { axiosClient } from './axiosClient';

export type PostDeliveryResult =
  | { outcome: 'synced'; deliveryId: string; duplicate: boolean }
  | {
      outcome: 'failed';
      message: string;
      status: number;
      retryable: boolean;
    };

function readDeliveryId(value: unknown): string | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const deliveryId = (value as Record<string, unknown>).deliveryId;
  return typeof deliveryId === 'string' ? deliveryId : undefined;
}

function readErrorMessage(value: unknown, fallback: string): string {
  if (!value || typeof value !== 'object') {
    return fallback;
  }

  const message = (value as Record<string, unknown>).message;
  return typeof message === 'string' ? message : fallback;
}

function isSuccessStatus(status: number): boolean {
  return status >= 200 && status < 300;
}

function resolve409Result(data: unknown): PostDeliveryResult {
  const deliveryId = readDeliveryId(data);

  if (deliveryId) {
    return {
      outcome: 'synced',
      deliveryId,
      duplicate: true,
    };
  }

  return {
    outcome: 'failed',
    message: readErrorMessage(data, 'Delivery already accepted'),
    status: 409,
    retryable: false,
  };
}

function toApiFailure(
  status: number,
  data: unknown,
  fallback: string,
): ApiResult<never> {
  return {
    ok: false,
    status,
    error: {
      message: readErrorMessage(data, fallback),
    },
  };
}

export async function getRoute(): Promise<ApiResult<GetRouteResponse>> {
  try {
    const response = await axiosClient.get<unknown>('/route');

    if (!isSuccessStatus(response.status)) {
      return toApiFailure(
        response.status,
        response.data,
        `Request failed with status ${response.status}`,
      );
    }

    const parsed = parseRoute(response.data);

    if (!parsed.ok) {
      return {
        ok: false,
        status: response.status,
        error: { message: parsed.error },
      };
    }

    return { ok: true, data: parsed.value };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return toApiFailure(
        error.response.status,
        error.response.data,
        error.message,
      );
    }

    return {
      ok: false,
      status: 0,
      error: { message: 'Network request failed' },
    };
  }
}

export async function getPodTemplate(
  templateId: string,
): Promise<ApiResult<GetPodTemplateResponse>> {
  try {
    const response = await axiosClient.get<unknown>(
      `/pod-templates/${encodeURIComponent(templateId)}`,
    );

    if (!isSuccessStatus(response.status)) {
      return toApiFailure(
        response.status,
        response.data,
        `Request failed with status ${response.status}`,
      );
    }

    const parsed = parsePodTemplate(response.data);

    if (!parsed.ok) {
      return {
        ok: false,
        status: response.status,
        error: { message: parsed.error },
      };
    }

    return { ok: true, data: parsed.value };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return toApiFailure(
        error.response.status,
        error.response.data,
        error.message,
      );
    }

    return {
      ok: false,
      status: 0,
      error: { message: 'Network request failed' },
    };
  }
}

export async function postRouteDelivery(
  routeId: string,
  submission: PodSubmission,
  idempotencyKey: string,
): Promise<PostDeliveryResult> {
  try {
    const response = await axiosClient.post<PostDeliveryResponse>(
      `/routes/${routeId}/deliveries`,
      submission,
      {
        headers: {
          [IDEMPOTENCY_KEY_HEADER]: idempotencyKey,
        },
      },
    );

    if (response.status === 409) {
      return resolve409Result(response.data);
    }

    if (!isSuccessStatus(response.status)) {
      return {
        outcome: 'failed',
        message: readErrorMessage(
          response.data,
          `Request failed with status ${response.status}`,
        ),
        status: response.status,
        retryable:
          classifyDeliveryFailureStatus(response.status) === 'retryable',
      };
    }

    const deliveryId = readDeliveryId(response.data);

    if (!deliveryId) {
      return {
        outcome: 'failed',
        message: 'Delivery response did not include deliveryId',
        status: response.status,
        retryable:
          classifyDeliveryFailureStatus(response.status) === 'retryable',
      };
    }

    return {
      outcome: 'synced',
      deliveryId,
      duplicate: false,
    };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 409) {
      return resolve409Result(error.response.data);
    }

    if (axios.isAxiosError(error) && error.response) {
      const status = error.response.status;

      return {
        outcome: 'failed',
        message: readErrorMessage(error.response.data, error.message),
        status,
        retryable: classifyDeliveryFailureStatus(status) === 'retryable',
      };
    }

    return {
      outcome: 'failed',
      message: 'Network request failed',
      status: 0,
      retryable: true,
    };
  }
}
