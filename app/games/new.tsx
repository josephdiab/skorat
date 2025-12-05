import { Stack, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
import { UserProfile } from "../../constants/types";
import { PlayerStorage } from "../../services/player_storage";

export default function NewGameScreen() {
  const router = useRouter();
  
  // --- State ---
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [scoreLimit, setScoreLimit] = useState(41);
  const [players, setPlayers] = useState<string[]>(["", "", "", ""]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Derived State ---
  const selectedGame = GAMES.find(g => g.id === selectedGameId);
  const mode = selectedGame ? (selectedGame.isTeam ? "teams" : "solo") : "teams";
  
  const isFormValid = selectedGame && players.every(p => p.trim().length > 0);

  // Update Score Limit options when Game Type changes
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
    let placeholder = `Player ${index + 1}`;
    
    return (
      <View 
        key={index} 
        style={[
          localStyles.gridItem, 
          mode === 'solo' && { width: '100%' }
        ]}
      >
        <TextInput
          style={GlobalStyles.input}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted} 
          value={players[index]}
          onChangeText={(text) => updatePlayer(index, text)}
          autoCapitalize="words"
        />
      </View>
    );
  };

  const handleStart = async () => {
    if (!isFormValid || !selectedGame) return;

    setIsSubmitting(true);

    try {
      // 1. Resolve Players SEQUENTIALLY
      // We CANNOT use Promise.all here because reading/writing to AsyncStorage 
      // creates a race condition where players overwrite each other in the database.
      // A loop ensures Player 1 is saved before Player 2 tries to read the DB.
      const resolvedPlayers: UserProfile[] = [];
      
      for (const name of players) {
        const profile = await PlayerStorage.getOrCreate(name);
        resolvedPlayers.push(profile);
      }

      // 2. Serialize for Params
      const playerParams = JSON.stringify(resolvedPlayers);
      const instanceId = Date.now().toString();

      // 3. Determine Route
      let routePath = "/games/400"; 
      if (selectedGameId === 'leekha') routePath = "/games/leekha";
      if (selectedGameId === 'tarneeb') routePath = "/games/tarneeb";

      // 4. Navigate
      router.replace({
        pathname: routePath as any,
        params: {
          instanceId,
          gameType: selectedGameId,
          mode,
          gameName: selectedGame.name,
          scoreLimit: scoreLimit.toString(),
          playerProfiles: playerParams, 
          playerNames: JSON.stringify(players) 
        }
      });
    } catch (e) {
      console.error(e);
      alert("Failed to start game. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={GlobalStyles.container} edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ headerShown: false }} />

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
        
        <Section title="Select Game">
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {GAMES.map((game) => {
              const isActive = game.id === selectedGameId;
              return (
                <TouchableOpacity
                  key={game.id}
                  style={[localStyles.gameOption, isActive && localStyles.gameOptionActive]}
                  onPress={() => setSelectedGameId(game.id)}
                  activeOpacity={0.8}
                >
                  <Text 
                    numberOfLines={1} 
                    adjustsFontSizeToFit
                    style={[localStyles.gameOptionText, isActive && localStyles.gameOptionTextActive]}
                  >
                    {game.name}
                  </Text>
                  {isActive && <Text style={{ color: Colors.primary, fontSize: 16, marginLeft: 4 }}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        </Section>

        {selectedGame && (
          <>
            <Section title="Score Limit">
              <SegmentedControl
                options={selectedGame.scoreLimits}
                labels={selectedGame.scoreLimits.map(l => l.toString())}
                selected={scoreLimit}
                onSelect={(limit: number) => setScoreLimit(limit)}
              />
            </Section>

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

            <View style={localStyles.footerInline}>
              <TouchableOpacity 
                style={[
                  GlobalStyles.primaryButton,
                  (!isFormValid || isSubmitting) && localStyles.disabledButton
                ]} 
                onPress={handleStart} 
                activeOpacity={0.8}
                disabled={!isFormValid || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={Colors.textMuted} />
                ) : (
                  <Text style={[
                    GlobalStyles.primaryButtonText,
                    !isFormValid && localStyles.disabledText
                  ]}>
                    START GAME
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}

      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

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

const localStyles = StyleSheet.create({
  footerInline: { marginTop: Spacing.xl, marginBottom: Spacing.m },
  disabledButton: { backgroundColor: Colors.surfaceLight, shadowOpacity: 0, elevation: 0 },
  disabledText: { color: Colors.textMuted },
  teamLabel: { color: Colors.textSecondary, fontSize: 12, fontWeight: "bold", marginBottom: 6, marginLeft: 6, textTransform: "uppercase", letterSpacing: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5 },
  gridItem: { width: '50%', padding: 5 },
  segmentTrack: { flexDirection: "row", backgroundColor: Colors.surfaceLight, borderRadius: 18, padding: 2 },
  segmentBtn: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 16 },
  segmentText: { color: Colors.textSecondary, fontWeight: "600", fontSize: 13 },
  gameOption: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 4, borderRadius: 12, backgroundColor: Colors.surfaceLight, borderWidth: 1, borderColor: Colors.border, justifyContent: 'center' },
  gameOptionActive: { borderColor: Colors.primary, backgroundColor: 'rgba(15, 157, 88, 0.15)' },
  gameOptionText: { color: Colors.textSecondary, fontWeight: '600', fontSize: 14 },
  gameOptionTextActive: { color: Colors.primary, fontWeight: '700' }
});