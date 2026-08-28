export type ZoneState = 'OUTSIDE' | 'AT_STOP' | 'DEPARTED_EARLY';

export type ActiveStopZone = {
  stopId: string;
  zoneState: ZoneState;
  departedAt: string | null;
  arrivedAt: string | null;
};
