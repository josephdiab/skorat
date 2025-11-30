import { Stack, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";
import { GAMES } from "../../constants/games";
import { Colors, GlobalStyles, Spacing } from "../../constants/theme";

type BestOf = 1 | 3 | 5;

export default function NewGameScreen() {
  const router = useRouter();
  
  // --- State ---
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [bestOf, setBestOf] = useState<BestOf>(3);
  const [scoreLimit, setScoreLimit] = useState(GAMES[0].defaultLimit);
  const [players, setPlayers] = useState<string[]>(["", "", "", ""]);

  // --- Derived State ---
  const selectedGame = GAMES.find(g => g.id === selectedGameId);
  const mode = selectedGame ? (selectedGame.isTeam ? "teams" : "solo") : "teams";
  
  // Check if form is ready to submit (Game selected + All names filled)
  const isFormValid = selectedGame && players.every(p => p.trim().length > 0);

  // Reset score limit to the game's default whenever the selected game changes
  useEffect(() => {
    if (selectedGame) {
      setScoreLimit(selectedGame.defaultLimit);
    }
  }, [selectedGameId]);

  const updatePlayer = (index: number, text: string) => {
    const copy = [...players];
    copy[index] = text;
    setPlayers(copy);
  };

  const renderPlayerInput = (index: number) => {
    // If Teams: Index 0,1 -> Team A; Index 2,3 -> Team B
    let labelIndex = index + 1;
    if (mode === 'teams') labelIndex = (index % 2) + 1; 

    return (
      <View 
        key={index} 
        style={[
          localStyles.gridItem, 
          mode === 'solo' && { width: '100%' } // Solo = 1 per row
        ]}
      >
        <TextInput
          style={GlobalStyles.input}
          placeholder={`Player Name`}
          placeholderTextColor={Colors.primary} 
          value={players[index]}
          onChangeText={(text) => updatePlayer(index, text)}
        />
      </View>
    );
  };

  const handleStart = () => {
    // Validation is handled by the button state, but keep a check here just in case
    if (!isFormValid || !selectedGame) return;

    // Generate a unique ID for this specific match instance
    const instanceId = Date.now().toString();

    // Determine the correct route based on the game type
    let routePath = "/games/scoreboard"; 
    if (selectedGameId === 'leekha') routePath = "/games/leekha";
    if (selectedGameId === '400') routePath = "/games/400";
    if (selectedGameId === 'tarneeb') routePath = "/games/tarneeb";

    router.push({
      pathname: routePath as any,
      params: {
        instanceId, // Unique ID for storage
        gameType: selectedGameId, // "leekha", "tarneeb", etc.
        playerNames: JSON.stringify(players),
        mode,
        gameName: selectedGame.name,
        bestOf: bestOf.toString(),
        scoreLimit: scoreLimit.toString()
      }
    });
  };

  return (
    <SafeAreaView style={GlobalStyles.container} edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[GlobalStyles.headerContainer, { paddingTop: Spacing.s }]}>
        <TouchableOpacity 
          onPress={router.back} 
          style={GlobalStyles.headerIconBtn} 
          activeOpacity={0.7}
        >
          <Text style={{ color: Colors.text, fontSize: 16, marginTop: -2 }}>◀</Text>
        </TouchableOpacity>
        <Text style={GlobalStyles.headerTitle}>New Game Setup</Text>
        <View style={{ width: 36 }} /> 
      </View>

      <KeyboardAwareScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: Spacing.l, paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid={true}
        extraHeight={150} 
        extraScrollHeight={100}
        enableResetScrollToCoords={false} 
        enableAutomaticScroll={true}
      >
        
        {/* Game Selection - Horizontal Cards */}
        <Section title="Select Game">
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingRight: 20 }}
          >
            {GAMES.map((game) => {
              const isActive = game.id === selectedGameId;
              return (
                <TouchableOpacity
                  key={game.id}
                  style={[localStyles.gameOption, isActive && localStyles.gameOptionActive]}
                  onPress={() => setSelectedGameId(game.id)}
                  activeOpacity={0.8}
                >
                  <Text style={[localStyles.gameOptionText, isActive && localStyles.gameOptionTextActive]}>
                    {game.name}
                  </Text>
                  {isActive && <Text style={{ color: Colors.primary, fontSize: 16, marginLeft: 8 }}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Section>

        {/* ONLY Render the rest of the form if a game is selected */}
        {selectedGame && (
          <>
            {/* Winning Condition */}
            <Section title="Winning Condition">
              <SegmentedControl
                options={[1, 3, 5]}
                labels={["Best of 1", "Best of 3", "Best of 5"]}
                selected={bestOf}
                onSelect={(v: any) => setBestOf(v)}
              />
            </Section>

            {/* Score Limit (Dynamic based on selected game) */}
            <Section title="Score Limit">
              <SegmentedControl
                options={selectedGame.scoreLimits}
                labels={selectedGame.scoreLimits.map(l => l.toString())}
                selected={scoreLimit}
                onSelect={(limit: number) => setScoreLimit(limit)}
              />
            </Section>

            {/* Players */}
            <Section title="Player Selection">
              {mode === 'solo' ? (
                <View style={localStyles.grid}>
                  {players.map((_, i) => renderPlayerInput(i))}
                </View>
              ) : (
                <View>
                  <Text style={localStyles.teamLabel}>Team A</Text>
                  <View style={localStyles.grid}>
                    {renderPlayerInput(0)}
                    {renderPlayerInput(1)}
                  </View>

                  <Text style={[localStyles.teamLabel, { marginTop: Spacing.m }]}>Team B</Text>
                  <View style={localStyles.grid}>
                    {renderPlayerInput(2)}
                    {renderPlayerInput(3)}
                  </View>
                </View>
              )}
            </Section>

            {/* Footer */}
            <View style={localStyles.footerInline}>
              <TouchableOpacity 
                style={[
                  GlobalStyles.primaryButton,
                  !isFormValid && localStyles.disabledButton
                ]} 
                onPress={handleStart} 
                activeOpacity={0.8}
                disabled={!isFormValid}
              >
                <Text style={[
                  GlobalStyles.primaryButtonText,
                  !isFormValid && localStyles.disabledText
                ]}>
                  START GAME
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

// --- Helpers ---

const Section = ({ title, children }: any) => (
  <View style={GlobalStyles.card}>
    <Text style={[GlobalStyles.cardTitle, { color: Colors.text, marginBottom: Spacing.s }]}>
      {title}
    </Text>
    <View style={{ backgroundColor: Colors.surfaceInner, borderRadius: 12, padding: Spacing.s }}>
      {children}
    </View>
  </View>
);

const SegmentedControl = ({ options, labels, selected, onSelect }: any) => (
  <View style={localStyles.segmentTrack}>
    {options.map((opt: any, i: number) => {
      const active = opt === selected;
      return (
        <TouchableOpacity
          key={opt}
          style={[localStyles.segmentBtn, active && { backgroundColor: Colors.primary }]}
          onPress={() => onSelect(opt)}
          activeOpacity={0.8}
        >
          <Text style={[localStyles.segmentText, active && { color: Colors.text }]}>
            {labels[i]}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

// --- Local Styles ---
const localStyles = StyleSheet.create({
  footerInline: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.m,
  },
  disabledButton: {
    backgroundColor: Colors.surfaceLight,
    shadowOpacity: 0,
    elevation: 0,
  },
  disabledText: {
    color: Colors.textMuted,
  },
  teamLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 6,
    marginLeft: 6,
    textTransform: "uppercase",
    letterSpacing: 1
  },
  grid: {
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    marginHorizontal: -5 
  },
  gridItem: {
    width: '50%', // Default 2 per row
    padding: 5 
  },
  segmentTrack: {
    flexDirection: "row", 
    backgroundColor: Colors.surfaceLight, 
    borderRadius: 18, 
    padding: 2 
  },
  segmentBtn: {
    flex: 1, 
    paddingVertical: 10, 
    alignItems: "center", 
    borderRadius: 16 
  },
  segmentText: {
    color: Colors.textSecondary,
    fontWeight: "600",
    fontSize: 13
  },
  // Game Selector Styles
  gameOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 120,
    justifyContent: 'center',
  },
  gameOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(15, 157, 88, 0.15)',
  },
  gameOptionText: {
    color: Colors.textSecondary,
    fontWeight: '600',
    fontSize: 16,
  },
  gameOptionTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  }
});