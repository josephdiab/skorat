import { StyleSheet, ViewStyle } from "react-native";

// =============================================================================
// 1. COLOR TOKENS
// =============================================================================
export const Colors = {
  // Core palette
  background: "#111111",
  primary: "#0f9d58",
  primaryDark: "#0b7541",
  surface: "#1e1e1e",
  surfaceLight: "#252525",
  surfaceInner: "#161616",
  border: "#333333",

  // Text colors
  text: "#ffffff",
  textSecondary: "#888888",
  textMuted: "#555555",

  // Semantic colors
  danger: "#ff5252",

  // Base colors (for shadows, icons, etc.)
  white: "#ffffff",
  black: "#000000",
  gray: "#cccccc",
  gold: "#FFD700",

  // Transparent variants (for backgrounds, overlays)
  primaryLight: "rgba(15, 157, 88, 0.15)",
  dangerLight: "rgba(255, 82, 82, 0.1)",
  overlayDark: "rgba(0, 0, 0, 0.9)",
  overlayLight: "rgba(255, 255, 255, 0.05)",
};

// =============================================================================
// 2. SPACING TOKENS
// =============================================================================
export const Spacing = {
  xxs: 2,
  xs: 4,
  s: 8,
  m: 12,
  l: 16,
  xl: 24,
  xxl: 32,
  xxxl: 40,
};

// =============================================================================
// 3. TYPOGRAPHY TOKENS
// =============================================================================
export const FontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 24,
  display: 28,
  hero: 32,
  jumbo: 42,
  giant: 56,
};

export const FontWeight = {
  normal: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
  extrabold: "800" as const,
  black: "900" as const,
};

// =============================================================================
// 4. BORDER RADIUS TOKENS
// =============================================================================
export const Radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  round: 9999,
};

// =============================================================================
// 5. SHADOW TOKENS
// =============================================================================
type ShadowStyle = Pick<
  ViewStyle,
  "shadowColor" | "shadowOffset" | "shadowOpacity" | "shadowRadius" | "elevation"
>;

export const Shadows: {
  sm: ShadowStyle;
  md: ShadowStyle;
  lg: ShadowStyle;
  glow: (color: string) => ShadowStyle;
} = {
  sm: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  lg: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  glow: (color: string): ShadowStyle => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  }),
};

// =============================================================================
// 6. GLOBAL STYLES
// =============================================================================
export const GlobalStyles = StyleSheet.create({
  // --- Layouts ---
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  // --- Headers ---
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.l,
    paddingVertical: Spacing.m,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.text,
    letterSpacing: 0.5,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
  },

  // --- Cards ---
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.l,
    marginBottom: Spacing.m,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardSurface: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.l,
  },
  cardFlat: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.l,
  },
  cardTitle: {
    color: Colors.text,
    fontWeight: FontWeight.bold,
    fontSize: FontSize.md,
  },

  // --- Primary Button ---
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.xxl,
    paddingVertical: Spacing.l,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.md,
  },
  primaryButtonText: {
    color: Colors.text,
    fontWeight: FontWeight.bold,
    fontSize: FontSize.lg,
    letterSpacing: 0.5,
  },

  // --- Secondary Button ---
  secondaryButton: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xxl,
    paddingVertical: Spacing.m,
    paddingHorizontal: Spacing.l,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },

  // --- Ghost Button ---
  ghostButton: {
    paddingVertical: Spacing.s,
    paddingHorizontal: Spacing.m,
    alignItems: "center",
    justifyContent: "center",
  },
  ghostButtonText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },

  // --- Inputs ---
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    color: Colors.text,
    fontSize: FontSize.md,
  },

  // --- Badges ---
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.xl,
    gap: Spacing.xs,
  },
  badgeSuccess: {
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  badgeError: {
    backgroundColor: Colors.dangerLight,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  badgeNeutral: {
    backgroundColor: Colors.surfaceInner,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  badgeText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },

  // --- Typography Helpers ---
  textXs: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  textSmall: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  textMd: {
    fontSize: FontSize.md,
    color: Colors.text,
  },
  textLg: {
    fontSize: FontSize.lg,
    color: Colors.text,
    fontWeight: FontWeight.semibold,
  },
  heading: {
    fontSize: FontSize.xl,
    color: Colors.text,
    fontWeight: FontWeight.extrabold,
  },
  title: {
    fontSize: FontSize.xxl,
    color: Colors.text,
    fontWeight: FontWeight.extrabold,
  },
  label: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontWeight: FontWeight.bold,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});