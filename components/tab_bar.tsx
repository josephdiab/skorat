import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Colors, Spacing } from "../constants/theme";

type TabKey = "active" | "history";

type TabBarProps = {
  activeTab: TabKey;
  activeCount: number;
  onChangeTab: (t: TabKey) => void;
};

export const TabBar: React.FC<TabBarProps> = ({ activeTab, activeCount, onChangeTab }) => (
  <View style={styles.tabBar}>
    <TabButton 
      label={`ACTIVE (${activeCount})`} 
      isActive={activeTab === "active"} 
      onPress={() => onChangeTab("active")} 
    />
    <TabButton 
      label="HISTORY" 
      isActive={activeTab === "history"} 
      onPress={() => onChangeTab("history")} 
    />
  </View>
);

const TabButton = ({ label, isActive, onPress }: { label: string; isActive: boolean; onPress: () => void }) => (
  <TouchableOpacity
    style={[styles.tabButton, isActive && styles.tabButtonActive]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.l,
    borderRadius: 20,
    padding: 4,
    marginBottom: Spacing.s,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 16,
  },
  tabButtonActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },
  tabTextActive: {
    color: Colors.text,
  },
});