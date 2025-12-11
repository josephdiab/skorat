import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ENABLE_LOGS } from "../constants/config";
import { Colors, GlobalStyles, Spacing } from "../constants/theme";
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
    
    if (ENABLE_LOGS) console.log("Loaded Games:", JSON.stringify(sorted, null, 2));

    setGames(sorted);
    setIsLoading(false);
  };

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

    router.push({ 
      pathname: routePath as any, 
      params: { 
        instanceId: game.id, 
        resume: "true" 
      } 
    });
  };

  const handleRematchGame = (game: GameSummary) => {
    setTab("active");
    let routePath = "/games/400"; 
    if (game.gameType === 'leekha') routePath = "/games/leekha";
    if (game.gameType === '400') routePath = "/games/400";
    if (game.gameType === 'tarneeb') routePath = "/games/tarneeb";

    const profileParams = game.players.map(p => ({ id: p.profileId, name: p.name }));

    router.push({
      pathname: routePath as any,
      params: {
        playerProfiles: JSON.stringify(profileParams),
        gameName: game.title,
        scoreLimit: game.scoreLimit?.toString(),
        mode: game.mode
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
        onPressSettings={() => router.push("/settings")} 
        onPressProfile={function (): void {
          throw new Error("Function not implemented.");
        } }      
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
        // TIP HEADER: Only shows on History tab when there are items
        ListHeaderComponent={
          (tab === 'history' && historyGames.length > 0) ? (
            <View style={styles.tipContainer}>
              <Text style={styles.tipText}>Swipe right to rematch!</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <MatchCard
            match={item as any} 
            onPress={() => handleResumeGame(item)}
            onDelete={() => handleDeleteGame(item.id)}
            onRematch={() => handleRematchGame(item)}
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
  tipContainer: {
    marginBottom: Spacing.m,
    marginTop: Spacing.xs,
    alignItems: 'center',
  },
  tipText: {
    color: Colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  }
});