import type { PodFieldAnswer, PodField, PodTemplate } from '@/types/pod';

import { isSupportedField } from './isSupportedField';
import type { PodAnswers } from './types';
import { isFieldVisible } from './visibility';

function hasAnswerValue(value: PodAnswers[string] | undefined): boolean {
  if (value === undefined) {
    return false;
  }

  if (typeof value === 'string') {
    return value.length > 0;
  }

  return Array.isArray(value) && value.length > 0;
}

export function sanitizePodAnswers(
  template: PodTemplate,
  answers: PodAnswers,
): PodFieldAnswer[] {
  const sanitized: PodFieldAnswer[] = [];

  for (const field of template.fields) {
    if (!isSupportedField(field)) {
      continue;
    }

    if (!isFieldVisible(field, answers)) {
      continue;
    }

    const value = answers[field.id];
    if (!hasAnswerValue(value)) {
      continue;
    }

    sanitized.push({
      fieldId: field.id,
      value,
    });
  }

  return sanitized;
}

export function sanitizePodAnswersFromFields(
  fields: PodField[],
  answers: PodAnswers,
): PodFieldAnswer[] {
  return sanitizePodAnswers({ templateId: '', name: '', fields }, answers);
}
