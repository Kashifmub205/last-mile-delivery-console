import type { Coordinate } from './location';

export type StopStatus = 'pending' | 'active' | 'completed' | 'failed';

export type RouteStop = {
  id: string;
  sequence: number;
  customerName: string;
  address: string;
  parcelCount: number;
  windowEnd: string;
  templateId: string;
  dropZone: Coordinate[];
};

export type Route = {
  routeId: string;
  stops: RouteStop[];
};

export type RouteProgress = {
  routeId: string;
  activeStopId: string | null;
  completedStopIds: string[];
  stopStatuses: Record<string, StopStatus>;
};
