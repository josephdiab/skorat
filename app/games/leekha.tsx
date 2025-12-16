import { useKeepAwake } from "expo-keep-awake";
import { Stack, useRouter } from "expo-router";
import { Heart } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Local Imports
import { GameHeader } from "../../components/game_header";
import { GameOverScreen } from "../../components/rematch_button";
import { ScoreboardHistory } from "../../components/scoreboard_history";
import { GameStyles } from "../../constants/game_styles";
import { Colors, GlobalStyles } from "../../constants/theme";
import { GameRoundDetails, Player } from "../../constants/types"; // Import Types
import { useGameCore } from "../../hooks/useGameCore";
import { Logger } from "../../services/logger";
import { RoundValidator } from "../../services/round_validator";
import { StatsEngine } from "../../services/stats_engine";


export default function LeekhaScreen() {
  useKeepAwake();
  const router = useRouter();

  // 1. USE THE GENERIC HOOK
  const { gameState, isLoaded, updateState } = useGameCore('leekha', 'LEEKHA', 101, false);

  // --- Local UI State ---
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Round Input State
  const [hearts, setHearts] = useState<Record<string, number>>({});
  const [qsHolder, setQsHolder] = useState<string | null>(null);
  const [tenHolder, setTenHolder] = useState<string | null>(null);

  const [editingRound, setEditingRound] = useState<{
    index: number;
    hearts: Record<string, number>;
    qsHolder: string | null;
    tenHolder: string | null;
  } | null>(null);

  // Initialize Round Inputs
  useEffect(() => {
    if (!isLoaded || !gameState) return;
    if (gameState.players.length > 0) {
      const initial: Record<string, number> = {};
      gameState.players.forEach(p => initial[p.id] = 0);
      setHearts(initial);
      setQsHolder(null);
      setTenHolder(null);
    }
  }, [gameState?.history.length, isLoaded]);

  if (!isLoaded || !gameState) return <SafeAreaView style={GlobalStyles.container} />;

  const { players, history, scoreLimit, mode, title, status } = gameState;
  const roundNum = history.length + 1;

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

  // --- Check Winner Logic ---
  const checkGameEnd = (currentPlayers: Player[]) => {
    const maxScore = Math.max(...currentPlayers.map(p => p.totalScore));
    let isGameOver = false;

    if (maxScore >= (scoreLimit || 101)) {
      const losers = currentPlayers.filter(p => p.totalScore === maxScore);

      if (mode === 'teams' && currentPlayers.length === 4) {
        const teamALosing = losers.some(p => currentPlayers.indexOf(p) < 2);
        const teamBLosing = losers.some(p => currentPlayers.indexOf(p) >= 2);

        if (teamALosing && teamBLosing) {
          isGameOver = false; 
        } else {
          isGameOver = true;
        }
      } else {
        isGameOver = losers.length === 1; 
      }
    }

    if (isGameOver) {
      if (mode === 'teams' && currentPlayers.length === 4) {
        const losers = currentPlayers.filter(p => p.totalScore === maxScore);
        const teamALost = losers.some(p => currentPlayers.indexOf(p) < 2);
        
        return currentPlayers.map((p, index) => {
          const isTeamA = index < 2;
          return { ...p, isWinner: teamALost ? !isTeamA : isTeamA };
        });
      } else {
        const minScore = Math.min(...currentPlayers.map(p => p.totalScore));
        return currentPlayers.map(p => ({
          ...p,
          isWinner: p.totalScore === minScore
        }));
      }
    }

    return currentPlayers.map(p => ({ ...p, isWinner: false }));
  };

  const commitRound = () => {
  if (!isRoundValid) return;

  // 1. Prepare Data (Strictly Typed Record)
  const currentRoundDetails: Record<string, GameRoundDetails> = {};

  players.forEach(p => {
    currentRoundDetails[p.profileId] = {
      kind: "leekha",
      score: currentRoundPoints(p.id),
      heartsTaken: hearts[p.id] || 0,
      hasQS: qsHolder === p.id,
      hasTen: tenHolder === p.id,
    };
  });

  const newRound = {
    roundNum: history.length + 1,
    timestamp: new Date().toISOString(),
    playerDetails: currentRoundDetails,
  };

  const newHistory = [...history, newRound];

  // 2. Update Scores
  let updatedPlayers = players.map(p => {
    const newTotal = p.totalScore + currentRoundPoints(p.id);
    return {
      ...p,
      totalScore: newTotal,
      isDanger: newTotal >= ((scoreLimit || 101) * 0.85),
    };
  });

  // 3. Determine Win/Loss
  updatedPlayers = checkGameEnd(updatedPlayers);
  const hasWinner = updatedPlayers.some(p => p.isWinner);

  // 4. Log
  Logger.info("GAME_ACTION", `Round ${newHistory.length} Committed`, {
    qsHolder,
    tenHolder,
  });

  // 5. Update State
  updateState({
    players: updatedPlayers,
    history: newHistory,
    status: hasWinner ? "completed" : "active",
  });

  // ---------------- DEV TESTS ----------------
  if (__DEV__) {
    const p0 = players[0];
    if (!p0) return;

    // A) Validate the just-created round structure (runtime safety)
    const mockGame = { ...gameState, history: newHistory };
    const errors = RoundValidator.validateLastRound(mockGame);
    if (errors.length) {
      Logger.error("DATA_INTEGRITY", "❌ Leekha round invalid", errors);
    } else {
      Logger.info("DATA_INTEGRITY", "✅ Leekha round schema valid");
    }

    // B) Round-by-round log for players[0]
    // Logs every round's delta + running total using the stored history details
    const rounds = StatsEngine.getPlayerRounds([mockGame], p0.profileId)
      .filter(r => r.kind === "leekha")
      // getPlayerRounds sorts newest-first; we want oldest-first for replay display
      .sort((a, b) => (a.roundNum > b.roundNum ? 1 : -1));

    let runningTotal = 0;

    Logger.info("SANITY_STATS", `📌 Leekha Round-by-Round for ${p0.name} (${p0.profileId})`, {
      rounds: rounds.length,
      gameId: gameState.id,
      instanceId: gameState.instanceId,
    });

    for (const r of rounds) {
      // In Leekha, r.score is the round delta for that player
      runningTotal += r.score;

      Logger.info("SANITY_STATS", `R${r.roundNum}: +${r.score} (total=${runningTotal})`, {
        heartsTaken: r.heartsTaken,
        hasQS: r.hasQS,
        hasTen: r.hasTen,
        date: r.date,
      });
    }
  }
  // ------------------------------------------
};

  const handleRematch = () => {
    const profileParams = players.map(p => ({ id: p.profileId, name: p.name }));
    Logger.info('GAME_ACTION', 'Rematch Requested');
    router.push({
      pathname: "/games/leekha",
      params: {
        playerProfiles: JSON.stringify(profileParams),
        gameName: title,
        scoreLimit: scoreLimit?.toString(),
        mode: mode
      }
    });
  };

  const saveEditedRound = () => {
    if (!editingRound) return;
    const totalEditHearts = Object.values(editingRound.hearts).reduce((a, b) => a + b, 0);
    
    if (totalEditHearts !== 13 || !editingRound.qsHolder || !editingRound.tenHolder) return;

    const newHistory = [...history];
    const roundDetails: Record<string, GameRoundDetails> = {};

    players.forEach(p => {
      const h = editingRound.hearts[p.id] || 0;
      const qs = editingRound.qsHolder === p.id;
      const ten = editingRound.tenHolder === p.id;
      
      // Store edit using Profile ID
      roundDetails[p.profileId] = {
        kind: 'leekha',
        score: getRoundPoints(h, qs, ten),
        heartsTaken: h,
        hasQS: qs,
        hasTen: ten
      };
    });

    newHistory[editingRound.index] = { 
        ...newHistory[editingRound.index], 
        playerDetails: roundDetails 
    };

    // Replay History to ensure accurate totals
    let recalculatedPlayers = players.map(p => ({...p, totalScore: 0}));
    
    // Calculate totals by re-summing history
    const finalHistory = newHistory.map(round => {
        recalculatedPlayers = recalculatedPlayers.map(p => {
            const rData = round.playerDetails[p.profileId];
            if (rData && rData.kind === 'leekha') {
                return { ...p, totalScore: p.totalScore + rData.score };
            }
            return p;
        });
        return round;
    });

    // Re-check win/loss conditions
    recalculatedPlayers = recalculatedPlayers.map(p => ({
        ...p,
        isDanger: p.totalScore >= ((scoreLimit || 101) * 0.85)
    }));
    recalculatedPlayers = checkGameEnd(recalculatedPlayers);
    
    const hasWinner = recalculatedPlayers.some(p => p.isWinner);

    Logger.info('GAME_ACTION', `Round ${editingRound.index + 1} Edited`);

    updateState({
        players: recalculatedPlayers,
        history: finalHistory,
        status: hasWinner ? 'completed' : 'active'
    });

    setEditingRound(null);
  };

  const renderLastRoundIcons = (p: Player) => {
    if (history.length === 0) return <View style={{ height: 16 }} />;
    // Look up via Profile ID for display
    const details = history[history.length - 1].playerDetails[p.profileId];
    
    // Type Guard
    if (!details || details.kind !== 'leekha') return <View style={{ height: 16 }} />;
    
    const hasIcons = details.hasQS || details.hasTen || details.heartsTaken > 0;
    if (!hasIcons) return <View style={{ height: 16 }} />;

    return (
      <View style={GameStyles.lastRoundIcons}>
          {details.hasQS && <Text style={GameStyles.iconQS}>Q♠</Text>}
          {details.hasTen && <Text style={GameStyles.iconTen}>10♦</Text>}
          {details.heartsTaken > 0 && (
            <View style={GameStyles.iconHeartContainer}>
              <Heart size={10} color={Colors.danger} fill={Colors.danger} />
              <Text style={GameStyles.iconHeartText}>{details.heartsTaken}</Text>
            </View>
          )}
      </View>
    );
  };

  const orderedPlayersForUI = players.length === 4 
    ? [players[0], players[2], players[1], players[3]]
    : players;

  const winners = players.filter(p => p.isWinner);
  const winnersNames = winners.length > 0 ? winners.map(p => p.name).join(' & ') : "No Winner";

  return (
    <SafeAreaView style={GlobalStyles.container} edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ headerShown: false }} />

      <GameHeader 
        title={title.toUpperCase()} 
        subtitle={status === 'completed' ? "COMPLETED" : `Limit: ${scoreLimit}`} 
        onBack={() => router.dismissAll()} 
      />
      
      <ScoreboardHistory 
        players={players} history={history} 
        isExpanded={isExpanded} toggleExpand={() => setIsExpanded(!isExpanded)} 
        renderScoreExtra={renderLastRoundIcons} 
        isTeamScoreboard={false} 
        onEditRound={(idx) => {
           const r = history[idx];
           const h: any = {}; let qs = null; let ten = null;
           
           // Reading needs to happen via Profile ID
           players.forEach(p => {
              const details = r.playerDetails[p.profileId];
              if (details && details.kind === 'leekha') {
                  h[p.id] = details.heartsTaken;
                  if (details.hasQS) qs = p.id;
                  if (details.hasTen) ten = p.id;
              }
           });
           
           setEditingRound({ index: idx, hearts: h, qsHolder: qs, tenHolder: ten });
        }}
      />

      {status !== 'completed' ? (
        <>
          <View style={GameStyles.statusRowFixed}>
            <Text style={GameStyles.sectionTitle}>Round {roundNum}</Text>
            <StatusBadges remainingHearts={remainingHearts} qsHolder={qsHolder} tenHolder={tenHolder} />
          </View>

          <View style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={GameStyles.scrollContent}>
              {orderedPlayersForUI.map(p => (
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

          <View style={GameStyles.footer}>
            <TouchableOpacity 
              style={[GlobalStyles.primaryButton, !isRoundValid && GameStyles.disabledButton]} 
              onPress={commitRound} 
              disabled={!isRoundValid} 
              activeOpacity={0.8}
            >
              <Text style={[GlobalStyles.primaryButtonText, !isRoundValid && { color: Colors.textMuted }]}>SUBMIT ROUND</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <GameOverScreen winners={winnersNames} onRematch={handleRematch} />
      )}

      {/* --- Edit Modal --- */}
      {editingRound && (
        <Modal animationType="slide" transparent={true} visible={true}>
            <View style={GameStyles.modalOverlay}>
              <View style={GameStyles.modalContent}>
                <Text style={GameStyles.modalTitle}>Edit Round {editingRound.index + 1}</Text>
                <View style={GameStyles.modalStatusRow}>
                  <StatusBadges 
                    remainingHearts={13 - Object.values(editingRound.hearts).reduce((a,b)=>a+b,0)}
                    qsHolder={editingRound.qsHolder}
                    tenHolder={editingRound.tenHolder}
                  />
                </View>
                <ScrollView style={{ maxHeight: 400 }}>
                  <View style={{ gap: 12 }}>
                    {orderedPlayersForUI.map(p => {
                      const h = editingRound.hearts[p.id] || 0;
                      const hasQS = editingRound.qsHolder === p.id;
                      const hasTen = editingRound.tenHolder === p.id;
                      const isQSLocked = editingRound.qsHolder !== null && !hasQS;
                      const isTenLocked = editingRound.tenHolder !== null && !hasTen;
                      const heartsLeft = 13 - Object.values(editingRound.hearts).reduce((a,b)=>a+b,0);
                      return (
                         <View key={p.id} style={GameStyles.compactCard}>
                            <View style={GameStyles.compactInfo}>
                              <Text style={GameStyles.playerName} numberOfLines={1}>{p.name}</Text>
                            </View>
                            <View style={GameStyles.compactControls}>
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
                <View style={GameStyles.modalFooter}>
                  <TouchableOpacity onPress={() => setEditingRound(null)} style={GameStyles.modalCancel}><Text style={{color: Colors.textMuted}}>Cancel</Text></TouchableOpacity>
                  <TouchableOpacity onPress={saveEditedRound} style={GameStyles.modalSave}><Text style={{color: Colors.text, fontWeight: 'bold'}}>Save Changes</Text></TouchableOpacity>
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
    <View style={[GameStyles.badge, remainingHearts === 0 ? GameStyles.badgeNeutral : GameStyles.badgeError]}>
      <Heart size={14} color={remainingHearts === 0 ? Colors.textMuted : Colors.danger} fill={remainingHearts === 0 ? "none" : Colors.danger} />
      <Text style={[GameStyles.badgeText, remainingHearts !== 0 && { color: Colors.danger }]}>{remainingHearts}</Text>
    </View>
    <View style={[GameStyles.badge, qsHolder ? GameStyles.badgeNeutral : GameStyles.badgeQS, { marginLeft: 8 }]}>
      <Text style={[GameStyles.badgeText, !qsHolder ? { color: Colors.text } : { color: Colors.textMuted }]}>Q♠</Text>
    </View>
    <View style={[GameStyles.badge, tenHolder ? GameStyles.badgeNeutral : GameStyles.badgeTen, { marginLeft: 8 }]}>
      <Text style={[GameStyles.badgeText, !tenHolder ? { color: Colors.danger } : { color: Colors.textMuted }]}>10♦</Text>
    </View>
  </View>
);

const HeartControl = ({ value, onDecrement, onIncrement, disableDec, disableInc }: any) => (
  <View style={GameStyles.compactCounter}>
    <TouchableOpacity onPress={onDecrement} disabled={disableDec} style={GameStyles.compactBtn} activeOpacity={0.8}>
      <Text style={GameStyles.compactBtnText}>-</Text>
    </TouchableOpacity>
    <View style={GameStyles.compactHeartVal}>
      <Heart size={14} color={Colors.danger} fill={Colors.danger} />
      <Text style={GameStyles.compactValText}>{value}</Text>
    </View>
    <TouchableOpacity onPress={onIncrement} disabled={disableInc} style={GameStyles.compactBtn} activeOpacity={0.8}>
      <Text style={GameStyles.compactBtnText}>+</Text>
    </TouchableOpacity>
  </View>
);

const CardToggleButton = ({ type, active, locked, onPress, style }: any) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.8} disabled={locked}
    style={[GameStyles.compactSpecialBtn, active ? (type === 'QS' ? GameStyles.qsActive : GameStyles.tenActive) : GameStyles.specialCardInactive, locked && { opacity: 0.3 }, style]}
  >
    <Text style={[GameStyles.compactSpecialText, active ? (type === 'QS' ? {color: Colors.text} : {color: Colors.danger}) : {color: Colors.textMuted}]}>
      {type === 'QS' ? 'Q♠' : '10♦'}
    </Text>
  </TouchableOpacity>
);

const LeekhaPlayerCard = ({ player, roundPoints, heartCount, hasQS, hasTen, isQSLocked, isTenLocked, remainingHearts, onHeartChange, onToggleQS, onToggleTen }: any) => (
  <View style={GameStyles.compactCard}>
    <View style={GameStyles.compactInfo}>
      <Text style={GameStyles.playerName} numberOfLines={1}>{player.name}</Text>
      <Text style={GameStyles.roundPoints}>{roundPoints > 0 ? `+${roundPoints}` : roundPoints}</Text>
    </View>
    <View style={GameStyles.compactControls}>
      <HeartControl value={heartCount} onDecrement={() => onHeartChange(player.id, -1)} onIncrement={() => onHeartChange(player.id, 1)} disableDec={heartCount === 0} disableInc={remainingHearts === 0} />
      <CardToggleButton type="QS" active={hasQS} locked={isQSLocked} onPress={() => onToggleQS(player.id)} />
      <CardToggleButton type="10D" active={hasTen} locked={isTenLocked} onPress={() => onToggleTen(player.id)} style={{ marginLeft: 6 }} />
    </View>
  </View>
);