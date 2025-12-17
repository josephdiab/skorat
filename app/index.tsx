import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ENABLE_DEV_TOOLS, ENABLE_LOGS } from "../constants/config";
import { Colors, GlobalStyles, Spacing } from "../constants/theme";
import { GameSummary } from "../constants/types";
import { GameStorage } from "../services/game_storage";
import { StatsEngine } from "../services/stats_engine";

// Component Imports
import { EmptyState } from "../components/empty_state";
import { FloatingActionButton } from "../components/fab";
import { Header } from "../components/header";
import { MatchCard } from "../components/match_card";
import { TabBar } from "../components/tab_bar";

type TabKey = "active" | "history";

// ✅ change this to whichever profile you want to debug
const DEBUG_PROFILE_ID = "u_1765851284218_501";

export default function Index() {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("active");
  const [games, setGames] = useState<GameSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

const debugPrintPlayerHistory = async () => {
  if (!__DEV__ || !ENABLE_DEV_TOOLS) return;

  const fullGames = await GameStorage.getAllFull();
  const rounds = StatsEngine.getPlayerRounds(fullGames, DEBUG_PROFILE_ID);

  console.log(`\n📚 [DEBUG] FULL HISTORY for ${DEBUG_PROFILE_ID}`);
  console.log(`Games scanned: ${fullGames.length}`);
  console.log(`Rounds found: ${rounds.length}`);

  if (rounds.length === 0) {
    console.log("⚠️ No rounds found");
    return;
  }

  // Group rounds by game instance
  const groups: Record<string, typeof rounds> = {};
  for (const r of rounds) {
    const key = `${r.gameType}:${r.instanceId}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(r);
  }

  for (const [key, group] of Object.entries(groups)) {
    group.sort((a, b) => a.roundNum - b.roundNum);

    const gameType = group[0].gameType;
    console.log(`\n🎮 ${key}`);

    // --- GAME-SPECIFIC DEBUG OUTPUT ---
    if (gameType === "400") {
      let calls = 0;
      let breaks = 0;
      let successful = 0;

      for (const r of group) {
        if (r.kind !== "400") continue;

        calls++;
        if (r.won) successful++;
        else breaks++;

        console.log(
          `  R${r.roundNum} | CALL (${r.bid}) | ${r.won ? "SUCCESS" : "BREAK"}`
        );
      }

      console.log(
        `  ➜ Calls: ${calls} | Success: ${successful} | Breaks: ${breaks} | Break %: ${
          calls === 0 ? 0 : Math.round((breaks / calls) * 100)
        }%`
      );
      continue;
    }

    if (gameType === "tarneeb") {
  let calls = 0;
  let breaks = 0;
  let successful = 0;

  for (const r of group) {
    if (r.kind !== "tarneeb" || !r.isCallingTeamMember) continue;

    calls++;

    const success = r.tricksTaken >= r.bid;
    if (success) successful++;
    else breaks++;

    console.log(
      `  R${r.roundNum} | CALL (${r.bid}) | COLLECTED (${r.tricksTaken}) | ${
        success ? "SUCCESS" : "BREAK"
      }`
    );
  }

  console.log(
    `  ➜ Calls: ${calls} | Success: ${successful} | Breaks: ${breaks} | Break %: ${
      calls === 0 ? 0 : Math.round((breaks / calls) * 100)
    }%`
  );
  continue;
}

    if (gameType === "leekha") {
      let runningTotal = 0;

      for (const r of group) {
        if (r.kind !== "leekha") continue;
        runningTotal += r.score;

        console.log(
          `  R${r.roundNum} | hearts=${r.heartsTaken} QS=${r.hasQS ? "Y" : "N"} 10=${
            r.hasTen ? "Y" : "N"
          } | +${r.score} | Total=${runningTotal}`
        );
      }
    }
  }
};


  // Load games from storage
  const loadGames = async () => {
    setIsLoading(true);
    if (ENABLE_LOGS) console.log("--- REFRESHING GAMES LIST ---");

    const allGames = await GameStorage.getAll();

    // Sort by newest first
    const sorted = allGames.sort(
      (a, b) => new Date(b.lastPlayed).getTime() - new Date(a.lastPlayed).getTime()
    );

    if (ENABLE_LOGS) console.log("Loaded Games:", JSON.stringify(sorted, null, 2));

    setGames(sorted);
    setIsLoading(false);

    // ✅ DEV ONLY: dump full history for a profile after list refresh
    if (__DEV__) {
      await debugPrintPlayerHistory();
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadGames();
    }, [])
  );

  const handleResumeGame = (game: GameSummary) => {
    let routePath = "/games/400";
    if (game.gameType === "leekha") routePath = "/games/leekha";
    if (game.gameType === "400") routePath = "/games/400";
    if (game.gameType === "tarneeb") routePath = "/games/tarneeb";

    router.push({
      pathname: routePath as any,
      params: {
        instanceId: game.id,
        resume: "true",
      },
    });
  };

const handleRematchGame = async (game: GameSummary) => {
  setTab("active");

  let routePath = "/games/400";
  if (game.gameType === "leekha") routePath = "/games/leekha";
  if (game.gameType === "400") routePath = "/games/400";
  if (game.gameType === "tarneeb") routePath = "/games/tarneeb";

  // ✅ get the full saved GameState (has proper Player type with profileId)
  const full = await GameStorage.get(game.id);
  if (!full) return;

  const profileParams = full.players.map(p => ({ id: p.profileId, name: p.name }));

  router.push({
    pathname: routePath as any,
    params: {
      playerProfiles: JSON.stringify(profileParams),
      gameName: full.title,
      scoreLimit: full.scoreLimit?.toString(),
      mode: full.mode,
    },
  });
};


  const handleDeleteGame = (gameId: string) => {
    const performDelete = async () => {
      await GameStorage.remove(gameId);
      loadGames();
    };
    performDelete();
  };

  const activeGames = games.filter((g) => g.status !== "completed");
  const historyGames = games.filter((g) => g.status === "completed");

  const displayData = tab === "active" ? activeGames : historyGames;

  return (
    <SafeAreaView style={GlobalStyles.container} edges={["top", "left", "right"]}>
      <Header
        title="SKORAT"
        onPressSettings={() => router.push("/settings")}
        onPressProfile={function (): void {
          throw new Error("Function not implemented.");
        }}
      />

      <TabBar activeTab={tab} activeCount={activeGames.length} onChangeTab={setTab} />

      <FlatList
        data={displayData}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={!isLoading ? <EmptyState tab={tab} /> : null}
        ListHeaderComponent={
          tab === "history" && historyGames.length > 0 ? (
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
    alignItems: "center",
  },
  tipText: {
    color: Colors.textMuted,
    fontSize: 14,
    textAlign: "center",
    opacity: 0.7,
  },
});
