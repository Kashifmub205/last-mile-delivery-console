import { TextInput } from 'react-native';

import { FieldShell } from '../FieldShell';
import { fieldStyles } from '../fieldStyles';
import type { PodFieldRendererProps } from '../../types';

export function TextareaFieldRenderer({
  field,
  value,
  onChange,
  error,
}: PodFieldRendererProps) {
  const textValue = typeof value === 'string' ? value : '';

  return (
    <FieldShell label={field.label} isRequired={field.isRequired} error={error}>
      <TextInput
        accessibilityLabel={field.label}
        style={[
          fieldStyles.input,
          fieldStyles.textArea,
          error ? fieldStyles.inputError : null,
        ]}
        value={textValue}
        onChangeText={onChange}
        multiline
      />
    </FieldShell>
  );
}
