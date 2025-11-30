import { StyleSheet } from "react-native";

// 1. Design Tokens
export const Colors = {
  background: "#111111",
  primary: "#0f9d58", // Green
  surface: "#1e1e1e", // Card background
  surfaceLight: "#252525", // Lighter inputs/buttons
  surfaceInner: "#161616", // Inner content areas
  border: "#333333",
  text: "#ffffff",
  textSecondary: "#888888",
  textMuted: "#555555",
  danger: "#ff5252",
};

export const Spacing = {
  xs: 4,
  s: 8,
  m: 12,
  l: 16,
  xl: 24,
  xxl: 32,
};

// 2. Shared Global Styles
export const GlobalStyles = StyleSheet.create({
  // Layouts
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
  
  // Headers
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.l,
    paddingVertical: Spacing.m,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "800",
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

  // Cards
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.l,
    marginBottom: Spacing.m,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: {
    color: Colors.text,
    fontWeight: "700",
    fontSize: 14,
  },
  
  // Buttons
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 24,
    paddingVertical: Spacing.l,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  primaryButtonText: {
    color: Colors.text,
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.5,
  },

  // Inputs
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: Spacing.m,
    paddingVertical: 10,
    color: Colors.text,
    fontSize: 14,
  },

  // Typography helpers
  textSmall: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});