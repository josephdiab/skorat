import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Heart, Trophy } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GameHeader } from "../../components/game_header";
import { ScoreboardHistory } from "../../components/scoreboard_history";
import { Colors, GlobalStyles, Spacing } from "../../constants/theme";
import { GameState, GameStorage, Player, RoundDetails, RoundHistory } from "../../services/game_storage";

export default function LeekhaScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const instanceId = (params.instanceId as string) || (params.id as string);

  // --- State ---
  const [isLoaded, setIsLoaded] = useState(false);

  const [players, setPlayers] = useState<Player[]>([]);
  const [history, setHistory] = useState<RoundHistory[]>([]);
  const [roundNum, setRoundNum] = useState(1);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Config
  const [mode, setMode] = useState<'solo' | 'teams'>('solo');
  const [gameName, setGameName] = useState("LEEKHA");
  const [scoreLimit, setScoreLimit] = useState<number | undefined>(101);
  const [bestOf, setBestOf] = useState<number>(3); 

  // Leekha Specific Input State
  const [hearts, setHearts] = useState<Record<string, number>>({ "1": 0, "2": 0, "3": 0, "4": 0 });
  const [qsHolder, setQsHolder] = useState<string | null>(null);
  const [tenHolder, setTenHolder] = useState<string | null>(null);

  // --- LOAD DATA (Async) ---
  useEffect(() => {
    const loadGameData = async () => {
      // 1. Try loading from storage (Resume)
      if (instanceId) {
        const savedGame = await GameStorage.get(instanceId);
        if (savedGame) {
          setPlayers(savedGame.players);
          setHistory(savedGame.history);
          setRoundNum(savedGame.roundNum);
          setMode(savedGame.mode);
          setGameName(savedGame.title);
          setScoreLimit(savedGame.scoreLimit);
          setBestOf(savedGame.bestOf || 3);
          setIsLoaded(true);
          return;
        }
      }

      // 2. If new game, initialize from Params
      if (typeof params.playerNames === 'string') {
        try {
          let names = JSON.parse(params.playerNames);
          if (params.mode === 'teams' && names.length === 4) {
            names = [names[0], names[2], names[1], names[3]];
          }
          const initialPlayers = names.map((name: string, index: number) => ({
            id: (index + 1).toString(), name: name, totalScore: 0, isDanger: false
          }));
          setPlayers(initialPlayers);
          setMode((params.mode as 'solo' | 'teams') || 'solo');
          setGameName((params.gameName as string) || "LEEKHA");
          setScoreLimit(params.scoreLimit ? Number(params.scoreLimit) : 101);
          setBestOf(params.bestOf ? Number(params.bestOf) : 3);
          setIsLoaded(true);
        } catch (e) { console.log("Error init new game", e); }
      }
    };
    loadGameData();
  }, [instanceId]);

  // --- Persistence ---
  useEffect(() => {
    if (!isLoaded) return;

    const gameState: GameState = {
      id: instanceId,
      instanceId,
      gameType: 'leekha',
      status: 'active',
      mode: mode,
      title: gameName, 
      roundLabel: `Round ${roundNum}`, 
      lastPlayed: new Date().toISOString(),
      players,
      history,
      roundNum,
      scoreLimit,
      bestOf,
      isTeamScoreboard: false // Leekha tracks individual scores
    };
    GameStorage.save(gameState);
  }, [players, history, roundNum, isLoaded]);

  // --- Logic ---
  const totalHeartsAssigned = Object.values(hearts).reduce((a, b) => a + b, 0);
  const remainingHearts = 13 - totalHeartsAssigned;
  
  const getRoundPoints = (pid: string) => {
    let points = hearts[pid] || 0;
    if (qsHolder === pid) points += 13;
    if (tenHolder === pid) points += 10;
    return points;
  };

  const currentTotalPoints = players.reduce((sum, p) => sum + getRoundPoints(p.id), 0);
  const isRoundValid = remainingHearts === 0 && qsHolder !== null && tenHolder !== null && currentTotalPoints === 36;

  // --- Handlers ---
  const handleHeartChange = (pid: string, delta: number) => {
    const current = hearts[pid] || 0;
    const newVal = current + delta;
    if (newVal < 0) return;
    if (delta > 0 && remainingHearts <= 0) return;
    setHearts(prev => ({ ...prev, [pid]: newVal }));
  };

  const toggleQS = (pid: string) => {
    setQsHolder(prev => (prev === pid ? null : (prev !== null ? prev : pid)));
  };

  const toggleTen = (pid: string) => {
    setTenHolder(prev => (prev === pid ? null : (prev !== null ? prev : pid)));
  };

  const submitRound = () => {
    if (!isRoundValid) return;

    const currentRoundDetails: Record<string, RoundDetails> = {};
    players.forEach(p => {
      currentRoundDetails[p.id] = {
        score: getRoundPoints(p.id),
        hearts: hearts[p.id] || 0,
        hasQS: qsHolder === p.id,
        hasTen: tenHolder === p.id
      };
    });

    setHistory(prev => [...prev, { roundNum, playerDetails: currentRoundDetails }]);

    const updatedPlayers = players.map(p => {
      const newTotal = p.totalScore + getRoundPoints(p.id);
      return {
        ...p,
        totalScore: newTotal,
        // Danger: Red if score is close to limit (e.g. >= 85% of limit)
        isDanger: scoreLimit ? newTotal >= (scoreLimit * 0.85) : false 
      };
    });
    setPlayers(updatedPlayers);
    
    const loser = updatedPlayers.find(p => scoreLimit && p.totalScore >= scoreLimit);
    if (loser) {
      Alert.alert("Game Over", `${loser.name} has reached the limit!`);
    }

    setHearts({ "1": 0, "2": 0, "3": 0, "4": 0 });
    setQsHolder(null);
    setTenHolder(null);
    setRoundNum(prev => prev + 1);
  };

  // --- Helper: Render Last Round Icons ---
  const renderLastRoundIcons = (p: Player) => {
    if (history.length === 0) return <View style={{ height: 16 }} />;
    const lastRound = history[history.length - 1];
    const details = lastRound.playerDetails[p.id];
    if (!details) return <View style={{ height: 16 }} />;

    const hasIcons = details.hasQS || details.hasTen || details.hearts > 0;
    if (!hasIcons) return <View style={{ height: 16 }} />;

    return (
      <View style={styles.lastRoundIcons}>
          {details.hasQS && <Text style={styles.iconQS}>Q♠</Text>}
          {details.hasTen && <Text style={styles.iconTen}>10♦</Text>}
          {details.hearts > 0 && (
            <View style={styles.iconHeartContainer}>
              <Heart size={10} color={Colors.danger} fill={Colors.danger} />
              <Text style={styles.iconHeartText}>{details.hearts}</Text>
            </View>
          )}
      </View>
    );
  };

  if (!isLoaded) return <SafeAreaView style={GlobalStyles.container} />;

  return (
    <SafeAreaView style={GlobalStyles.container} edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ headerShown: false }} />

      <GameHeader 
        title={gameName.toUpperCase()} 
        subtitle={`BEST OF ${bestOf}`} 
        onBack={() => router.dismissAll()} 
      />
      
      <ScoreboardHistory 
        players={players}
        history={history}
        isExpanded={isExpanded}
        toggleExpand={() => setIsExpanded(!isExpanded)}
        renderScoreExtra={renderLastRoundIcons}
      />

      {/* Fixed Status Bar */}
      <View style={styles.statusRowFixed}>
        <Text style={styles.sectionTitle}>Input Round {roundNum}</Text>
        <View style={GlobalStyles.row}>
          <View style={[styles.badge, remainingHearts === 0 ? styles.badgeNeutral : styles.badgeError]}>
            <Heart size={10} color={remainingHearts === 0 ? Colors.textMuted : Colors.danger} fill={remainingHearts === 0 ? "none" : Colors.danger} />
            <Text style={[styles.badgeText, remainingHearts !== 0 && { color: Colors.danger }]}>
                {remainingHearts}
            </Text>
          </View>
          <View style={[styles.badge, qsHolder ? styles.badgeNeutral : styles.badgeQS, { marginLeft: 8 }]}>
              <Trophy size={10} color={qsHolder ? Colors.textMuted : Colors.text} />
              <Text style={[styles.badgeText, !qsHolder ? { color: Colors.text } : { color: Colors.textMuted }]}>Q♠</Text>
          </View>
          <View style={[styles.badge, tenHolder ? styles.badgeNeutral : styles.badgeTen, { marginLeft: 8 }]}>
              <Trophy size={10} color={tenHolder ? Colors.textMuted : Colors.danger} />
              <Text style={[styles.badgeText, !tenHolder ? { color: Colors.danger } : { color: Colors.textMuted }]}>10♦</Text>
          </View>
        </View>
      </View>

      {/* Leekha Input Area */}
      <View style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: Spacing.l, paddingBottom: 100, paddingTop: Spacing.xl }}>
          {players.map(p => (
            <LeekhaPlayerCard 
              key={p.id}
              player={p}
              roundPoints={getRoundPoints(p.id)}
              heartCount={hearts[p.id] || 0}
              hasQS={qsHolder === p.id}
              hasTen={tenHolder === p.id}
              isQSLocked={qsHolder !== null && qsHolder !== p.id}
              isTenLocked={tenHolder !== null && tenHolder !== p.id}
              remainingHearts={remainingHearts}
              onHeartChange={handleHeartChange}
              onToggleQS={toggleQS}
              onToggleTen={toggleTen}
            />
          ))}
        </ScrollView>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[GlobalStyles.primaryButton, !isRoundValid && styles.disabledButton]} 
          onPress={submitRound}
          disabled={!isRoundValid}
          activeOpacity={0.8}
        >
          <Text style={[GlobalStyles.primaryButtonText, !isRoundValid && { color: Colors.textMuted }]}>
            SUBMIT ROUND
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// --- Sub-Component: Player Card ---
const LeekhaPlayerCard = ({ 
  player, roundPoints, heartCount, hasQS, hasTen, isQSLocked, isTenLocked, remainingHearts, onHeartChange, onToggleQS, onToggleTen 
}: any) => (
  <View style={styles.compactCard}>
    <View style={styles.compactInfo}>
      <Text style={styles.playerName} numberOfLines={1}>{player.name}</Text>
      <Text style={styles.roundPoints}>
        {roundPoints > 0 ? `+${roundPoints}` : roundPoints}
      </Text>
    </View>
    <View style={styles.compactControls}>
      <View style={styles.compactCounter}>
        <TouchableOpacity onPress={() => onHeartChange(player.id, -1)} disabled={heartCount === 0} style={styles.compactBtn} activeOpacity={0.8}>
          <Text style={styles.compactBtnText}>-</Text>
        </TouchableOpacity>
        <View style={styles.compactHeartVal}>
          <Heart size={10} color={Colors.danger} fill={Colors.danger} />
          <Text style={styles.compactValText}>{heartCount}</Text>
        </View>
        <TouchableOpacity onPress={() => onHeartChange(player.id, 1)} disabled={remainingHearts === 0} style={styles.compactBtn} activeOpacity={0.8}>
          <Text style={styles.compactBtnText}>+</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={() => onToggleQS(player.id)} activeOpacity={0.8} style={[styles.compactSpecialBtn, hasQS ? styles.qsActive : styles.specialCardInactive, isQSLocked && { opacity: 0.3 }]}>
        <Text style={[styles.compactSpecialText, hasQS && { color: Colors.text }]}>Q♠</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onToggleTen(player.id)} activeOpacity={0.8} style={[styles.compactSpecialBtn, hasTen ? styles.tenActive : styles.specialCardInactive, { marginLeft: 6 }, isTenLocked && { opacity: 0.3 }]}>
        <Text style={[styles.compactSpecialText, hasTen && { color: Colors.danger }]}>10♦</Text>
      </TouchableOpacity>
    </View>
  </View>
);

// --- Styles ---
const styles = StyleSheet.create({
  statusRowFixed: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.l,
    paddingVertical: Spacing.m,
    backgroundColor: Colors.background, 
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    zIndex: 5,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  badgeNeutral: { backgroundColor: Colors.surfaceInner, borderColor: Colors.border },
  badgeError: { backgroundColor: 'rgba(255, 82, 82, 0.1)', borderColor: 'rgba(255, 82, 82, 0.3)' },
  badgeQS: { backgroundColor: 'rgba(255, 255, 255, 0.1)', borderColor: 'rgba(255, 255, 255, 0.3)' },
  badgeTen: { backgroundColor: 'rgba(255, 82, 82, 0.1)', borderColor: 'rgba(255, 82, 82, 0.3)' },
  badgeText: { fontSize: 10, fontWeight: 'bold', color: Colors.textMuted },
  compactCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8, 
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row', 
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 80,
  },
  compactInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playerName: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '600',
    maxWidth: 120,
  },
  roundPoints: {
    color: Colors.textMuted,
    fontSize: 16,
    fontWeight: '600',
  },
  compactControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceInner,
    borderRadius: 8,
    padding: 4,
    marginRight: 10,
  },
  compactBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceLight,
    borderRadius: 8,
  },
  compactBtnText: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: -2,
  },
  compactHeartVal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    gap: 4,
  },
  compactValText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  compactSpecialBtn: {
    width: 48,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  specialCardInactive: {
    backgroundColor: Colors.surfaceInner,
    borderColor: Colors.border,
  },
  compactSpecialText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.textMuted,
  },
  qsActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: Colors.text,
  },
  tenActive: {
    backgroundColor: 'rgba(255, 82, 82, 0.15)',
    borderColor: Colors.danger,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.l,
    backgroundColor: Colors.background, 
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  disabledButton: {
    backgroundColor: Colors.surfaceLight,
    shadowOpacity: 0,
    elevation: 0,
  },
  
  // Icon styles for summary
  lastRoundIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 4,
    height: 16,
  },
  iconQS: { color: Colors.text, fontSize: 10, fontWeight: 'bold' },
  iconTen: { color: Colors.danger, fontSize: 10, fontWeight: 'bold' },
  iconHeartContainer: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  iconHeartText: { color: Colors.danger, fontSize: 10, fontWeight: 'bold' },
});