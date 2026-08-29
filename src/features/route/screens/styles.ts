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
  statusStrip: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
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
    backgroundColor: colors.errorSoft,
  },
  chipTextError: {
    color: colors.error,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  warningBanner: {
    marginTop: spacing.lg,
    backgroundColor: colors.warningSoft,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.warning,
    borderLeftWidth: 4,
    padding: spacing.lg,
  },
  warningBannerTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.warning,
    marginBottom: spacing.sm,
  },
  warningBannerBody: typography.bodySecondary,
  zonePanel: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.lg,
  },
  sectionEyebrow: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  activeStopName: {
    ...typography.section,
  },
  zoneRows: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    gap: spacing.sm,
  },
  zoneRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  zoneLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textMuted,
    width: 88,
    paddingTop: 2,
  },
  zoneValueSlot: {
    flex: 1,
  },
  zoneValue: {
    ...typography.bodySecondary,
  },
  zoneActions: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
  },
  helperText: {
    ...typography.caption,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    ...typography.section,
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  stopList: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    overflow: 'hidden',
  },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
    gap: spacing.md,
  },
  stopRowLast: {
    borderBottomWidth: 0,
  },
  stopRowActive: {
    backgroundColor: colors.primarySoft,
  },
  stopCopy: {
    flex: 1,
  },
  stopName: {
    ...typography.body,
    fontWeight: '600',
  },
  stopMeta: typography.caption,
  actions: {
    marginTop: spacing.xxl,
    gap: spacing.md,
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
  devButton: {
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  devButtonText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
});
