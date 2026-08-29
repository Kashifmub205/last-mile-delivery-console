export type PodFieldType =
  | 'TEXT'
  | 'TEXTAREA'
  | 'DROPDOWN'
  | 'CHECKBOX'
  | 'DATETIME';

export type VisibleWhen = {
  fieldId: string;
  equals: string;
};

export type PodFieldBase = {
  id: string;
  label: string;
  isRequired: boolean;
  visibleWhen?: VisibleWhen;
};

export type TextPodField = PodFieldBase & {
  type: 'TEXT';
  maxLength?: number;
};

export type TextareaPodField = PodFieldBase & {
  type: 'TEXTAREA';
  maxLength?: number;
};

export type DatetimePodField = PodFieldBase & {
  type: 'DATETIME';
};

export type DropdownPodField = PodFieldBase & {
  type: 'DROPDOWN';
  options: string[];
};

export type CheckboxPodField = PodFieldBase & {
  type: 'CHECKBOX';
  options: string[];
};

export type UnsupportedPodField = PodFieldBase & {
  type: 'UNSUPPORTED';
  originalType: string;
};

export type PodField =
  | TextPodField
  | TextareaPodField
  | DatetimePodField
  | DropdownPodField
  | CheckboxPodField
  | UnsupportedPodField;

export type PodTemplate = {
  templateId: string;
  name: string;
  fields: PodField[];
};

export type PodAnswerValue = string | string[];

export type PodFieldAnswer = {
  fieldId: string;
  value: PodAnswerValue;
};

export type PodSubmission = {
  stopId: string;
  templateId: string;
  clientDeliveryId: string;
  completedAt: string;
  location: {
    latitude: number;
    longitude: number;
  };
  response: PodFieldAnswer[];
};
