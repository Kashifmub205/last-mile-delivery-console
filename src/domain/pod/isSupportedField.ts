import type { PodField, UnsupportedPodField } from '@/types/pod';

export function isSupportedField(
  field: PodField,
): field is Exclude<PodField, UnsupportedPodField> {
  return field.type !== 'UNSUPPORTED';
}

export function isUnsupportedField(
  field: PodField,
): field is UnsupportedPodField {
  return field.type === 'UNSUPPORTED';
}
