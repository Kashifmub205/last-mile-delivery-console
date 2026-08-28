import type { PodFieldAnswer } from './pod';
import type { Coordinate } from './location';

export type OutboxState =
  | 'QUEUED'
  | 'SYNCING'
  | 'RETRYING'
  | 'FAILED'
  | 'SYNCED';

export type OutboxDelivery = {
  clientDeliveryId: string;
  routeId: string;
  stopId: string;
  templateId: string;
  completedAt: string;
  location: Coordinate;
  response: PodFieldAnswer[];
  state: OutboxState;
  retryCount: number;
  createdAt: string;
  lastAttemptAt?: string;
  nextRetryAt?: string;
  lastError?: string;
};
