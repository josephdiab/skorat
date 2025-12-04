// --- START OF FILE: app\index.tsx ---
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { FlatList, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ENABLE_LOGS } from "../constants/config"; // Imported Config
import { GlobalStyles, Spacing } from "../constants/theme";
import { GameSummary } from "../constants/types";
import { GameStorage } from "../services/game_storage";

// Component Imports
import { EmptyState } from "../components/empty_state";
import { FloatingActionButton } from "../components/fab";
import { Header } from "../components/header";
import { MatchCard } from "../components/match_card";
import { TabBar } from "../components/tab_bar";

type TabKey = "active" | "history";

export default function Index() {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("active");
  const [games, setGames] = useState<GameSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load games from storage
  const loadGames = async () => {
    setIsLoading(true);
    if (ENABLE_LOGS) console.log("--- REFRESHING GAMES LIST ---");
    const allGames = await GameStorage.getAll();
    
    // Sort by newest first
    const sorted = allGames.sort((a, b) => 
      new Date(b.lastPlayed).getTime() - new Date(a.lastPlayed).getTime()
    );
    
    // DEBUG LOG
    if (ENABLE_LOGS) console.log("Loaded Games:", JSON.stringify(sorted, null, 2));

    setGames(sorted);
    setIsLoading(false);
  };

  // Refresh active games list whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadGames();
    }, [])
  );

  const handleResumeGame = (game: GameSummary) => {
    let routePath = "/games/400"; 
    if (game.gameType === 'leekha') routePath = "/games/leekha";
    if (game.gameType === '400') routePath = "/games/400";
    if (game.gameType === 'tarneeb') routePath = "/games/tarneeb";

    if (ENABLE_LOGS) console.log(`[NAV] Resuming game: ${game.title} (${game.id})`);

    router.push({ 
      pathname: routePath as any, 
      params: { 
        instanceId: game.id, 
        resume: "true" 
      } 
    });
  };

  const handleDeleteGame = (gameId: string) => {
    const performDelete = async () => {
      await GameStorage.remove(gameId);
      loadGames(); 
    };
    performDelete();
  };

  const activeGames = games.filter(g => g.status !== 'completed');
  const historyGames = games.filter(g => g.status === 'completed');

  const displayData = tab === "active" ? activeGames : historyGames;

  return (
    <SafeAreaView style={GlobalStyles.container} edges={['top', 'left', 'right']}>
      <Header
        title="SKORAT"
        onPressProfile={() => {
          if (ENABLE_LOGS) console.log("Profile clicked");
        }}
        onPressSettings={() => {
          // Optional: Hidden trick to clear storage for testing
          // GameStorage.clearAll().then(() => loadGames());
          if (ENABLE_LOGS) console.log("Settings clicked");
        }}
      />

      <TabBar
        activeTab={tab}
        activeCount={activeGames.length}
        onChangeTab={setTab}
      />

      <FlatList
        data={displayData}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !isLoading ? <EmptyState tab={tab} /> : null
        }
        renderItem={({ item }) => (
          <MatchCard
            match={item as any} 
            onPress={() => handleResumeGame(item)}
            onDelete={() => handleDeleteGame(item.id)}
          />
        )}
      />

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
// --- END OF FILE: app\index.tsx ---