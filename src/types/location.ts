export type Coordinate = {
  latitude: number;
  longitude: number;
};

export type LocationFix = Coordinate & {
  recordedAt: string;
  accuracyMeters?: number;
};
