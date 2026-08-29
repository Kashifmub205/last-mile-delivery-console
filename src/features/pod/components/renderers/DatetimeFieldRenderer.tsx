import { TextInput } from 'react-native';

import type { PodFieldRendererProps } from '../../types';
import { colors } from '@/theme';
import { FieldShell } from '../FieldShell';
import { fieldStyles } from '../fieldStyles';

export function DatetimeFieldRenderer({
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
        style={[fieldStyles.input, error ? fieldStyles.inputError : null]}
        value={textValue}
        onChangeText={onChange}
        placeholder="Enter date and time"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </FieldShell>
  );
}
