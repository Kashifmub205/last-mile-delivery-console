import type { ComponentType } from 'react';

import type { PodField } from '@/types/pod';

import { CheckboxFieldRenderer } from '../components/renderers/CheckboxFieldRenderer';
import { DatetimeFieldRenderer } from '../components/renderers/DatetimeFieldRenderer';
import { DropdownFieldRenderer } from '../components/renderers/DropdownFieldRenderer';
import { TextFieldRenderer } from '../components/renderers/TextFieldRenderer';
import { TextareaFieldRenderer } from '../components/renderers/TextareaFieldRenderer';
import { UnsupportedFieldRenderer } from '../components/renderers/UnsupportedFieldRenderer';
import type { PodFieldRendererProps } from '../types';

export const podFieldRendererRegistry: Record<
  PodField['type'],
  ComponentType<PodFieldRendererProps>
> = {
  TEXT: TextFieldRenderer,
  TEXTAREA: TextareaFieldRenderer,
  DROPDOWN: DropdownFieldRenderer,
  CHECKBOX: CheckboxFieldRenderer,
  DATETIME: DatetimeFieldRenderer,
  UNSUPPORTED: UnsupportedFieldRenderer,
};
