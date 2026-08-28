import type { PodAnswerValue, PodField } from '@/types/pod';

import { isSupportedField } from './isSupportedField';
import type { PodAnswers, PodFieldErrors } from './types';
import { isFieldVisible } from './visibility';

function isEmptyValue(
  field: Exclude<PodField, { type: 'UNSUPPORTED' }>,
  value: PodAnswerValue | undefined,
): boolean {
  if (value === undefined) {
    return true;
  }

  switch (field.type) {
    case 'TEXT':
    case 'TEXTAREA':
    case 'DROPDOWN':
    case 'DATETIME':
      return typeof value !== 'string' || value.trim().length === 0;
    case 'CHECKBOX':
      return !Array.isArray(value) || value.length === 0;
    default:
      return true;
  }
}

function validateFieldValue(
  field: Exclude<PodField, { type: 'UNSUPPORTED' }>,
  value: PodAnswerValue | undefined,
): string | null {
  if (field.isRequired && isEmptyValue(field, value)) {
    return `${field.label} is required`;
  }

  if (value === undefined || isEmptyValue(field, value)) {
    return null;
  }

  if (field.type === 'DROPDOWN') {
    if (typeof value !== 'string' || !field.options.includes(value)) {
      return `${field.label} has an invalid selection`;
    }
  }

  if (field.type === 'CHECKBOX') {
    if (!Array.isArray(value)) {
      return `${field.label} has an invalid selection`;
    }

    const hasInvalidOption = value.some(
      option => !field.options.includes(option),
    );
    if (hasInvalidOption) {
      return `${field.label} has an invalid selection`;
    }
  }

  return null;
}

export function validatePodForm(
  fields: PodField[],
  answers: PodAnswers,
): PodFieldErrors {
  const errors: PodFieldErrors = {};

  for (const field of fields) {
    if (!isSupportedField(field)) {
      continue;
    }

    if (!isFieldVisible(field, answers)) {
      continue;
    }

    const error = validateFieldValue(field, answers[field.id]);
    if (error) {
      errors[field.id] = error;
    }
  }

  return errors;
}
