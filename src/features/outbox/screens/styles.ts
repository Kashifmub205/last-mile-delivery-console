import { StyleSheet } from 'react-native';
import { colors, radii, spacing, typography } from '@/theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
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
  mockControls: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  mockControlsTitle: typography.section,
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
  buttonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonDisabled: {
    opacity: 0.5,
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
  emptyText: {
    ...typography.bodySecondary,
    marginTop: spacing.lg,
  },
  card: {
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  cardTitle: {
    ...typography.section,
  },
  cardLine: typography.body,
  cardError: {
    ...typography.body,
    color: colors.error,
  },
  cardAction: {
    alignSelf: 'flex-start',
  },
  cardMeta: typography.caption,
});
