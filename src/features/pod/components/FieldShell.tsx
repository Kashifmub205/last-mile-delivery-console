import { Text, View } from 'react-native';
import type { ReactNode } from 'react';

import { fieldStyles } from './fieldStyles';

type FieldShellProps = {
  label: string;
  isRequired: boolean;
  error?: string;
  children: ReactNode;
};

export function FieldShell({
  label,
  isRequired,
  error,
  children,
}: FieldShellProps) {
  return (
    <View style={fieldStyles.field}>
      <Text style={fieldStyles.label}>
        {label}
        {isRequired ? <Text style={fieldStyles.requiredMark}> *</Text> : null}
      </Text>
      {children}
      {error ? <Text style={fieldStyles.error}>{error}</Text> : null}
    </View>
  );
}
