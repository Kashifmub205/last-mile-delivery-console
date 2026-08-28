import uuid from 'react-native-uuid';
import type { ApiErrorBody } from '@/api/types';
import type { PodSubmission } from '@/types/pod';
import {
  findAcceptedDelivery,
  rememberAcceptedDelivery,
} from './acceptedDeliveriesStore';

export type MockPostRouteDeliverySuccess = {
  status: 201;
  data: {
    deliveryId: string;
  };
};

export type MockPostRouteDeliveryConflict = {
  status: 409;
  data: ApiErrorBody;
};

export type MockPostRouteDeliveryBadRequest = {
  status: 400;
  data: ApiErrorBody;
};

export type MockPostRouteDeliveryResponse =
  | MockPostRouteDeliverySuccess
  | MockPostRouteDeliveryConflict
  | MockPostRouteDeliveryBadRequest;

function isPodSubmission(value: unknown): value is PodSubmission {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    typeof record.stopId === 'string' &&
    typeof record.templateId === 'string' &&
    typeof record.clientDeliveryId === 'string' &&
    typeof record.completedAt === 'string' &&
    Array.isArray(record.response)
  );
}

export function postRouteDelivery(
  _routeId: string,
  body: unknown,
  idempotencyKey: string,
): MockPostRouteDeliveryResponse {
  const existing = findAcceptedDelivery(idempotencyKey);

  if (existing) {
    return {
      status: 409,
      data: {
        message: 'Delivery already accepted',
        deliveryId: existing.deliveryId,
      },
    };
  }

  if (!isPodSubmission(body)) {
    return {
      status: 400,
      data: {
        message: 'Invalid delivery payload',
      },
    };
  }

  const deliveryId = String(uuid.v4());
  rememberAcceptedDelivery(idempotencyKey, deliveryId);

  return {
    status: 201,
    data: { deliveryId },
  };
}
