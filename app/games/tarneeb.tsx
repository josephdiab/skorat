import { useKeepAwake } from "expo-keep-awake";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Check, Crown, RotateCcw, X } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
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
import { GameState, Player, RoundHistory, UserProfile } from "../../constants/types";
import { GameStorage } from "../../services/game_storage";

type Phase = 'bidding' | 'scoring' | 'gameover';

export default function TarneebScreen() {
  useKeepAwake();
  
  const router = useRouter();
  const params = useLocalSearchParams();
  const instanceId = (params.instanceId as string) || (params.id as string);

  // --- State ---
  const [isLoaded, setIsLoaded] = useState(false);
  const [gameId, setGameId] = useState<string>("");

  // Storage: 4 Players (0+1=Team A, 2+3=Team B)
  const [players, setPlayers] = useState<Player[]>([]);
  const [history, setHistory] = useState<RoundHistory[]>([]);
  const [roundNum, setRoundNum] = useState(1);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const [gameName, setGameName] = useState("TARNEEB");
  const [scoreLimit, setScoreLimit] = useState(31);
  const [gameStatus, setGameStatus] = useState<'active' | 'completed'>('active');
  
  const [phase, setPhase] = useState<Phase>('bidding');
  const [callingTeam, setCallingTeam] = useState<'A' | 'B' | null>(null);
  const [bidAmount, setBidAmount] = useState<number>(7);
  const [tricksTaken, setTricksTaken] = useState<number>(7);

  const [editingRound, setEditingRound] = useState<{
    index: number;
    callingTeam: 'A' | 'B';
    bidAmount: number;
    tricksTaken: number;
  } | null>(null);

  // Helper for Team Names
  const teamAName = players.length >= 2 
    ? `${players[0].name.split(' ')[0]} & ${players[1].name.split(' ')[0]}` 
    : "Team A";
  const teamBName = players.length >= 4 
    ? `${players[2].name.split(' ')[0]} & ${players[3].name.split(' ')[0]}` 
    : "Team B";
  const teamNames = { A: teamAName, B: teamBName };

  // --- VIEW MODEL (Transform 4 Players -> 2 Teams for Scoreboard) ---
  const scoreboardPlayers = useMemo(() => {
    if (players.length < 4) return [];
    return [
      { 
        id: 'A', 
        name: teamAName, 
        totalScore: players[0].totalScore, 
        isDanger: players[0].isDanger, 
        profileId: 'team-a' 
      },
      { 
        id: 'B', 
        name: teamBName, 
        totalScore: players[2].totalScore, 
        isDanger: players[2].isDanger, 
        profileId: 'team-b' 
      }
    ];
  }, [players, teamAName, teamBName]);

  const scoreboardHistory = useMemo(() => {
    return history.map(h => ({
      roundNum: h.roundNum,
      playerDetails: {
        'A': h.playerDetails['1'] || {},
        'B': h.playerDetails['3'] || {}
      }
    }));
  }, [history]);

  // --- LOAD DATA ---
  useEffect(() => {
    const loadGameData = async () => {
      // 1. Resume existing game
      if (instanceId) {
        const savedGame = await GameStorage.get(instanceId);
        if (savedGame) {
          setGameId(savedGame.id);
          setPlayers(savedGame.players);
          setHistory(savedGame.history);
          setRoundNum(savedGame.history.length + 1);
          setGameName(savedGame.title);
          setScoreLimit(savedGame.scoreLimit || 31);
          setGameStatus(savedGame.status);
          if (savedGame.status === 'completed') setPhase('gameover');
          setIsLoaded(true);
          return;
        }
      }

      // 2. Initialize New Game
      if (params.playerProfiles) {
        try {
          const profiles: UserProfile[] = JSON.parse(params.playerProfiles as string);
          
          // Create 4 distinct players
          const initialPlayers: Player[] = profiles.map((p, i) => ({
            id: (i + 1).toString(), // IDs: 1, 2, 3, 4
            profileId: p.id,
            name: p.name,
            totalScore: 0,
            isDanger: false
          }));
          
          setGameId(Date.now().toString());
          setPlayers(initialPlayers);
          setGameName((params.gameName as string) || "TARNEEB");
          setScoreLimit(params.scoreLimit ? Number(params.scoreLimit) : 31);
          setIsLoaded(true);
        } catch (e) { console.log(e); }
      }
    };
    loadGameData();
  }, [instanceId]);

  // --- Logic ---
  const isBidValid = callingTeam !== null;

  const calculateRoundScores = (caller: 'A' | 'B' | null, bid: number, tricks: number) => {
    if (!caller) return null; 

    const success = tricks >= bid;
    const callerPoints = success ? tricks : -bid;
    const defenderPoints = success ? 0 : (13 - tricks);

    return {
      pointsA: caller === 'A' ? callerPoints : defenderPoints,
      pointsB: caller === 'B' ? callerPoints : defenderPoints,
      success
    };
  };

  // --- Handlers ---
  const commitRound = () => {
    if (!callingTeam) return;
    
    const result = calculateRoundScores(callingTeam, bidAmount, tricksTaken);
    if (!result) return;

    const roundDetails: Record<string, any> = {};
    
    let updatedPlayers = players.map((p, index) => {
      // Index 0,1 = Team A. Index 2,3 = Team B.
      const isTeamA = index < 2;
      const pointsChange = isTeamA ? result.pointsA : result.pointsB;
      const isMyTeamCalling = (isTeamA && callingTeam === 'A') || (!isTeamA && callingTeam === 'B');

      roundDetails[p.id] = {
        score: pointsChange,
        isCaller: isMyTeamCalling,
        bid: bidAmount,
        tricks: tricksTaken
      };

      const newTotal = p.totalScore + pointsChange;
      return { 
        ...p, 
        totalScore: newTotal,
        isDanger: newTotal < 0 
      };
    });

    setHistory(prev => [...prev, { roundNum, playerDetails: roundDetails }]);

    // Check Win
    const winner = updatedPlayers.find(p => p.totalScore >= scoreLimit);
    if (winner) {
      const winningTeam = players.indexOf(winner) < 2 ? 'A' : 'B';
      
      // Mark Winners
      updatedPlayers = updatedPlayers.map((p, index) => {
          const isTeamA = index < 2;
          return {
              ...p,
              isWinner: winningTeam === 'A' ? isTeamA : !isTeamA
          };
      });
      
      const winningTeamName = winningTeam === 'A' ? teamAName : teamBName;
      Alert.alert("Game Over!", `${winningTeamName} Wins!`);
      setPlayers(updatedPlayers);
      setGameStatus('completed');
      setPhase('gameover');
      return;
    } 

    setPlayers(updatedPlayers);
    setRoundNum(prev => prev + 1);
    setCallingTeam(null);
    setBidAmount(7);
    setTricksTaken(7);
    setPhase('bidding');
  };

  const handleRematch = () => {
    const profileParams = players.map(p => ({ id: p.profileId, name: p.name }));

    router.push({
      pathname: "/games/tarneeb",
      params: {
        playerProfiles: JSON.stringify(profileParams),
        gameName: gameName,
        scoreLimit: scoreLimit.toString(),
        mode: 'teams'
      }
    });
  };

  const startEditingRound = (index: number) => {
    const round = history[index];
    const detailsA = round.playerDetails['1'] as any; 
    const detailsB = round.playerDetails['3'] as any;
    let caller: 'A' | 'B' = 'A';
    let bid = 7;
    let tricks = 7;
    if (detailsA?.isCaller) { caller = 'A'; bid = detailsA.bid; tricks = detailsA.tricks; }
    else if (detailsB?.isCaller) { caller = 'B'; bid = detailsB.bid; tricks = detailsB.tricks; }
    setEditingRound({ index, callingTeam: caller, bidAmount: bid, tricksTaken: tricks });
  };

  const saveEditedRound = () => {
    if (!editingRound) return;
    const result = calculateRoundScores(editingRound.callingTeam, editingRound.bidAmount, editingRound.tricksTaken);
    if (!result) return;
    const newHistory = [...history];
    const roundDetails: Record<string, any> = {};
    players.forEach((p, index) => {
      const isTeamA = index < 2;
      const pointsChange = isTeamA ? result.pointsA : result.pointsB;
      const isMyTeamCalling = (isTeamA && editingRound.callingTeam === 'A') || (!isTeamA && editingRound.callingTeam === 'B');
      roundDetails[p.id] = { score: pointsChange, isCaller: isMyTeamCalling, bid: editingRound.bidAmount, tricks: editingRound.tricksTaken };
    });
    newHistory[editingRound.index] = { ...newHistory[editingRound.index], playerDetails: roundDetails };
    const recalculatedPlayers = players.map(p => {
      const totalScore = newHistory.reduce((sum, round) => { return sum + (round.playerDetails[p.id]?.score || 0); }, 0);
      return { ...p, totalScore, isDanger: totalScore < 0 };
    });
    setHistory(newHistory);
    setPlayers(recalculatedPlayers);
    setEditingRound(null);
  };

  useEffect(() => {
    if (!isLoaded || !gameId) return;
    const gameState: GameState = {
      id: gameId,
      instanceId: gameId,
      gameType: 'tarneeb',
      status: gameStatus,
      mode: 'teams',
      title: gameName, 
      roundLabel: `Round ${roundNum}`, 
      lastPlayed: new Date().toISOString(),
      players: players, // Saving 4 Players
      history,
      scoreLimit,
      isTeamScoreboard: true // Render big team score in Match Card
    };
    GameStorage.save(gameState);
  }, [players, history, roundNum, isLoaded, gameId, gameStatus]);

  if (!isLoaded) return <SafeAreaView style={GlobalStyles.container} />;

  return (
    <SafeAreaView style={GlobalStyles.container} edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ headerShown: false }} />
      <GameHeader 
        title={gameName.toUpperCase()} 
        subtitle={gameStatus === 'completed' ? "COMPLETED" : `Score Limit: ${scoreLimit}`}
        onBack={() => router.dismissAll()} 
      />
      
      <ScoreboardHistory 
        players={scoreboardPlayers}
        history={scoreboardHistory}
        isExpanded={isExpanded}
        toggleExpand={() => setIsExpanded(!isExpanded)}
        onEditRound={startEditingRound}
        isTeamScoreboard={true}
      />

      {phase !== 'gameover' ? (
        <>
          <View style={styles.statusRowFixed}>
            {phase === 'bidding' ? (
              <>
                <Text style={styles.phaseTitle}>Place Bids</Text>
                <View style={[styles.badge, callingTeam ? styles.badgeSuccess : styles.badgeError]}>
                    <Text style={[styles.badgeText, callingTeam ? { color: Colors.primary } : { color: Colors.danger }]}>
                      Total: {callingTeam ? bidAmount : 0}
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
                  preview={calculateRoundScores(callingTeam, bidAmount, tricksTaken)} 
                />
              )}
            </ScrollView>
          </View>

          <View style={styles.footer}>
            {phase === 'bidding' ? (
              <TouchableOpacity 
                style={[GlobalStyles.primaryButton, !callingTeam && styles.disabledButton]} 
                onPress={() => setPhase('scoring')}
                disabled={!callingTeam}
              >
                <Text style={[GlobalStyles.primaryButtonText, !callingTeam && { color: Colors.textMuted }]}>START ROUND</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={GlobalStyles.primaryButton} onPress={commitRound}>
                <Text style={GlobalStyles.primaryButtonText}>CONFIRM SCORE</Text>
              </TouchableOpacity>
            )}
          </View>
        </>
      ) : (
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20}}>
           <Text style={{color: Colors.primary, fontSize: 24, fontWeight: 'bold'}}>Match Completed</Text>
           <TouchableOpacity style={styles.rematchBtn} onPress={handleRematch}>
              <RotateCcw size={20} color="#000" />
              <Text style={styles.rematchText}>REMATCH</Text>
           </TouchableOpacity>
        </View>
      )}

      {editingRound && (
        <Modal animationType="slide" transparent={true} visible={true}>
           <View style={styles.modalOverlay}>
             <View style={styles.modalContent}>
               <Text style={styles.modalTitle}>Edit Round {editingRound.index + 1}</Text>
               <ScrollView style={{ maxHeight: 400 }}>
                 <View style={{gap: 20}}>
                   <View>
                     <Text style={[styles.sectionLabel, {marginBottom: 10}]}>Bidding</Text>
                     <BiddingPhase 
                        callingTeam={editingRound.callingTeam} 
                        setCallingTeam={(t: any) => setEditingRound(prev => prev ? ({...prev, callingTeam: t}) : null)}
                        bidAmount={editingRound.bidAmount} 
                        setBidAmount={(b: any) => setEditingRound(prev => prev ? ({...prev, bidAmount: b}) : null)}
                        setTricksTaken={() => {}} 
                        teamNames={teamNames}
                        isModal={true}
                      />
                   </View>
                   <View style={{borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 20}}>
                     <Text style={[styles.sectionLabel, {marginBottom: 10}]}>Result</Text>
                     <ScoringPhase 
                        callingTeam={editingRound.callingTeam} 
                        tricksTaken={editingRound.tricksTaken} 
                        setTricksTaken={(t: any) => setEditingRound(prev => prev ? ({...prev, tricksTaken: typeof t === 'function' ? t(prev.tricksTaken) : t}) : null)}
                        preview={calculateRoundScores(editingRound.callingTeam, editingRound.bidAmount, editingRound.tricksTaken)}
                        isModal={true} 
                      />
                   </View>
                 </View>
               </ScrollView>
               <View style={styles.modalFooter}>
                 <TouchableOpacity onPress={() => setEditingRound(null)} style={styles.modalCancel}>
                   <Text style={{color: Colors.textMuted}}>Cancel</Text>
                 </TouchableOpacity>
                 <TouchableOpacity onPress={saveEditedRound} style={styles.modalSave}>
                   <Text style={{color: Colors.text, fontWeight: 'bold'}}>Save Changes</Text>
                 </TouchableOpacity>
               </View>
             </View>
           </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

// --- Sub-Components (Unchanged) ---

const BiddingPhase = ({ callingTeam, setCallingTeam, bidAmount, setBidAmount, setTricksTaken, teamNames, isModal = false }: any) => (
  <>
    <Text style={[styles.sectionLabel, isModal && {fontSize: 10, marginBottom: 4}]}>Which team is calling?</Text>
    <View style={[styles.grid, isModal && {gap: 8}]}>
      {['A', 'B'].map((team) => (
        <TouchableOpacity
          key={team}
          style={[
            styles.playerOption, 
            callingTeam === team && styles.playerOptionActive,
            isModal && { padding: 12, borderRadius: 12 } 
          ]}
          onPress={() => setCallingTeam(team)}
          activeOpacity={0.8}
        >
          <Text style={[styles.teamNameBig, callingTeam === team && { color: Colors.primary }, isModal && {fontSize: 16, marginBottom: 2}]}>Team {team}</Text>
          <Text style={[styles.teamPlayers, isModal && {fontSize: 10}]}>{teamNames[team]}</Text>
          {callingTeam === team && <Crown size={isModal ? 16 : 20} color={Colors.primary} style={{marginTop: isModal ? 4 : 8}} />}
        </TouchableOpacity>
      ))}
    </View>

    <Text style={[styles.sectionLabel, { marginTop: Spacing.l }, isModal && {marginTop: Spacing.m, fontSize: 10, marginBottom: 4}]}>Call Amount</Text>
    <View style={[styles.bidGrid, isModal && {gap: 8}]}>
      {[7, 8, 9, 10, 11, 12, 13].map(num => (
        <TouchableOpacity
          key={num}
          style={[
            styles.bidOption, 
            bidAmount === num && styles.bidOptionActive,
            isModal && {width: 40, height: 40, borderRadius: 20} 
          ]}
          onPress={() => {
            setBidAmount(num);
            setTricksTaken(num); // Auto-set
          }}
          activeOpacity={0.8}
        >
          <Text style={[styles.bidOptionText, bidAmount === num && { color: '#000' }, isModal && {fontSize: 14}]}>{num}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </>
);

const ScoringPhase = ({ callingTeam, tricksTaken, setTricksTaken, preview, isModal = false }: any) => (
  <View style={[styles.scoringContainer, isModal && {gap: 12, flexDirection: 'row'}]}>
     <View style={[styles.counterCard, isModal && {padding: 12, flex: 1}]}>
       <Text style={[styles.counterLabel, isModal && {fontSize: 10, marginBottom: 8, textAlign: 'center'}]}>{isModal ? `Tricks (${callingTeam})` : `Tricks Taken by Team ${callingTeam}`}</Text>
       <View style={[styles.counterRow, isModal && {gap: 8, justifyContent: 'center'}]}>
          <TouchableOpacity onPress={() => setTricksTaken((p: number) => Math.max(0, p - 1))} style={[styles.counterBtn, isModal && {width: 32, height: 32, borderRadius: 16}]}>
            <Text style={[styles.counterBtnText, isModal && {fontSize: 20, marginTop: -2}]}>-</Text>
          </TouchableOpacity>
          <Text style={[styles.counterValue, isModal && {fontSize: 28, minWidth: 30}]}>{tricksTaken}</Text>
          <TouchableOpacity onPress={() => setTricksTaken((p: number) => Math.min(13, p + 1))} style={[styles.counterBtn, isModal && {width: 32, height: 32, borderRadius: 16}]}>
            <Text style={[styles.counterBtnText, isModal && {fontSize: 20, marginTop: -2}]}>+</Text>
          </TouchableOpacity>
       </View>
     </View>

     {preview && (
       <View style={[styles.previewCard, preview.success ? styles.previewSuccess : styles.previewFail, isModal && {padding: 12, flex: 1}]}>
          <View style={GlobalStyles.rowBetween}>
             <View style={GlobalStyles.row}>
                {preview.success ? <Check size={isModal ? 16 : 24} color={Colors.primary} /> : <X size={isModal ? 16 : 24} color={Colors.danger} />}
                <Text style={[styles.previewTitle, isModal && {fontSize: 14, marginLeft: 6}]}>{preview.success ? "Success" : "Failed"}</Text>
             </View>
          </View>
          <View style={[styles.divider, isModal && {marginVertical: 8}]} />
          <View style={GlobalStyles.rowBetween}>
             <Text style={[styles.previewSub, isModal && {fontSize: 10}]}>Team A</Text>
             <Text style={[styles.previewSubScore, { color: preview.pointsA >= 0 ? Colors.text : Colors.danger }, isModal && {fontSize: 14}]}>
               {preview.pointsA > 0 ? '+' : ''}{preview.pointsA}
             </Text>
          </View>
          <View style={[GlobalStyles.rowBetween, { marginTop: isModal ? 4 : 8 }]}>
             <Text style={[styles.previewSub, isModal && {fontSize: 10}]}>Team B</Text>
             <Text style={[styles.previewSubScore, { color: preview.pointsB >= 0 ? Colors.text : Colors.danger }, isModal && {fontSize: 14}]}>
               {preview.pointsB > 0 ? '+' : ''}{preview.pointsB}
             </Text>
          </View>
       </View>
     )}
  </View>
);

const styles = StyleSheet.create({
  statusRowFixed: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.l, paddingVertical: Spacing.m, backgroundColor: Colors.background, borderBottomWidth: 1, borderBottomColor: Colors.border, zIndex: 5 },
  phaseTitle: { color: Colors.text, fontSize: 18, fontWeight: 'bold' },
  sectionLabel: { color: Colors.textMuted, fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: Spacing.m },
  grid: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  playerOption: { flex: 1, backgroundColor: Colors.surface, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  playerOptionActive: { borderColor: Colors.primary, backgroundColor: 'rgba(15, 157, 88, 0.1)' },
  teamNameBig: { color: Colors.text, fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  teamPlayers: { color: Colors.textMuted, fontSize: 12, textAlign: 'center' },
  bidGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  bidOption: { width: 50, height: 50, borderRadius: 25, backgroundColor: Colors.surfaceLight, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  bidOptionActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  bidOptionText: { color: Colors.text, fontWeight: 'bold', fontSize: 18 },
  scoringContainer: { gap: 20 },
  counterCard: { backgroundColor: Colors.surface, borderRadius: 20, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  counterLabel: { color: Colors.textMuted, fontSize: 14, textTransform: 'uppercase', fontWeight: 'bold', marginBottom: 20 },
  counterRow: { flexDirection: 'row', alignItems: 'center', gap: 32 },
  counterBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.surfaceLight, alignItems: 'center', justifyContent: 'center' },
  counterBtnText: { color: Colors.text, fontSize: 32, marginTop: -4 },
  counterValue: { color: Colors.text, fontSize: 56, fontWeight: '800', fontVariant: ['tabular-nums'], minWidth: 80, textAlign: 'center' },
  previewCard: { borderRadius: 16, padding: 16, borderWidth: 1 },
  previewSuccess: { backgroundColor: 'rgba(15, 157, 88, 0.1)', borderColor: 'rgba(15, 157, 88, 0.3)' },
  previewFail: { backgroundColor: 'rgba(255, 82, 82, 0.1)', borderColor: 'rgba(255, 82, 82, 0.3)' },
  previewTitle: { color: Colors.text, fontSize: 18, fontWeight: 'bold', marginLeft: 12 },
  previewSub: { color: Colors.textMuted, fontSize: 14, fontWeight: '600' },
  previewSubScore: { color: Colors.text, fontSize: 18, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 12 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing.l, backgroundColor: Colors.background, borderTopWidth: 1, borderTopColor: Colors.border },
  disabledButton: { backgroundColor: Colors.surfaceLight, shadowOpacity: 0, elevation: 0 },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, gap: 4 },
  badgeSuccess: { backgroundColor: 'rgba(15, 157, 88, 0.1)', borderColor: Colors.primary },
  badgeError: { backgroundColor: 'rgba(255, 82, 82, 0.1)', borderColor: Colors.danger },
  badgeText: { fontSize: 12, fontWeight: 'bold' },
  // Rematch Button
  rematchBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, gap: 8 },
  rematchText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: 10 },
  modalContent: { backgroundColor: Colors.surface, borderRadius: 16, padding: 20, paddingBottom: 30 },
  modalTitle: { color: Colors.text, fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  modalFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: Colors.border },
  modalCancel: { padding: 12 },
  modalSave: { backgroundColor: Colors.primary, padding: 12, borderRadius: 8 },
});