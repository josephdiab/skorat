import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { Colors, Shadows, Spacing } from "../constants/theme";

type FabProps = {
  onPress: () => void;
};

export const FloatingActionButton: React.FC<FabProps> = ({ onPress }) => (
  <TouchableOpacity style={styles.fab} activeOpacity={0.8} onPress={onPress}>
    <Text style={styles.fabIcon}>＋</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: Spacing.xl,
    right: Spacing.xl,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.md,
  },
  fabIcon: {
    fontSize: 30,
    color: Colors.text,
    marginTop: -2,
  },
});