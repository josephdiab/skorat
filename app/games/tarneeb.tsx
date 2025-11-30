import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Check, Crown, X } from "lucide-react-native";
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
import { GameState, GameStorage, Player, RoundHistory } from "../../services/game_storage";

// --- Component ---

export default function TarneebScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const instanceId = (params.instanceId as string) || (params.id as string);

  // --- State ---
  const [isLoaded, setIsLoaded] = useState(false);

  // Default Empty State
  const [teams, setTeams] = useState<Player[]>([]);
  const [history, setHistory] = useState<RoundHistory[]>([]);
  const [roundNum, setRoundNum] = useState(1);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Config
  const [gameName, setGameName] = useState("TARNEEB");
  const [scoreLimit, setScoreLimit] = useState(31);
  const [bestOf, setBestOf] = useState(3);
  
  // Tarneeb Specific State
  const [phase, setPhase] = useState<'bidding' | 'scoring'>('bidding');
  const [callingTeam, setCallingTeam] = useState<'A' | 'B' | null>(null);
  const [bidAmount, setBidAmount] = useState<number>(7);
  const [tricksTaken, setTricksTaken] = useState<number>(7);

  // Helper for Team Names (for UI display)
  const [teamNames, setTeamNames] = useState({ A: "Team A", B: "Team B" });

  // --- LOAD DATA ---
  useEffect(() => {
    const loadGameData = async () => {
      // 1. Resume existing game
      if (instanceId) {
        const savedGame = await GameStorage.get(instanceId);
        if (savedGame) {
          setTeams(savedGame.players);
          setHistory(savedGame.history);
          setRoundNum(savedGame.roundNum);
          setGameName(savedGame.title);
          setScoreLimit(savedGame.scoreLimit || 31);
          setBestOf(savedGame.bestOf || 3);
          // Restore team names from saved player objects
          setTeamNames({
            A: savedGame.players[0].name,
            B: savedGame.players[1].name
          });
          setIsLoaded(true);
          return;
        }
      }

      // 2. Initialize New Game
      if (typeof params.playerNames === 'string') {
        try {
          const names = JSON.parse(params.playerNames);
          let teamAName = "Team A";
          let teamBName = "Team B";
          
          if (names.length === 4) {
            teamAName = `${names[0]} & ${names[1]}`;
            teamBName = `${names[2]} & ${names[3]}`;
          }
          
          setTeamNames({ A: teamAName, B: teamBName });
          
          setTeams([
            { id: 'A', name: teamAName, totalScore: 0, isDanger: false, isLeader: false },
            { id: 'B', name: teamBName, totalScore: 0, isDanger: false, isLeader: false },
          ]);
          
          setGameName((params.gameName as string) || "TARNEEB");
          setScoreLimit(params.scoreLimit ? Number(params.scoreLimit) : 31);
          setBestOf(params.bestOf ? Number(params.bestOf) : 3);
          setIsLoaded(true);
        } catch (e) { console.log(e); }
      }
    };
    loadGameData();
  }, [instanceId]);

  // --- Logic ---

  const isBidValid = callingTeam !== null;

  const getResultPreview = () => {
    if (!callingTeam) return null;
    
    const success = tricksTaken >= bidAmount;
    
    let pointsA = 0;
    let pointsB = 0;

    // Caller: +Tricks if success, -Bid if fail
    const callerPoints = success ? tricksTaken : -bidAmount;
    
    // Defender: 0 if caller success, 13-Tricks if caller fail
    const defenderPoints = success ? 0 : (13 - tricksTaken);

    if (callingTeam === 'A') {
      pointsA = callerPoints;
      pointsB = defenderPoints;
    } else {
      pointsB = callerPoints;
      pointsA = defenderPoints;
    }

    return { callingTeam, success, pointsA, pointsB };
  };

  // --- Handlers ---

  const commitRound = () => {
    if (!callingTeam) return;
    
    const result = getResultPreview();
    if (!result) return;

    const roundDetails: Record<string, any> = {};
    
    const updatedTeams = teams.map(t => {
      const pointsChange = t.id === 'A' ? result.pointsA : result.pointsB;
      roundDetails[t.id] = { score: pointsChange };
      const newTotal = t.totalScore + pointsChange;
      
      return { 
        ...t, 
        totalScore: newTotal,
        // Danger: Red if score is negative
        isDanger: newTotal < 0 
      };
    });

    setHistory(prev => [...prev, { roundNum, playerDetails: roundDetails }]);
    setTeams(updatedTeams);

    // Check Win
    const winner = updatedTeams.find(t => t.totalScore >= scoreLimit);
    if (winner) {
      Alert.alert("Game Over!", `${winner.name} Wins!`);
    } 

    // Reset
    setRoundNum(prev => prev + 1);
    setCallingTeam(null);
    setBidAmount(7);
    setTricksTaken(7);
    setPhase('bidding');
  };

  // --- Persistence ---
  useEffect(() => {
    if (!isLoaded) return;

    const gameState: GameState = {
      id: instanceId,
      instanceId,
      gameType: 'tarneeb',
      status: 'active',
      mode: 'teams',
      title: gameName, 
      roundLabel: `Round ${roundNum}`, 
      lastPlayed: new Date().toISOString(),
      players: teams, 
      history,
      roundNum,
      scoreLimit,
      bestOf,
      isTeamScoreboard: true // TARNEEB IS A TEAM SCOREBOARD
    };
    GameStorage.save(gameState);
  }, [teams, history, roundNum, isLoaded]);

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
        players={teams}
        history={history}
        isExpanded={isExpanded}
        toggleExpand={() => setIsExpanded(!isExpanded)}
      />

      {/* --- Fixed Status Bar --- */}
      <View style={styles.statusRowFixed}>
        {phase === 'bidding' ? (
          <Text style={styles.phaseTitle}>Bidding Phase</Text>
        ) : (
          <View style={GlobalStyles.row}>
             <Text style={styles.phaseTitle}>Playing Round</Text>
             <View style={styles.bidBadge}>
                <Text style={styles.bidBadgeText}>
                   {bidAmount} by Team {callingTeam}
                </Text>
             </View>
          </View>
        )}
      </View>

      {/* --- Main Content --- */}
      <View style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: Spacing.l, paddingBottom: 120, paddingTop: Spacing.xl }}>
          
          {phase === 'bidding' ? (
            <BiddingPhase 
              callingTeam={callingTeam} 
              setCallingTeam={setCallingTeam} 
              bidAmount={bidAmount} 
              setBidAmount={setBidAmount}
              setTricksTaken={setTricksTaken}
              teamNames={teamNames}
            />
          ) : (
            <ScoringPhase 
              callingTeam={callingTeam} 
              tricksTaken={tricksTaken} 
              setTricksTaken={setTricksTaken} 
              preview={getResultPreview()} 
            />
          )}

        </ScrollView>
      </View>

      {/* --- Footer --- */}
      <View style={styles.footer}>
        {phase === 'bidding' ? (
          <TouchableOpacity 
            style={[GlobalStyles.primaryButton, !isBidValid && styles.disabledButton]} 
            onPress={() => setPhase('scoring')}
            disabled={!isBidValid}
          >
            <Text style={[GlobalStyles.primaryButtonText, !isBidValid && { color: Colors.textMuted }]}>
              START ROUND
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={GlobalStyles.primaryButton} 
            onPress={commitRound}
          >
            <Text style={GlobalStyles.primaryButtonText}>CONFIRM SCORE</Text>
          </TouchableOpacity>
        )}
      </View>

    </SafeAreaView>
  );
}

// --- Sub-Components ---

const BiddingPhase = ({ callingTeam, setCallingTeam, bidAmount, setBidAmount, setTricksTaken, teamNames }: any) => (
  <>
    <Text style={styles.sectionLabel}>Which team is calling?</Text>
    <View style={styles.grid}>
      {['A', 'B'].map((team) => (
        <TouchableOpacity
          key={team}
          style={[styles.playerOption, callingTeam === team && styles.playerOptionActive]}
          onPress={() => setCallingTeam(team)}
          activeOpacity={0.8}
        >
          <Text style={[styles.teamNameBig, callingTeam === team && { color: Colors.primary }]}>Team {team}</Text>
          <Text style={styles.teamPlayers}>{teamNames[team]}</Text>
          {callingTeam === team && <Crown size={20} color={Colors.primary} style={{marginTop: 8}} />}
        </TouchableOpacity>
      ))}
    </View>

    <Text style={[styles.sectionLabel, { marginTop: Spacing.l }]}>Call Amount</Text>
    <View style={styles.bidGrid}>
      {[7, 8, 9, 10, 11, 12, 13].map(num => (
        <TouchableOpacity
          key={num}
          style={[styles.bidOption, bidAmount === num && styles.bidOptionActive]}
          onPress={() => {
            setBidAmount(num);
            setTricksTaken(num); 
          }}
          activeOpacity={0.8}
        >
          <Text style={[styles.bidOptionText, bidAmount === num && { color: '#000' }]}>
            {num}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  </>
);

const ScoringPhase = ({ callingTeam, tricksTaken, setTricksTaken, preview }: any) => (
  <View style={styles.scoringContainer}>
     <View style={styles.counterCard}>
       <Text style={styles.counterLabel}>Tricks Taken by Team {callingTeam}</Text>
       <View style={styles.counterRow}>
          <TouchableOpacity onPress={() => setTricksTaken((p: number) => Math.max(0, p - 1))} style={styles.counterBtn}>
            <Text style={styles.counterBtnText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.counterValue}>{tricksTaken}</Text>
          <TouchableOpacity onPress={() => setTricksTaken((p: number) => Math.min(13, p + 1))} style={styles.counterBtn}>
            <Text style={styles.counterBtnText}>+</Text>
          </TouchableOpacity>
       </View>
     </View>

     {preview && (
       <View style={[styles.previewCard, preview.success ? styles.previewSuccess : styles.previewFail]}>
          <View style={GlobalStyles.rowBetween}>
             <View style={GlobalStyles.row}>
                {preview.success 
                  ? <Check size={24} color={Colors.primary} /> 
                  : <X size={24} color={Colors.danger} />
                }
                <Text style={styles.previewTitle}>{preview.success ? "Successful Call" : "Failed Call"}</Text>
             </View>
          </View>
          <View style={styles.divider} />
          <View style={GlobalStyles.rowBetween}>
             <Text style={styles.previewSub}>Team A</Text>
             <Text style={[styles.previewSubScore, { color: preview.pointsA >= 0 ? Colors.text : Colors.danger }]}>
               {preview.pointsA > 0 ? '+' : ''}{preview.pointsA}
             </Text>
          </View>
          <View style={[GlobalStyles.rowBetween, { marginTop: 8 }]}>
             <Text style={styles.previewSub}>Team B</Text>
             <Text style={[styles.previewSubScore, { color: preview.pointsB >= 0 ? Colors.text : Colors.danger }]}>
               {preview.pointsB > 0 ? '+' : ''}{preview.pointsB}
             </Text>
          </View>
       </View>
     )}
  </View>
);

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
  bidBadge: {
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 12,
  },
  bidBadgeText: { color: Colors.text, fontSize: 14, fontWeight: 'bold' },
  sectionLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: Spacing.m,
  },
  grid: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  playerOption: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerOptionActive: { borderColor: Colors.primary, backgroundColor: 'rgba(15, 157, 88, 0.1)' },
  teamNameBig: { color: Colors.text, fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  teamPlayers: { color: Colors.textMuted, fontSize: 12, textAlign: 'center' },
  bidGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  bidOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bidOptionActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  bidOptionText: { color: Colors.text, fontWeight: 'bold', fontSize: 18 },
  scoringContainer: { gap: 20 },
  counterCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  counterLabel: {
    color: Colors.textMuted,
    fontSize: 14,
    textTransform: 'uppercase',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  counterRow: { flexDirection: 'row', alignItems: 'center', gap: 32 },
  counterBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterBtnText: { color: Colors.text, fontSize: 32, marginTop: -4 },
  counterValue: {
    color: Colors.text,
    fontSize: 56,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    minWidth: 80,
    textAlign: 'center',
  },
  previewCard: { borderRadius: 16, padding: 16, borderWidth: 1 },
  previewSuccess: { backgroundColor: 'rgba(15, 157, 88, 0.1)', borderColor: 'rgba(15, 157, 88, 0.3)' },
  previewFail: { backgroundColor: 'rgba(255, 82, 82, 0.1)', borderColor: 'rgba(255, 82, 82, 0.3)' },
  previewTitle: { color: Colors.text, fontSize: 18, fontWeight: 'bold', marginLeft: 12 },
  previewSub: { color: Colors.textMuted, fontSize: 14, fontWeight: '600' },
  previewSubScore: { color: Colors.text, fontSize: 18, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 12 },
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