import { Text } from 'react-native';

import { FieldShell } from '../FieldShell';
import { fieldStyles } from '../fieldStyles';
import type { PodFieldRendererProps } from '../../types';

export function UnsupportedFieldRenderer({ field }: PodFieldRendererProps) {
  const originalType =
    field.type === 'UNSUPPORTED' ? field.originalType : field.type;

  return (
    <FieldShell label={field.label} isRequired={field.isRequired}>
      <Text style={fieldStyles.unsupported}>
        Unsupported field type: {originalType}
      </Text>
    </FieldShell>
  );
}
