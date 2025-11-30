import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { FlatList, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GlobalStyles, Spacing } from "../constants/theme";
import { GameState, GameStorage } from "../services/game_storage";

// Component Imports
import { EmptyState } from "../components/empty_state";
import { FloatingActionButton } from "../components/fab";
import { Header } from "../components/header";
import { MatchCard } from "../components/match_card";
import { TabBar } from "../components/tab_bar";

// --- Types ---
type TabKey = "active" | "history";

// --- Main Screen Component ---

export default function Index() {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("active");
  const [activeGame, setActiveGame] = useState<GameState | null>(null);

  // Refresh active game whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const current = GameStorage.get();
      setActiveGame(current);
    }, [])
  );

  const handleResumeGame = () => {
    if (activeGame) {
      router.push({ pathname: "/games/scoreboard", params: { resume: "true" } });
    }
  };

  // Mock History Data
  const historyData: GameState[] = []; 

  // Combine Active Game into a list for FlatList
  const activeData = activeGame ? [activeGame] : [];
  
  const displayData = tab === "active" ? activeData : historyData;

  return (
    <SafeAreaView style={GlobalStyles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <Header
        title="SKORAT"
        onPressProfile={() => console.log("Profile clicked")}
        onPressSettings={() => console.log("Settings clicked")}
      />

      {/* Tab Bar */}
      <TabBar
        activeTab={tab}
        activeCount={activeData.length}
        onChangeTab={setTab}
      />

      {/* Match List */}
      <FlatList
        data={displayData}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState tab={tab} />
        }
        renderItem={({ item }) => (
          <MatchCard
            match={item}
            onPress={handleResumeGame}
          />
        )}
      />

      {/* FAB */}
      <FloatingActionButton onPress={() => router.push("/games/new")} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: Spacing.l,
    paddingBottom: 100, 
  },
});