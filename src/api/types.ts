import type { PodSubmission, PodTemplate, Route } from '@/types';

export type ApiErrorBody = {
  message: string;
  deliveryId?: string;
};

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: ApiErrorBody };

export type GetRouteResponse = Route;

export type GetPodTemplateResponse = PodTemplate;

export type PostDeliveryRequest = PodSubmission;

export type PostDeliveryResponse = {
  deliveryId: string;
};
