import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Colors } from "../constants/theme";

type TabKey = "active" | "history";

type EmptyStateProps = {
  tab: TabKey;
};

export const EmptyState: React.FC<EmptyStateProps> = ({ tab }) => (
  <View style={styles.emptyContainer}>
    <Text style={styles.emptyText}>
      {tab === "active" ? "No active matches.\nStart a new game!" : "No history yet."}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  emptyContainer: {
    marginTop: 60,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
});