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
  const [games, setGames] = useState<GameState[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load games from storage
  const loadGames = async () => {
    setIsLoading(true);
    const allGames = await GameStorage.getAll();
    // Sort by newest first
    const sorted = allGames.sort((a, b) => 
      new Date(b.lastPlayed).getTime() - new Date(a.lastPlayed).getTime()
    );
    setGames(sorted);
    setIsLoading(false);
  };

  // Refresh active games list whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadGames();
    }, [])
  );

  const handleResumeGame = (game: GameState) => {
    // Route based on the saved game type
    let routePath = "/games/scoreboard"; // Fallback
    if (game.gameType === 'leekha') routePath = "/games/leekha";
    if (game.gameType === '400') routePath = "/games/400";
    if (game.gameType === 'tarneeb') routePath = "/games/tarneeb";

    router.push({ 
      pathname: routePath as any, 
      params: { 
        instanceId: game.id, // Pass unique ID to load specific game data
        resume: "true" 
      } 
    });
  };

  const handleDeleteGame = (gameId: string) => {
    // The confirmation alert is handled inside MatchCard, 
    // but we can also double-check or just perform the delete here.
    // Since MatchCard has the UI for the alert, we just provide the action.
    
    const performDelete = async () => {
      await GameStorage.remove(gameId);
      loadGames(); // Refresh list after deletion
    };

    performDelete();
  };

  // Filter games based on status (active vs completed)
  // For V1, we assume everything is active until we implement a "Finish Game" feature
  // You can manually filter based on logic if you add a 'status' field later
  const activeGames = games.filter(g => g.status !== 'completed');
  const historyGames = games.filter(g => g.status === 'completed');

  const displayData = tab === "active" ? activeGames : historyGames;

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
        activeCount={activeGames.length}
        onChangeTab={setTab}
      />

      {/* Match List */}
      <FlatList
        data={displayData}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !isLoading ? <EmptyState tab={tab} /> : null
        }
        renderItem={({ item }) => (
          <MatchCard
            match={item}
            onPress={() => handleResumeGame(item)}
            onDelete={() => handleDeleteGame(item.id)}
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