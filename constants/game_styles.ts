import { StyleSheet } from "react-native";
import { Colors, Radius, Spacing } from "./theme";

export const GameStyles = StyleSheet.create({
  // --- Layout ---
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  statusRowFixed: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.l,
    paddingVertical: Spacing.m,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    zIndex: 5
  },
  scrollContent: {
    paddingHorizontal: Spacing.l,
    paddingBottom: 120,
    paddingTop: Spacing.xl
  },

  // --- Typography ---
  phaseTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: 'bold'
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: 'bold'
  },
  sectionLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: Spacing.m
  },
  divider: {
    height: 1,
    backgroundColor: Colors.overlayLight,
    marginVertical: Spacing.m
  },

  // --- Badges ---
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.s,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: Spacing.xs
  },
  badgeSuccess: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary
  },
  badgeError: {
    backgroundColor: Colors.dangerLight,
    borderColor: Colors.danger
  },
  badgeNeutral: {
    backgroundColor: Colors.surfaceInner,
    borderColor: Colors.border
  },
  badgeQS: {
    backgroundColor: Colors.overlayLight,
    borderColor: 'rgba(255, 255, 255, 0.3)'
  },
  badgeTen: {
    backgroundColor: Colors.dangerLight,
    borderColor: 'rgba(255, 82, 82, 0.3)'
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold'
  },

  // --- Footers & Buttons ---
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.l,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border
  },
  disabledButton: {
    backgroundColor: Colors.surfaceLight,
    shadowOpacity: 0,
    elevation: 0
  },

  // --- Game Over View ---
  gameOverContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xl
  },
  gameOverText: {
    color: Colors.primary,
    fontSize: 24,
    fontWeight: 'bold'
  },

  // --- Modals ---
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlayDark,
    justifyContent: 'center',
    padding: Spacing.s
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    paddingBottom: 30
  },
  modalTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: Spacing.xl,
    textAlign: 'center'
  },
  modalStatusRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.m,
    marginBottom: Spacing.xl
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xl,
    paddingTop: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.border
  },
  modalCancel: {
    padding: Spacing.m
  },
  modalSave: {
    backgroundColor: Colors.primary,
    padding: Spacing.m,
    borderRadius: Radius.sm
  },

  // --- Tarneeb/400 Specific ---
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.m
  },
  playerOption: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: Spacing.xl,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center'
  },
  playerOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight
  },
  teamNameBig: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: Spacing.xs
  },
  teamPlayers: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'center'
  },
  bidGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.m,
    justifyContent: 'center'
  },
  bidOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border
  },
  bidOptionActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary
  },
  bidOptionText: {
    color: Colors.text,
    fontWeight: 'bold',
    fontSize: 18
  },
  scoringContainer: {
    gap: Spacing.xl
  },
  counterCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border
  },
  counterLabel: {
    color: Colors.textMuted,
    fontSize: 14,
    textTransform: 'uppercase',
    fontWeight: 'bold',
    marginBottom: Spacing.xl
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xxl
  },
  counterBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center'
  },
  counterBtnText: {
    color: Colors.text,
    fontSize: 32,
    marginTop: -4
  },
  counterValue: {
    color: Colors.text,
    fontSize: 56,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    minWidth: 80,
    textAlign: 'center'
  },
  previewCard: {
    borderRadius: Radius.lg,
    padding: Spacing.l,
    borderWidth: 1
  },
  previewSuccess: {
    backgroundColor: Colors.primaryLight,
    borderColor: 'rgba(15, 157, 88, 0.3)'
  },
  previewFail: {
    backgroundColor: Colors.dangerLight,
    borderColor: 'rgba(255, 82, 82, 0.3)'
  },
  previewTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: Spacing.m
  },
  previewSub: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: '600'
  },
  previewSubScore: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: 'bold'
  },
  biddingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.m
  },
  biddingCard: {
    width: '48%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.m,
    borderWidth: 1,
    borderColor: Colors.border
  },
  playerNameSmall: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.xxs,
    flex: 1
  },
  minBidTextSmall: {
    color: Colors.textMuted,
    fontSize: 10
  },
  controlsRowCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xs
  },
  controlBtnSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center'
  },
  controlBtnTextSmall: {
    color: Colors.text,
    fontSize: 20,
    lineHeight: 22,
    fontWeight: 'bold'
  },
  bidValueSmall: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text
  },
  scoringCardCompact: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingVertical: Spacing.m,
    paddingHorizontal: Spacing.m,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 64
  },
  scoringInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.m,
    flex: 1
  },
  scoringButtonsContainer: {
    flexDirection: 'row',
    gap: Spacing.s
  },
  compactResultBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.s,
    paddingHorizontal: Spacing.s,
    borderRadius: Radius.sm,
    borderWidth: 1,
    gap: Spacing.xs,
    minWidth: 80,
    justifyContent: 'center'
  },
  buttonInactive: {
    backgroundColor: Colors.surfaceInner,
    borderColor: Colors.border
  },
  brokeActive: {
    backgroundColor: Colors.dangerLight,
    borderColor: Colors.danger
  },
  wonActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary
  },
  toggleTextSmall: {
    fontSize: 11,
    fontWeight: 'bold',
    color: Colors.textMuted
  },
  scorePreviewSmall: {
    fontSize: 11,
    fontWeight: 'bold',
    color: Colors.white
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.l
  },
  editName: {
    color: Colors.text,
    width: 80,
    fontSize: 14,
    fontWeight: '600'
  },
  editBtn: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: 'bold',
    paddingHorizontal: Spacing.s
  },
  editVal: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    width: 30,
    textAlign: 'center'
  },
  editToggle: {
    paddingVertical: Spacing.s,
    paddingHorizontal: Spacing.l,
    borderRadius: Radius.sm,
    minWidth: 80,
    alignItems: 'center'
  },

  // --- Leekha Specific ---
  playerName: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '600',
    maxWidth: 120
  },
  roundPoints: {
    color: Colors.textMuted,
    fontSize: 16,
    fontWeight: '600'
  },
  compactCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.m,
    marginBottom: Spacing.s,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 80
  },
  compactInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.m
  },
  compactControls: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  compactCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceInner,
    borderRadius: Radius.sm,
    padding: Spacing.xs,
    marginRight: Spacing.s
  },
  compactBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceLight,
    borderRadius: Radius.sm
  },
  compactBtnText: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: -2
  },
  compactHeartVal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 45,
    gap: Spacing.xs
  },
  compactValText: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: 'bold'
  },
  compactSpecialBtn: {
    width: 48,
    height: 44,
    borderRadius: Radius.s,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1
  },
  specialCardInactive: {
    backgroundColor: Colors.surfaceInner,
    borderColor: Colors.border
  },
  compactSpecialText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.textMuted
  },
  qsActive: {
    backgroundColor: Colors.overlayLight,
    borderColor: Colors.text
  },
  tenActive: {
    backgroundColor: Colors.dangerLight,
    borderColor: Colors.danger
  },
  lastRoundIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
    height: 16
  },
  iconQS: {
    color: Colors.text,
    fontSize: 10,
    fontWeight: 'bold'
  },
  iconTen: {
    color: Colors.danger,
    fontSize: 10,
    fontWeight: 'bold'
  },
  iconHeartContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xxs
  },
  iconHeartText: {
    color: Colors.danger,
    fontSize: 10,
    fontWeight: 'bold'
  }
});