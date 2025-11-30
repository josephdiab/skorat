import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ThumbsDown, ThumbsUp } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GameHeader } from "../../components/game_header";
import { ScoreboardHistory } from "../../components/scoreboard_history";
import { Colors, GlobalStyles, Spacing } from "../../constants/theme";
import { GameStorage, Player, RoundHistory } from "../../services/game_storage";

// --- 400 Game Logic Helpers ---

const calculatePoints = (bid: number) => {
  if (bid >= 7) return bid * 3;
  if (bid >= 5) return bid * 2; 
  return bid; // 2-4
};

const getMinBidForPlayer = (score: number) => {
  if (score >= 40) return 4;
  if (score >= 30) return 3;
  return 2;
};

// --- Component ---

export default function FourHundredScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // --- Initialization ---
  const initializePlayers = (): Player[] => {
    if (typeof params.playerNames === 'string') {
      try {
        let names = JSON.parse(params.playerNames);
        // Reorder from NewGame [A1, A2, B1, B2] to Alternating [A1, B1, A2, B2]
        if (params.mode === 'teams' && names.length === 4) {
          names = [names[0], names[2], names[1], names[3]];
        }
        return names.map((name: string, index: number) => ({
          id: (index + 1).toString(),
          name: name,
          totalScore: 0,
          isDanger: false
        }));
      } catch (e) { console.log(e); }
    }
    return [];
  };

  // --- State ---
  const [players, setPlayers] = useState<Player[]>(initializePlayers);
  const [history, setHistory] = useState<RoundHistory[]>([]);
  const [roundNum, setRoundNum] = useState(1);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Game Config
  const [gameName] = useState((params.gameName as string) || "400");
  const [bestOf] = useState(params.bestOf ? Number(params.bestOf) : 41); // Default to 41 for 400
  
  // 400 Specific State
  const [phase, setPhase] = useState<'bidding' | 'scoring' | 'gameover'>('bidding');
  // Store bids/results in a map by Player ID for safer access
  const [bids, setBids] = useState<Record<string, number>>({});
  const [results, setResults] = useState<Record<string, boolean>>({}); 
  
  // Initialize Bids when players loaded
  useEffect(() => {
    const initialBids: Record<string, number> = {};
    const initialResults: Record<string, boolean> = {};
    players.forEach(p => {
      initialBids[p.id] = getMinBidForPlayer(p.totalScore);
      initialResults[p.id] = true; // Default to 'Won'
    });
    setBids(initialBids);
    setResults(initialResults);
  }, [roundNum]); // Reset on new round

  // --- Logic ---

  const getTableMinTotal = () => {
    const maxScore = Math.max(...players.map(p => p.totalScore));
    if (maxScore >= 40) return 13;
    if (maxScore >= 30) return 12;
    return 11;
  };

  const currentTotalBids = Object.values(bids).reduce((a, b) => a + b, 0);
  const requiredTotal = getTableMinTotal();
  const isBiddingValid = currentTotalBids >= requiredTotal;

  // --- Handlers ---

  const adjustBid = (pid: string, delta: number) => {
    const p = players.find(pl => pl.id === pid);
    if (!p) return;
    
    const currentBid = bids[pid] || 2;
    const min = getMinBidForPlayer(p.totalScore);
    const max = 13;
    
    let newBid = currentBid + delta;
    if (newBid < min) newBid = min;
    if (newBid > max) newBid = max;

    setBids(prev => ({ ...prev, [pid]: newBid }));
  };

  const commitRound = () => {
    const roundDetails: Record<string, any> = {};
    
    const updatedPlayers = players.map(p => {
      const bid = bids[p.id];
      const passed = results[p.id];
      const points = calculatePoints(bid);
      const change = passed ? points : -points;
      
      // Store for history
      roundDetails[p.id] = {
        score: change, 
        bid: bid,
        passed: passed
      };

      const newTotal = p.totalScore + change;
      return { 
        ...p, 
        totalScore: newTotal,
        isDanger: newTotal < 0 
      };
    });

    setHistory(prev => [...prev, { roundNum, playerDetails: roundDetails }]);
    setPlayers(updatedPlayers);

    // Check Win Condition (Partner support)
    for (let i = 0; i < 4; i++) {
      const p = updatedPlayers[i];
      const partner = updatedPlayers[(i + 2) % 4];
      
      // Win if score >= 41 AND partner >= 0
      if (p.totalScore >= 41 && partner.totalScore >= 0) {
        Alert.alert("Game Over!", `${p.name} and ${partner.name} Win!`);
        setPhase('gameover');
        return;
      }
    }

    setRoundNum(prev => prev + 1);
    setPhase('bidding');
  };

  // --- Persistence ---
  useEffect(() => {
    const gameState: any = {
      id: "current-match",
      mode: 'teams',
      title: gameName, 
      roundLabel: `Round ${roundNum}`, 
      lastPlayed: "Active Now",
      players,
      history,
      roundNum,
      bestOf,
      isTeamScoreboard: false // 400 tracks individual scores
    };
    GameStorage.save(gameState);
  }, [players, history, roundNum]);

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
      />

      {/* --- Fixed Status Bar --- */}
      <View style={styles.statusRowFixed}>
        {phase === 'bidding' ? (
          <>
            <Text style={styles.phaseTitle}>Place Bids</Text>
            <View style={[styles.badge, isBiddingValid ? styles.badgeSuccess : styles.badgeError]}>
                <Text style={[styles.badgeText, isBiddingValid ? { color: Colors.primary } : { color: Colors.danger }]}>
                  Total: {currentTotalBids} / {requiredTotal}
                </Text>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.phaseTitle}>Round Results</Text>
            <Text style={GlobalStyles.textSmall}>Select Outcome</Text>
          </>
        )}
      </View>

      {/* --- Main Content --- */}
      <View style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: Spacing.l, paddingBottom: 100, paddingTop: Spacing.xl }}>
          
          {phase === 'bidding' ? (
            <View style={styles.biddingGrid}>
              {players.map(p => (
                <BiddingCard 
                  key={p.id} 
                  player={p} 
                  bid={bids[p.id]} 
                  onAdjust={(delta) => adjustBid(p.id, delta)} 
                />
              ))}
            </View>
          ) : (
            <View style={{ gap: 8 }}>
              {players.map(p => (
                <ScoringCard 
                  key={p.id} 
                  player={p} 
                  bid={bids[p.id]} 
                  passed={results[p.id]} 
                  onSetResult={(res) => setResults(prev => ({ ...prev, [p.id]: res }))} 
                />
              ))}
            </View>
          )}

        </ScrollView>
      </View>

      {/* --- Footer --- */}
      <View style={styles.footer}>
        {phase === 'bidding' ? (
          <TouchableOpacity 
            style={[GlobalStyles.primaryButton, !isBiddingValid && styles.disabledButton]} 
            onPress={() => setPhase('scoring')}
            disabled={!isBiddingValid}
          >
            <Text style={[GlobalStyles.primaryButtonText, !isBiddingValid && { color: Colors.textMuted }]}>
              START ROUND
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={GlobalStyles.primaryButton} onPress={commitRound}>
            <Text style={GlobalStyles.primaryButtonText}>UPDATE SCOREBOARD</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

// --- Sub-Components ---

const BiddingCard = ({ player, bid, onAdjust }: { player: Player, bid: number, onAdjust: (d: number) => void }) => (
  <View style={styles.biddingCard}>
    <View style={{ alignItems: 'center', marginBottom: 8 }}>
      <Text style={styles.playerNameSmall} numberOfLines={1}>{player.name}</Text>
      <Text style={styles.minBidTextSmall}>Min: {getMinBidForPlayer(player.totalScore)}</Text>
    </View>
    
    <View style={styles.controlsRowCompact}>
      <TouchableOpacity onPress={() => onAdjust(-1)} style={styles.controlBtnSmall}>
        <Text style={styles.controlBtnTextSmall}>-</Text>
      </TouchableOpacity>
      
      <Text style={styles.bidValueSmall}>{bid || 2}</Text>
      
      <TouchableOpacity onPress={() => onAdjust(1)} style={styles.controlBtnSmall}>
        <Text style={styles.controlBtnTextSmall}>+</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const ScoringCard = ({ player, bid, passed, onSetResult }: { player: Player, bid: number, passed: boolean, onSetResult: (res: boolean) => void }) => {
  const points = calculatePoints(bid);
  
  return (
    <View style={styles.scoringCardCompact}>
      {/* Left: Info */}
      <View style={styles.scoringInfo}>
        <Text style={styles.playerNameSmall} numberOfLines={1}>{player.name}</Text>
        {/* Removed Bid display as requested */}
      </View>

      {/* Right: Buttons */}
      <View style={styles.scoringButtonsContainer}>
        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={() => onSetResult(false)}
          style={[styles.compactResultBtn, !passed ? styles.brokeActive : styles.buttonInactive]}
        >
          <ThumbsDown size={14} color={!passed ? "#fff" : Colors.textMuted} />
          <Text style={[styles.toggleTextSmall, !passed && { color: '#fff' }]}>BROKE</Text>
          {!passed && <Text style={styles.scorePreviewSmall}>-{points}</Text>}
        </TouchableOpacity>

        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={() => onSetResult(true)}
          style={[styles.compactResultBtn, passed ? styles.wonActive : styles.buttonInactive]}
        >
          <ThumbsUp size={14} color={passed ? "#fff" : Colors.textMuted} />
          <Text style={[styles.toggleTextSmall, passed && { color: '#fff' }]}>WON</Text>
          {passed && <Text style={styles.scorePreviewSmall}>+{points}</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
};

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
  phaseTitle: { color: Colors.text, fontSize: 18, fontWeight: 'bold' },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeSuccess: { backgroundColor: 'rgba(15, 157, 88, 0.1)', borderColor: Colors.primary },
  badgeError: { backgroundColor: 'rgba(255, 82, 82, 0.1)', borderColor: Colors.danger },
  badgeText: { fontSize: 12, fontWeight: 'bold' },
  
  // Bidding Grid
  biddingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  biddingCard: {
    width: '48%',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  playerNameSmall: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    flex: 1,
  },
  minBidTextSmall: { color: Colors.textMuted, fontSize: 10 },
  controlsRowCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  controlBtnSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlBtnTextSmall: {
    color: Colors.text,
    fontSize: 20,
    lineHeight: 22,
    fontWeight: 'bold',
  },
  bidValueSmall: { fontSize: 24, fontWeight: 'bold', color: Colors.text },

  // Scoring
  scoringCardCompact: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 64,
  },
  scoringInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  scoringButtonsContainer: { flexDirection: 'row', gap: 8 },
  compactResultBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    minWidth: 80,
    justifyContent: 'center',
  },
  buttonInactive: { backgroundColor: Colors.surfaceInner, borderColor: Colors.border },
  brokeActive: { backgroundColor: 'rgba(255, 82, 82, 0.15)', borderColor: Colors.danger },
  wonActive: { backgroundColor: 'rgba(15, 157, 88, 0.15)', borderColor: Colors.primary },
  toggleTextSmall: { fontSize: 11, fontWeight: 'bold', color: Colors.textMuted },
  scorePreviewSmall: { fontSize: 11, fontWeight: 'bold', color: '#fff' },
  
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
  disabledButton: { backgroundColor: Colors.surfaceLight, shadowOpacity: 0, elevation: 0 },
});