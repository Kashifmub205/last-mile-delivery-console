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
  subtitle: {
    ...typography.bodySecondary,
    marginBottom: spacing.lg,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  form: {
    marginTop: spacing.md,
  },
  actions: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  button: {
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonPrimaryText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.white,
  },
  buttonSecondaryText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
});
