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
  stopList: {
    marginTop: spacing.xxl,
    gap: spacing.md,
  },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.md,
  },
  stopCopy: {
    flex: 1,
    marginRight: spacing.md,
  },
  stopName: {
    ...typography.body,
    fontWeight: '600',
  },
  stopMeta: typography.caption,
  stopStatus: {
    ...typography.caption,
    fontWeight: '600',
  },
  stopStatus_PENDING: {
    color: colors.textMuted,
  },
  stopStatus_ACTIVE: {
    color: colors.primary,
  },
  stopStatus_COMPLETED: {
    color: colors.success,
  },
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
  buttonDisabled: {
    opacity: 0.5,
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
