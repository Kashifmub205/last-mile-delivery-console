import { Pressable, Text } from 'react-native';

import { FieldShell } from '../FieldShell';
import { fieldStyles } from '../fieldStyles';
import type { PodFieldRendererProps } from '../../types';

export function DropdownFieldRenderer({
  field,
  value,
  onChange,
  error,
}: PodFieldRendererProps) {
  const selectedValue = typeof value === 'string' ? value : '';

  return (
    <FieldShell label={field.label} isRequired={field.isRequired} error={error}>
      <Pressable style={fieldStyles.optionRow} accessibilityRole="menu">
        {field.type === 'DROPDOWN'
          ? field.options.map(option => {
              const isSelected = selectedValue === option;

              return (
                <Pressable
                  key={option}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  style={[
                    fieldStyles.option,
                    isSelected ? fieldStyles.optionSelected : null,
                  ]}
                  onPress={() => onChange(option)}
                >
                  <Text
                    style={[
                      fieldStyles.optionText,
                      isSelected ? fieldStyles.optionTextSelected : null,
                    ]}
                  >
                    {option}
                  </Text>
                </Pressable>
              );
            })
          : null}
      </Pressable>
    </FieldShell>
  );
}
