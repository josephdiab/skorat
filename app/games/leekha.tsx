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
import { Player } from "../../constants/types";
import { useGameCore } from "../../hooks/useGameCore"; // <--- HOOK
import { Logger } from "../../services/logger"; // <--- LOGGER

export default function LeekhaScreen() {
  useKeepAwake();
  const router = useRouter();

  // 1. USE THE GENERIC HOOK (Handles Loading, Saving, and Lifecycle Logging)
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

  // Initialize Round Inputs when history changes (New Round)
  useEffect(() => {
    if (!isLoaded || !gameState) return;
    // Only reset if we are starting a fresh round input (not editing)
    if (gameState.players.length > 0) {
      const initial: Record<string, number> = {};
      gameState.players.forEach(p => initial[p.id] = 0);
      setHearts(initial);
      setQsHolder(null);
      setTenHolder(null);
    }
  }, [gameState?.history.length, isLoaded]);

  if (!isLoaded || !gameState) return <SafeAreaView style={GlobalStyles.container} />;

  // Destructure Standard Properties from Hook
  const { players, history, scoreLimit, mode, title, status } = gameState;
  const roundNum = history.length + 1; // Derived from history

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

  // --- HELPER: CHECK WINNER/LOSER LOGIC ---
  const checkGameEnd = (currentPlayers: Player[]) => {
    const maxScore = Math.max(...currentPlayers.map(p => p.totalScore));
    let isGameOver = false;

    // Only verify loser if the limit is reached
    if (maxScore >= (scoreLimit || 101)) {
      const losers = currentPlayers.filter(p => p.totalScore === maxScore);

      if (mode === 'teams' && currentPlayers.length === 4) {
        // Check if both teams are losing (Tie at the top)
        const teamALosing = losers.some(p => currentPlayers.indexOf(p) < 2);
        const teamBLosing = losers.some(p => currentPlayers.indexOf(p) >= 2);

        if (teamALosing && teamBLosing) {
          isGameOver = false; // TIE
        } else {
          isGameOver = true;
        }
      } else {
        // Solo Mode: Tie if multiple players share the max score
        isGameOver = losers.length === 1;
      }
    }

    if (isGameOver) {
      // Mark Winners
      if (mode === 'teams' && currentPlayers.length === 4) {
        const losers = currentPlayers.filter(p => p.totalScore === maxScore);
        const teamALost = losers.some(p => currentPlayers.indexOf(p) < 2);
        
        return currentPlayers.map((p, index) => {
          const isTeamA = index < 2;
          return { ...p, isWinner: teamALost ? !isTeamA : isTeamA };
        });
      } else {
        // Solo: Winner is the one with the lowest score
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

    // 1. Prepare Data
    const currentRoundDetails: Record<string, any> = {};
    players.forEach(p => {
      currentRoundDetails[p.id] = {
        score: currentRoundPoints(p.id),
        hearts: hearts[p.id] || 0,
        hasQS: qsHolder === p.id,
        hasTen: tenHolder === p.id
      };
    });

    const newHistory = [...history, { roundNum, playerDetails: currentRoundDetails }];

    // 2. Update Scores
    let updatedPlayers = players.map(p => {
      const newTotal = p.totalScore + currentRoundPoints(p.id);
      return { 
        ...p, 
        totalScore: newTotal,
        isDanger: newTotal >= ((scoreLimit || 101) * 0.85) 
      };
    });
    
    // 3. Determine Win/Loss
    updatedPlayers = checkGameEnd(updatedPlayers);
    const hasWinner = updatedPlayers.some(p => p.isWinner);

    // 4. LOG ACTION
    Logger.info('GAME_ACTION', `Round ${roundNum} Committed`, {
      qsHolder, tenHolder
    });

    // 5. UPDATE STATE (Hook handles saving)
    updateState({
        players: updatedPlayers,
        history: newHistory,
        status: hasWinner ? 'completed' : 'active',
    });
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
    
    if (totalEditHearts !== 13 || !editingRound.qsHolder || !editingRound.tenHolder) {
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

    // 1. Recalculate Totals
    let recalculatedPlayers = players.map(p => {
      const totalScore = newHistory.reduce((sum, round) => sum + (round.playerDetails[p.id]?.score || 0), 0);
      return { 
        ...p, 
        totalScore, 
        isDanger: totalScore >= ((scoreLimit || 101) * 0.85)
      };
    });

    // 2. Determine Win/Loss
    recalculatedPlayers = checkGameEnd(recalculatedPlayers);
    const hasWinner = recalculatedPlayers.some(p => p.isWinner);

    // 3. LOG ACTION
    Logger.info('GAME_ACTION', `Round ${editingRound.index + 1} Edited`);

    // 4. UPDATE STATE
    updateState({
        players: recalculatedPlayers,
        history: newHistory,
        status: hasWinner ? 'completed' : 'active'
    });

    setEditingRound(null);
  };

  const renderLastRoundIcons = (p: Player) => {
    if (history.length === 0) return <View style={{ height: 16 }} />;
    const details = history[history.length - 1].playerDetails[p.id];
    if (!details) return <View style={{ height: 16 }} />;
    const hasIcons = details.hasQS || details.hasTen || details.hearts > 0;
    if (!hasIcons) return <View style={{ height: 16 }} />;

    return (
      <View style={GameStyles.lastRoundIcons}>
          {details.hasQS && <Text style={GameStyles.iconQS}>Q♠</Text>}
          {details.hasTen && <Text style={GameStyles.iconTen}>10♦</Text>}
          {details.hearts > 0 && (
            <View style={GameStyles.iconHeartContainer}>
              <Heart size={10} color={Colors.danger} fill={Colors.danger} />
              <Text style={GameStyles.iconHeartText}>{details.hearts}</Text>
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
        subtitle={status === 'completed' ? "COMPLETED" : `Score Limit: ${scoreLimit}`} 
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
           Object.keys(r.playerDetails).forEach(pid => {
              h[pid] = r.playerDetails[pid].hearts;
              if (r.playerDetails[pid].hasQS) qs = pid;
              if (r.playerDetails[pid].hasTen) ten = pid;
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