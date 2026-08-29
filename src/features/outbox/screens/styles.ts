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
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  syncHint: typography.caption,
  list: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  emptyState: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  emptyTitle: typography.section,
  emptyText: typography.bodySecondary,
  card: {
    padding: spacing.lg,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    gap: spacing.sm,
  },
  cardFailed: {
    borderColor: colors.error,
    backgroundColor: colors.errorSoft,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  cardTitle: {
    ...typography.section,
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  metaLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textMuted,
    width: 88,
    paddingTop: 2,
  },
  metaValue: {
    ...typography.bodySecondary,
    flex: 1,
  },
  errorBox: {
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.sm,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.error,
    gap: spacing.sm,
  },
  errorBoxLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.error,
  },
  cardError: {
    ...typography.body,
    color: colors.error,
  },
  cardAction: {
    marginTop: spacing.sm,
  },
  cardMeta: {
    ...typography.caption,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
  },
  chip: {
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  chipText: {
    ...typography.caption,
    fontWeight: '600',
  },
  chipNeutral: {
    backgroundColor: colors.borderSoft,
  },
  chipTextNeutral: {
    color: colors.textMuted,
  },
  chipPrimary: {
    backgroundColor: colors.primarySoft,
  },
  chipTextPrimary: {
    color: colors.primary,
  },
  chipSuccess: {
    backgroundColor: colors.successSoft,
  },
  chipTextSuccess: {
    color: colors.success,
  },
  chipWarning: {
    backgroundColor: colors.warningSoft,
  },
  chipTextWarning: {
    color: colors.warning,
  },
  chipError: {
    backgroundColor: colors.white,
  },
  chipTextError: {
    color: colors.error,
  },
  devPanel: {
    marginTop: spacing.xxl,
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  devPanelTitle: {
    ...typography.section,
  },
  devPanelHint: typography.caption,
  button: {
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
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
});
