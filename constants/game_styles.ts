import { StyleSheet } from "react-native";
import { Colors, Spacing } from "./theme";

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
  // ADDED THIS
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
    backgroundColor: 'rgba(255,255,255,0.1)', 
    marginVertical: 12 
  },

  // --- Badges ---
  badge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 12, 
    borderWidth: 1, 
    gap: 4 
  },
  badgeSuccess: { 
    backgroundColor: 'rgba(15, 157, 88, 0.1)', 
    borderColor: Colors.primary 
  },
  badgeError: { 
    backgroundColor: 'rgba(255, 82, 82, 0.1)', 
    borderColor: Colors.danger 
  },
  badgeNeutral: { 
    backgroundColor: Colors.surfaceInner, 
    borderColor: Colors.border 
  },
  badgeQS: { 
    backgroundColor: 'rgba(255, 255, 255, 0.1)', 
    borderColor: 'rgba(255, 255, 255, 0.3)' 
  },
  badgeTen: { 
    backgroundColor: 'rgba(255, 82, 82, 0.1)', 
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
    gap: 20 
  },
  gameOverText: { 
    color: Colors.primary, 
    fontSize: 24, 
    fontWeight: 'bold' 
  },

  // --- Modals ---
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.9)', 
    justifyContent: 'center', 
    padding: 10 
  },
  modalContent: { 
    backgroundColor: Colors.surface, 
    borderRadius: 16, 
    padding: 20, 
    paddingBottom: 30 
  },
  modalTitle: { 
    color: Colors.text, 
    fontSize: 20, 
    fontWeight: 'bold', 
    marginBottom: 20, 
    textAlign: 'center' 
  },
  modalStatusRow: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    gap: 12, 
    marginBottom: 20 
  },
  modalFooter: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginTop: 20, 
    paddingTop: 20, 
    borderTopWidth: 1, 
    borderTopColor: Colors.border 
  },
  modalCancel: { 
    padding: 12 
  },
  modalSave: { 
    backgroundColor: Colors.primary, 
    padding: 12, 
    borderRadius: 8 
  },

  // --- Tarneeb/400 Specific ---
  grid: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    gap: 12 
  },
  playerOption: { 
    flex: 1, 
    backgroundColor: Colors.surface, 
    padding: 20, 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: Colors.border, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  playerOptionActive: { 
    borderColor: Colors.primary, 
    backgroundColor: 'rgba(15, 157, 88, 0.1)' 
  },
  teamNameBig: { 
    color: Colors.text, 
    fontSize: 20, 
    fontWeight: 'bold', 
    marginBottom: 4 
  },
  teamPlayers: { 
    color: Colors.textMuted, 
    fontSize: 12, 
    textAlign: 'center' 
  },
  bidGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 12, 
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
    gap: 20 
  },
  counterCard: { 
    backgroundColor: Colors.surface, 
    borderRadius: 20, 
    padding: 24, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: Colors.border 
  },
  counterLabel: { 
    color: Colors.textMuted, 
    fontSize: 14, 
    textTransform: 'uppercase', 
    fontWeight: 'bold', 
    marginBottom: 20 
  },
  counterRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 32 
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
    borderRadius: 16, 
    padding: 16, 
    borderWidth: 1 
  },
  previewSuccess: { 
    backgroundColor: 'rgba(15, 157, 88, 0.1)', 
    borderColor: 'rgba(15, 157, 88, 0.3)' 
  },
  previewFail: { 
    backgroundColor: 'rgba(255, 82, 82, 0.1)', 
    borderColor: 'rgba(255, 82, 82, 0.3)' 
  },
  previewTitle: { 
    color: Colors.text, 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginLeft: 12 
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
    gap: 12 
  },
  biddingCard: { 
    width: '48%', 
    backgroundColor: Colors.surface, 
    borderRadius: 16, 
    padding: 12, 
    borderWidth: 1, 
    borderColor: Colors.border 
  },
  playerNameSmall: { 
    color: Colors.text, 
    fontSize: 16, 
    fontWeight: '600', 
    marginBottom: 2, 
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
    marginTop: 4 
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
    borderRadius: 12, 
    paddingVertical: 12, 
    paddingHorizontal: 12, 
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
    gap: 12, 
    flex: 1 
  },
  scoringButtonsContainer: { 
    flexDirection: 'row', 
    gap: 8 
  },
  compactResultBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 8, 
    paddingHorizontal: 10, 
    borderRadius: 8, 
    borderWidth: 1, 
    gap: 4, 
    minWidth: 80, 
    justifyContent: 'center' 
  },
  buttonInactive: { 
    backgroundColor: Colors.surfaceInner, 
    borderColor: Colors.border 
  },
  brokeActive: { 
    backgroundColor: 'rgba(255, 82, 82, 0.15)', 
    borderColor: Colors.danger 
  },
  wonActive: { 
    backgroundColor: 'rgba(15, 157, 88, 0.15)', 
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
    color: '#fff' 
  },
  editRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    marginBottom: 16 
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
    paddingHorizontal: 10 
  },
  editVal: { 
    color: Colors.text, 
    fontSize: 18, 
    fontWeight: 'bold', 
    width: 30, 
    textAlign: 'center' 
  },
  editToggle: { 
    paddingVertical: 8, 
    paddingHorizontal: 16, 
    borderRadius: 8, 
    minWidth: 80, 
    alignItems: 'center' 
  },

  // --- Leekha Specific (ADDED THESE) ---
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
    borderRadius: 12, 
    padding: 12, 
    marginBottom: 8, 
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
    gap: 12 
  },
  compactControls: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  compactCounter: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: Colors.surfaceInner, 
    borderRadius: 8, 
    padding: 4, 
    marginRight: 10 
  },
  compactBtn: { 
    width: 40, 
    height: 40, 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: Colors.surfaceLight, 
    borderRadius: 8 
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
    gap: 4 
  },
  compactValText: { 
    color: Colors.text, 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  compactSpecialBtn: { 
    width: 48, 
    height: 44, 
    borderRadius: 10, 
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)', 
    borderColor: Colors.text 
  },
  tenActive: { 
    backgroundColor: 'rgba(255, 82, 82, 0.15)', 
    borderColor: Colors.danger 
  },
  lastRoundIcons: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 4, 
    marginTop: 4, 
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
    gap: 2 
  },
  iconHeartText: { 
    color: Colors.danger, 
    fontSize: 10, 
    fontWeight: 'bold' 
  }
});