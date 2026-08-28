import type { PodField, PodAnswerValue } from '@/types/pod';

export type PodFieldRendererProps = {
  field: PodField;
  value: PodAnswerValue | undefined;
  onChange: (value: PodAnswerValue) => void;
  error?: string;
};
