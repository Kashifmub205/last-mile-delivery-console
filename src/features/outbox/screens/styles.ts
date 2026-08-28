import { StyleSheet } from 'react-native';
import { colors, radii, spacing, typography } from '@/theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  title: {
    ...typography.title,
    marginBottom: spacing.sm,
  },
  subtitle: typography.bodySecondary,
  actions: {
    marginTop: spacing.xxl,
    gap: spacing.md,
  },
  button: {
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonSecondaryText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
});
