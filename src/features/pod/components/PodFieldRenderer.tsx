import type { PodField, PodAnswerValue } from '@/types/pod';

import { podFieldRendererRegistry } from '../registry/podFieldRegistry';

type PodFieldRendererContainerProps = {
  field: PodField;
  value: PodAnswerValue | undefined;
  onChange: (value: PodAnswerValue) => void;
  error?: string;
};

export function PodFieldRenderer({
  field,
  value,
  onChange,
  error,
}: PodFieldRendererContainerProps) {
  const Renderer = podFieldRendererRegistry[field.type];

  return (
    <Renderer field={field} value={value} onChange={onChange} error={error} />
  );
}
