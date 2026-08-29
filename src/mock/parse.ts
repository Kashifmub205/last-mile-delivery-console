import type { Coordinate } from '@/types/location';
import type { PodField, PodTemplate } from '@/types/pod';
import type { Route, RouteStop } from '@/types/route';
import { sortRouteStops } from '@/domain/route/sortRouteStops';

const SUPPORTED_POD_FIELD_TYPES = new Set([
  'TEXT',
  'TEXTAREA',
  'DROPDOWN',
  'CHECKBOX',
  'DATETIME',
]);

type ParseSuccess<T> = { ok: true; value: T };
type ParseFailure = { ok: false; error: string };
export type ParseResult<T> = ParseSuccess<T> | ParseFailure;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(
  record: Record<string, unknown>,
  key: string,
): string | null {
  const value = record[key];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function readNumber(
  record: Record<string, unknown>,
  key: string,
): number | null {
  const value = record[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function readStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const items = value.filter(
    (item): item is string => typeof item === 'string',
  );
  return items.length === value.length ? items : null;
}

function parseCoordinate(value: unknown): Coordinate | null {
  if (!isRecord(value)) {
    return null;
  }

  const latitude = readNumber(value, 'latitude');
  const longitude = readNumber(value, 'longitude');

  if (latitude === null || longitude === null) {
    return null;
  }

  return { latitude, longitude };
}

function parseDropZone(value: unknown): Coordinate[] | null {
  if (!Array.isArray(value) || value.length < 3) {
    return null;
  }

  const coordinates = value.map(parseCoordinate);
  if (coordinates.some(coordinate => coordinate === null)) {
    return null;
  }

  return coordinates as Coordinate[];
}

function parseVisibleWhen(
  value: unknown,
): { fieldId: string; equals: string } | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!isRecord(value)) {
    return undefined;
  }

  const fieldId = readString(value, 'fieldId');
  const equals = readString(value, 'equals');

  if (!fieldId || equals === null) {
    return undefined;
  }

  return { fieldId, equals };
}

function parseMaxLength(value: unknown): number | undefined {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 1) {
    return undefined;
  }

  return value;
}

function toUnsupportedField(
  base: {
    id: string;
    label: string;
    isRequired: boolean;
    visibleWhen?: { fieldId: string; equals: string };
  },
  originalType: string,
): PodField {
  return {
    ...base,
    type: 'UNSUPPORTED',
    originalType,
  };
}

function parsePodField(value: unknown): PodField | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = readString(value, 'id');
  const label = readString(value, 'label');
  const rawType = readString(value, 'type');
  const isRequired = value.isRequired === true;

  if (!id || !label || !rawType) {
    return null;
  }

  const visibleWhen = parseVisibleWhen(value.visibleWhen);
  const base = {
    id,
    label,
    isRequired,
    ...(visibleWhen ? { visibleWhen } : {}),
  };

  if (!SUPPORTED_POD_FIELD_TYPES.has(rawType)) {
    return toUnsupportedField(base, rawType);
  }

  if (rawType === 'DROPDOWN' || rawType === 'CHECKBOX') {
    const options = readStringArray(value.options);
    if (!options || options.length === 0) {
      return toUnsupportedField(base, rawType);
    }

    return rawType === 'DROPDOWN'
      ? { ...base, type: 'DROPDOWN', options }
      : { ...base, type: 'CHECKBOX', options };
  }

  if (rawType === 'TEXT' || rawType === 'TEXTAREA') {
    const maxLength = parseMaxLength(value.maxLength);
    return {
      ...base,
      type: rawType,
      ...(maxLength !== undefined ? { maxLength } : {}),
    };
  }

  return { ...base, type: 'DATETIME' };
}

function parseRouteStop(value: unknown): RouteStop | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = readString(value, 'id');
  const sequence = readNumber(value, 'sequence');
  const customerName = readString(value, 'customerName');
  const address = readString(value, 'address');
  const parcelCount = readNumber(value, 'parcelCount');
  const windowEnd = readString(value, 'windowEnd');
  const templateId = readString(value, 'templateId');
  const dropZone = parseDropZone(value.dropZone);

  if (
    !id ||
    sequence === null ||
    !Number.isInteger(sequence) ||
    sequence < 1 ||
    !customerName ||
    !address ||
    parcelCount === null ||
    !windowEnd ||
    !templateId ||
    !dropZone
  ) {
    return null;
  }

  return {
    id,
    sequence,
    customerName,
    address,
    parcelCount,
    windowEnd,
    templateId,
    dropZone,
  };
}

function hasUniqueSequences(stops: RouteStop[]): boolean {
  const sequences = new Set(stops.map(stop => stop.sequence));
  return sequences.size === stops.length;
}

export function parseRoute(value: unknown): ParseResult<Route> {
  if (!isRecord(value)) {
    return { ok: false, error: 'Route must be an object' };
  }

  const routeId = readString(value, 'routeId');
  if (!routeId) {
    return { ok: false, error: 'Route is missing routeId' };
  }

  if (!Array.isArray(value.stops)) {
    return { ok: false, error: 'Route is missing stops array' };
  }

  const stops: RouteStop[] = [];
  for (const stopValue of value.stops) {
    const stop = parseRouteStop(stopValue);
    if (!stop) {
      return { ok: false, error: 'Route contains an invalid stop' };
    }
    stops.push(stop);
  }

  if (stops.length === 0) {
    return { ok: false, error: 'Route must contain at least one stop' };
  }

  if (!hasUniqueSequences(stops)) {
    return { ok: false, error: 'Route stops must have unique sequence values' };
  }

  return { ok: true, value: { routeId, stops: sortRouteStops(stops) } };
}

export function parsePodTemplate(value: unknown): ParseResult<PodTemplate> {
  if (!isRecord(value)) {
    return { ok: false, error: 'POD template must be an object' };
  }

  const templateId = readString(value, 'templateId');
  const name = readString(value, 'name');

  if (!templateId || !name) {
    return { ok: false, error: 'POD template is missing templateId or name' };
  }

  if (!Array.isArray(value.fields)) {
    return { ok: false, error: 'POD template is missing fields array' };
  }

  const fields: PodField[] = [];
  for (const fieldValue of value.fields) {
    const field = parsePodField(fieldValue);
    if (!field) {
      return { ok: false, error: 'POD template contains an invalid field' };
    }
    fields.push(field);
  }

  return { ok: true, value: { templateId, name, fields } };
}
