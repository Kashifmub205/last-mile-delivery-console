import { Text, TextInput } from 'react-native';

import { FieldShell } from '../FieldShell';
import { fieldStyles } from '../fieldStyles';
import type { PodFieldRendererProps } from '../../types';

export function TextFieldRenderer({
  field,
  value,
  onChange,
  error,
}: PodFieldRendererProps) {
  const textValue = typeof value === 'string' ? value : '';
  const maxLength = field.type === 'TEXT' ? field.maxLength : undefined;

  return (
    <FieldShell label={field.label} isRequired={field.isRequired} error={error}>
      <TextInput
        accessibilityLabel={field.label}
        style={[fieldStyles.input, error ? fieldStyles.inputError : null]}
        value={textValue}
        onChangeText={onChange}
        maxLength={maxLength}
        autoCapitalize="words"
      />
      {maxLength !== undefined ? (
        <Text style={fieldStyles.characterCount}>
          {textValue.length} / {maxLength}
        </Text>
      ) : null}
    </FieldShell>
  );
}
