import type { PodField, PodAnswerValue } from '@/types/pod';

import type { PodAnswers } from './types';

function readComparableAnswer(
  value: PodAnswerValue | undefined,
): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    return value[0];
  }

  return undefined;
}

export function isFieldVisible(field: PodField, answers: PodAnswers): boolean {
  if (!field.visibleWhen) {
    return true;
  }

  const dependencyValue = readComparableAnswer(
    answers[field.visibleWhen.fieldId],
  );
  return dependencyValue === field.visibleWhen.equals;
}

export function getVisibleFields(
  fields: PodField[],
  answers: PodAnswers,
): PodField[] {
  return fields.filter(field => isFieldVisible(field, answers));
}
