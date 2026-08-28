import { Pressable, Text, View } from 'react-native';

import { FieldShell } from '../FieldShell';
import { fieldStyles } from '../fieldStyles';
import type { PodFieldRendererProps } from '../../types';

function readSelectedValues(value: PodFieldRendererProps['value']): string[] {
  return Array.isArray(value) ? value : [];
}

export function CheckboxFieldRenderer({
  field,
  value,
  onChange,
  error,
}: PodFieldRendererProps) {
  const selectedValues = readSelectedValues(value);

  return (
    <FieldShell label={field.label} isRequired={field.isRequired} error={error}>
      {field.type === 'CHECKBOX'
        ? field.options.map(option => {
            const isSelected = selectedValues.includes(option);

            return (
              <Pressable
                key={option}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isSelected }}
                style={fieldStyles.checkboxRow}
                onPress={() => {
                  if (isSelected) {
                    onChange(selectedValues.filter(item => item !== option));
                    return;
                  }

                  onChange([...selectedValues, option]);
                }}
              >
                <View
                  style={[
                    fieldStyles.checkboxBox,
                    isSelected ? fieldStyles.checkboxBoxSelected : null,
                  ]}
                >
                  {isSelected ? (
                    <Text style={fieldStyles.checkboxMark}>✓</Text>
                  ) : null}
                </View>
                <Text style={fieldStyles.checkboxLabel}>{option}</Text>
              </Pressable>
            );
          })
        : null}
    </FieldShell>
  );
}
