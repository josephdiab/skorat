import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Heart } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
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
import { GameStorage, Player, RoundDetails, RoundHistory } from "../../services/game_storage";

// --- Component ---

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
  
  const [mode, setMode] = useState<'solo' | 'teams'>('solo');
  const [gameName, setGameName] = useState("LEEKHA");
  const [scoreLimit, setScoreLimit] = useState<number | undefined>(101);
  const [bestOf, setBestOf] = useState<number>(3); 

  const [hearts, setHearts] = useState<Record<string, number>>({ "1": 0, "2": 0, "3": 0, "4": 0 });
  const [qsHolder, setQsHolder] = useState<string | null>(null);
  const [tenHolder, setTenHolder] = useState<string | null>(null);

  const [editingRound, setEditingRound] = useState<{
    index: number;
    hearts: Record<string, number>;
    qsHolder: string | null;
    tenHolder: string | null;
  } | null>(null);

  // --- LOAD DATA ---
  useEffect(() => {
    const loadGameData = async () => {
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

  // --- Logic ---
  const getRoundPoints = (h: number, isQS: boolean, isTen: boolean) => {
    let points = h;
    if (isQS) points += 13;
    if (isTen) points += 10;
    return points;
  };

  const totalHeartsAssigned = Object.values(hearts).reduce((a, b) => a + b, 0);
  const remainingHearts = 13 - totalHeartsAssigned;
  const currentRoundPoints = (pid: string) => getRoundPoints(hearts[pid] || 0, qsHolder === pid, tenHolder === pid);
  const currentTotalPoints = players.reduce((sum, p) => sum + currentRoundPoints(p.id), 0);
  const isRoundValid = remainingHearts === 0 && qsHolder !== null && tenHolder !== null && currentTotalPoints === 36;

  // --- Handlers ---
  const handleHeartChange = (pid: string, delta: number) => {
    const current = hearts[pid] || 0;
    const newVal = current + delta;
    if (newVal < 0) return;
    if (delta > 0 && remainingHearts <= 0) return;
    setHearts(prev => ({ ...prev, [pid]: newVal }));
  };

  const toggleQS = (pid: string) => setQsHolder(p => (p === pid ? null : (p !== null ? p : pid)));
  const toggleTen = (pid: string) => setTenHolder(p => (p === pid ? null : (p !== null ? p : pid)));

  const submitRound = () => {
    if (!isRoundValid) return;

    const currentRoundDetails: Record<string, RoundDetails> = {};
    players.forEach(p => {
      currentRoundDetails[p.id] = {
        score: currentRoundPoints(p.id),
        hearts: hearts[p.id] || 0,
        hasQS: qsHolder === p.id,
        hasTen: tenHolder === p.id
      };
    });

    setHistory(prev => [...prev, { roundNum, playerDetails: currentRoundDetails }]);

    const updatedPlayers = players.map(p => {
      const newTotal = p.totalScore + currentRoundPoints(p.id);
      return {
        ...p,
        totalScore: newTotal,
        isDanger: scoreLimit ? newTotal >= (scoreLimit * 0.85) : false 
      };
    });
    setPlayers(updatedPlayers);
    
    const loser = updatedPlayers.find(p => scoreLimit && p.totalScore >= scoreLimit);
    if (loser) Alert.alert("Game Over", `${loser.name} has reached the limit!`);

    setHearts({ "1": 0, "2": 0, "3": 0, "4": 0 });
    setQsHolder(null);
    setTenHolder(null);
    setRoundNum(prev => prev + 1);
  };

  const saveEditedRound = () => {
    if (!editingRound) return;
    const totalEditHearts = Object.values(editingRound.hearts).reduce((a, b) => a + b, 0);
    
    if (totalEditHearts !== 13 || !editingRound.qsHolder || !editingRound.tenHolder) {
      Alert.alert("Invalid Round", "Hearts must sum to 13 and special cards must be assigned.");
      return;
    }

    const newHistory = [...history];
    const roundDetails: Record<string, any> = {};

    players.forEach(p => {
      const h = editingRound.hearts[p.id] || 0;
      const qs = editingRound.qsHolder === p.id;
      const ten = editingRound.tenHolder === p.id;
      roundDetails[p.id] = {
        score: getRoundPoints(h, qs, ten),
        hearts: h,
        hasQS: qs,
        hasTen: ten
      };
    });

    newHistory[editingRound.index] = { ...newHistory[editingRound.index], playerDetails: roundDetails };

    const recalculatedPlayers = players.map(p => {
      const totalScore = newHistory.reduce((sum, round) => sum + (round.playerDetails[p.id]?.score || 0), 0);
      return { ...p, totalScore, isDanger: scoreLimit ? totalScore >= (scoreLimit * 0.85) : false };
    });

    setHistory(newHistory);
    setPlayers(recalculatedPlayers);
    setEditingRound(null);
  };

  // --- Persistence ---
  useEffect(() => {
    if (!isLoaded) return;
    GameStorage.save({
      id: instanceId, instanceId, gameType: 'leekha', status: 'active', mode, title: gameName, 
      roundLabel: `Round ${roundNum}`, lastPlayed: new Date().toISOString(),
      players, history, roundNum, scoreLimit, bestOf, isTeamScoreboard: false
    });
  }, [players, history, roundNum, isLoaded]);

  const renderLastRoundIcons = (p: Player) => {
    if (history.length === 0) return <View style={{ height: 16 }} />;
    const details = history[history.length - 1].playerDetails[p.id];
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

      <GameHeader title={gameName.toUpperCase()} subtitle={`BEST OF ${bestOf}`} onBack={() => router.dismissAll()} />
      
      <ScoreboardHistory 
        players={players} history={history} 
        isExpanded={isExpanded} toggleExpand={() => setIsExpanded(!isExpanded)} 
        renderScoreExtra={renderLastRoundIcons} onEditRound={(idx) => {
           const r = history[idx];
           const h: any = {}; let qs = null; let ten = null;
           Object.keys(r.playerDetails).forEach(pid => {
              h[pid] = r.playerDetails[pid].hearts;
              if (r.playerDetails[pid].hasQS) qs = pid;
              if (r.playerDetails[pid].hasTen) ten = pid;
           });
           setEditingRound({ index: idx, hearts: h, qsHolder: qs, tenHolder: ten });
        }}
      />

      {/* Main Status Bar */}
      <View style={styles.statusRowFixed}>
        <Text style={styles.sectionTitle}>Input Round {roundNum}</Text>
        <StatusBadges remainingHearts={remainingHearts} qsHolder={qsHolder} tenHolder={tenHolder} />
      </View>

      {/* Leekha Input Area */}
      <View style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: Spacing.l, paddingBottom: 100, paddingTop: Spacing.xl }}>
          {players.map(p => (
            <LeekhaPlayerCard 
              key={p.id} player={p}
              roundPoints={currentRoundPoints(p.id)}
              heartCount={hearts[p.id] || 0}
              hasQS={qsHolder === p.id} hasTen={tenHolder === p.id}
              isQSLocked={qsHolder !== null && qsHolder !== p.id}
              isTenLocked={tenHolder !== null && tenHolder !== p.id}
              remainingHearts={remainingHearts}
              onHeartChange={handleHeartChange} onToggleQS={toggleQS} onToggleTen={toggleTen}
            />
          ))}
        </ScrollView>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={[GlobalStyles.primaryButton, !isRoundValid && styles.disabledButton]} onPress={submitRound} disabled={!isRoundValid} activeOpacity={0.8}>
          <Text style={[GlobalStyles.primaryButtonText, !isRoundValid && { color: Colors.textMuted }]}>SUBMIT ROUND</Text>
        </TouchableOpacity>
      </View>

      {/* --- Edit Modal --- */}
      {editingRound && (
        <Modal animationType="slide" transparent={true} visible={true}>
           <View style={styles.modalOverlay}>
             <View style={styles.modalContent}>
               <Text style={styles.modalTitle}>Edit Round {editingRound.index + 1}</Text>
               
               {/* Modal Status Bar (Reused Component) */}
               <View style={styles.modalStatusRow}>
                  <StatusBadges 
                    remainingHearts={13 - Object.values(editingRound.hearts).reduce((a,b)=>a+b,0)}
                    qsHolder={editingRound.qsHolder}
                    tenHolder={editingRound.tenHolder}
                  />
               </View>

               <ScrollView style={{ maxHeight: 400 }}>
                 <View style={{ gap: 12 }}>
                   {players.map(p => {
                     const h = editingRound.hearts[p.id] || 0;
                     const hasQS = editingRound.qsHolder === p.id;
                     const hasTen = editingRound.tenHolder === p.id;
                     const isQSLocked = editingRound.qsHolder !== null && !hasQS;
                     const isTenLocked = editingRound.tenHolder !== null && !hasTen;
                     const heartsLeft = 13 - Object.values(editingRound.hearts).reduce((a,b)=>a+b,0);

                     return (
                        <View key={p.id} style={styles.compactCard}>
                           <View style={styles.compactInfo}>
                             <Text style={styles.playerName} numberOfLines={1}>{p.name}</Text>
                           </View>
                           <View style={styles.compactControls}>
                             <HeartControl 
                                value={h}
                                onDecrement={() => setEditingRound(prev => prev ? ({...prev, hearts: {...prev.hearts, [p.id]: Math.max(0, h-1)}}) : null)}
                                onIncrement={() => setEditingRound(prev => prev ? ({...prev, hearts: {...prev.hearts, [p.id]: h+1}}) : null)}
                                disableDec={h === 0}
                                disableInc={heartsLeft === 0}
                             />
                             <CardToggleButton type="QS" active={hasQS} locked={isQSLocked} onPress={() => setEditingRound(prev => prev ? ({...prev, qsHolder: hasQS ? null : p.id}) : null)} />
                             <CardToggleButton type="10D" active={hasTen} locked={isTenLocked} onPress={() => setEditingRound(prev => prev ? ({...prev, tenHolder: hasTen ? null : p.id}) : null)} style={{ marginLeft: 6 }} />
                           </View>
                        </View>
                     );
                   })}
                 </View>
               </ScrollView>
               <View style={styles.modalFooter}>
                 <TouchableOpacity onPress={() => setEditingRound(null)} style={styles.modalCancel}><Text style={{color: Colors.textMuted}}>Cancel</Text></TouchableOpacity>
                 <TouchableOpacity onPress={saveEditedRound} style={styles.modalSave}><Text style={{color: Colors.text, fontWeight: 'bold'}}>Save Changes</Text></TouchableOpacity>
               </View>
             </View>
           </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

// --- Reusable Sub-Components ---

const StatusBadges = ({ remainingHearts, qsHolder, tenHolder }: { remainingHearts: number, qsHolder: string | null, tenHolder: string | null }) => (
  <View style={GlobalStyles.row}>
    <View style={[styles.badge, remainingHearts === 0 ? styles.badgeNeutral : styles.badgeError]}>
      <Heart size={14} color={remainingHearts === 0 ? Colors.textMuted : Colors.danger} fill={remainingHearts === 0 ? "none" : Colors.danger} />
      <Text style={[styles.badgeText, remainingHearts !== 0 && { color: Colors.danger }]}>{remainingHearts}</Text>
    </View>
    <View style={[styles.badge, qsHolder ? styles.badgeNeutral : styles.badgeQS, { marginLeft: 8 }]}>
      <Text style={[styles.badgeText, !qsHolder ? { color: Colors.text } : { color: Colors.textMuted }]}>Q♠</Text>
    </View>
    <View style={[styles.badge, tenHolder ? styles.badgeNeutral : styles.badgeTen, { marginLeft: 8 }]}>
      <Text style={[styles.badgeText, !tenHolder ? { color: Colors.danger } : { color: Colors.textMuted }]}>10♦</Text>
    </View>
  </View>
);

const HeartControl = ({ value, onDecrement, onIncrement, disableDec, disableInc }: any) => (
  <View style={styles.compactCounter}>
    <TouchableOpacity onPress={onDecrement} disabled={disableDec} style={styles.compactBtn} activeOpacity={0.8}>
      <Text style={styles.compactBtnText}>-</Text>
    </TouchableOpacity>
    <View style={styles.compactHeartVal}>
      <Heart size={14} color={Colors.danger} fill={Colors.danger} />
      <Text style={styles.compactValText}>{value}</Text>
    </View>
    <TouchableOpacity onPress={onIncrement} disabled={disableInc} style={styles.compactBtn} activeOpacity={0.8}>
      <Text style={styles.compactBtnText}>+</Text>
    </TouchableOpacity>
  </View>
);

const CardToggleButton = ({ type, active, locked, onPress, style }: any) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.8} disabled={locked}
    style={[styles.compactSpecialBtn, active ? (type === 'QS' ? styles.qsActive : styles.tenActive) : styles.specialCardInactive, locked && { opacity: 0.3 }, style]}
  >
    <Text style={[styles.compactSpecialText, active ? (type === 'QS' ? {color: Colors.text} : {color: Colors.danger}) : {color: Colors.textMuted}]}>
      {type === 'QS' ? 'Q♠' : '10♦'}
    </Text>
  </TouchableOpacity>
);

const LeekhaPlayerCard = ({ player, roundPoints, heartCount, hasQS, hasTen, isQSLocked, isTenLocked, remainingHearts, onHeartChange, onToggleQS, onToggleTen }: any) => (
  <View style={styles.compactCard}>
    <View style={styles.compactInfo}>
      <Text style={styles.playerName} numberOfLines={1}>{player.name}</Text>
      <Text style={styles.roundPoints}>{roundPoints > 0 ? `+${roundPoints}` : roundPoints}</Text>
    </View>
    <View style={styles.compactControls}>
      <HeartControl value={heartCount} onDecrement={() => onHeartChange(player.id, -1)} onIncrement={() => onHeartChange(player.id, 1)} disableDec={heartCount === 0} disableInc={remainingHearts === 0} />
      <CardToggleButton type="QS" active={hasQS} locked={isQSLocked} onPress={() => onToggleQS(player.id)} />
      <CardToggleButton type="10D" active={hasTen} locked={isTenLocked} onPress={() => onToggleTen(player.id)} style={{ marginLeft: 6 }} />
    </View>
  </View>
);

// --- Styles ---
const styles = StyleSheet.create({
  statusRowFixed: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.l, paddingVertical: Spacing.m, backgroundColor: Colors.background, borderBottomWidth: 1, borderBottomColor: Colors.border, zIndex: 5 },
  sectionTitle: { color: Colors.text, fontSize: 16, fontWeight: 'bold' },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, gap: 4 },
  badgeNeutral: { backgroundColor: Colors.surfaceInner, borderColor: Colors.border },
  badgeError: { backgroundColor: 'rgba(255, 82, 82, 0.1)', borderColor: 'rgba(255, 82, 82, 0.3)' },
  badgeQS: { backgroundColor: 'rgba(255, 255, 255, 0.1)', borderColor: 'rgba(255, 255, 255, 0.3)' },
  badgeTen: { backgroundColor: 'rgba(255, 82, 82, 0.1)', borderColor: 'rgba(255, 82, 82, 0.3)' },
  badgeText: { fontSize: 14, fontWeight: 'bold', color: Colors.textMuted },
  compactCard: { backgroundColor: Colors.surface, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 80 },
  compactInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  playerName: { color: Colors.text, fontSize: 18, fontWeight: '600', maxWidth: 120 },
  roundPoints: { color: Colors.textMuted, fontSize: 16, fontWeight: '600' },
  compactControls: { flexDirection: 'row', alignItems: 'center' },
  compactCounter: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceInner, borderRadius: 8, padding: 4, marginRight: 10 },
  compactBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surfaceLight, borderRadius: 8 },
  compactBtnText: { color: Colors.text, fontSize: 24, fontWeight: 'bold', marginTop: -2 },
  compactHeartVal: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: 45, gap: 4 },
  compactValText: { color: Colors.text, fontSize: 18, fontWeight: 'bold' },
  compactSpecialBtn: { width: 48, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  specialCardInactive: { backgroundColor: Colors.surfaceInner, borderColor: Colors.border },
  compactSpecialText: { fontSize: 14, fontWeight: 'bold', color: Colors.textMuted },
  qsActive: { backgroundColor: 'rgba(255, 255, 255, 0.1)', borderColor: Colors.text },
  tenActive: { backgroundColor: 'rgba(255, 82, 82, 0.15)', borderColor: Colors.danger },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing.l, backgroundColor: Colors.background, borderTopWidth: 1, borderTopColor: Colors.border },
  disabledButton: { backgroundColor: Colors.surfaceLight, shadowOpacity: 0, elevation: 0 },
  lastRoundIcons: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 4, height: 16 },
  iconQS: { color: Colors.text, fontSize: 10, fontWeight: 'bold' },
  iconTen: { color: Colors.danger, fontSize: 10, fontWeight: 'bold' },
  iconHeartContainer: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  iconHeartText: { color: Colors.danger, fontSize: 10, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: 10 },
  modalContent: { backgroundColor: Colors.surface, borderRadius: 16, padding: 20, paddingBottom: 30 },
  modalTitle: { color: Colors.text, fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  modalStatusRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 20 },
  editRow: { marginBottom: 16 }, 
  editName: { color: Colors.text, width: 80, fontSize: 14, fontWeight: '600' },
  modalFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: Colors.border },
  modalCancel: { padding: 12 },
  modalSave: { backgroundColor: Colors.primary, padding: 12, borderRadius: 8 },
});