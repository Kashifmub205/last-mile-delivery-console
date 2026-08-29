import type { ApiErrorBody } from '@/api/types';
import { POD_TEMPLATE_FIXTURE_BY_ID } from '@/mock/fixtures';
import type { PodTemplate } from '@/types/pod';

export type MockGetPodTemplateSuccess = {
  status: 200;
  data: PodTemplate;
};

export type MockGetPodTemplateNotFound = {
  status: 404;
  data: ApiErrorBody;
};

export type MockGetPodTemplateResponse =
  | MockGetPodTemplateSuccess
  | MockGetPodTemplateNotFound;

export function getPodTemplate(templateId: string): MockGetPodTemplateResponse {
  const template = POD_TEMPLATE_FIXTURE_BY_ID[templateId];

  if (!template) {
    return {
      status: 404,
      data: {
        message: `POD template not found: ${templateId}`,
      },
    };
  }

  return {
    status: 200,
    data: template,
  };
}
