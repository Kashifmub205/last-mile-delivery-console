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
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  form: {
    marginTop: spacing.lg,
    gap: spacing.lg,
  },
  actions: {
    marginTop: spacing.xxl,
    gap: spacing.sm,
  },
  formError: {
    ...typography.caption,
    color: colors.error,
  },
  button: {
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonPrimaryText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.white,
  },
});
