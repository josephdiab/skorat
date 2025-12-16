import { useKeepAwake } from 'expo-keep-awake';
import { Stack, useRouter } from "expo-router";
import { ThumbsDown, ThumbsUp } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Local Imports
import { GameHeader } from "../../components/game_header";
import { GameOverScreen } from "../../components/rematch_button";
import { ScoreboardHistory } from "../../components/scoreboard_history";
import { GameStyles } from "../../constants/game_styles";
import { Colors, GlobalStyles } from "../../constants/theme";
import { Player } from "../../constants/types";
import { useGameCore } from "../../hooks/useGameCore"; // <--- NEW HOOK
import { Logger } from "../../services/logger"; // <--- NEW LOGGER

// --- 400 Game Logic Helpers ---
const calculatePoints = (bid: number, currentScore: number) => {
  if (bid >= 10) return 40;
  if (bid === 9) return 27;
  if (bid === 8) return 16;
  if (bid === 7) return 14;
  if (bid === 6) return currentScore >= 30 ? 6 : 12;
  if (bid === 5) return currentScore >= 30 ? 5 : 10;
  return bid;
};

const getMinBidForPlayer = (score: number) => {
  if (score >= 50) return 5;
  if (score >= 40) return 4;
  if (score >= 30) return 3;
  return 2;
};

export default function FourHundredScreen() {
  useKeepAwake();
  const router = useRouter();

  // 1. USE THE GENERIC HOOK
  // 400 uses individual scoreboards (isTeamScoreboard = false) even if played in teams
  const { gameState, isLoaded, updateState } = useGameCore('400', '400', 41, false);

  // --- Local UI State ---
  const [phase, setPhase] = useState<'bidding' | 'scoring' | 'gameover'>('bidding');
  const [bids, setBids] = useState<Record<string, number>>({});
  const [results, setResults] = useState<Record<string, boolean>>({}); 
  const [isExpanded, setIsExpanded] = useState(false);

  const [editingRound, setEditingRound] = useState<{
    index: number;
    bids: Record<string, number>;
    results: Record<string, boolean>;
  } | null>(null);
  
  // Sync phase with loaded game status
  useEffect(() => {
    if (gameState?.status === 'completed') setPhase('gameover');
  }, [gameState?.status]);

  // Initialize bids when round changes or game loads
  useEffect(() => {
    if (!isLoaded || !gameState) return;
    // Only reset if we are not editing
    if (gameState.players.length > 0) {
        const initialBids: Record<string, number> = {};
        const initialResults: Record<string, boolean> = {};
        gameState.players.forEach(p => {
          initialBids[p.id] = getMinBidForPlayer(p.totalScore);
          initialResults[p.id] = true;
        });
        setBids(initialBids);
        setResults(initialResults);
    }
  }, [gameState?.history.length, isLoaded]);

  if (!isLoaded || !gameState) return <SafeAreaView style={GlobalStyles.container} />;

  // Destructure for easier access
  const { players, history, scoreLimit, title, status, mode } = gameState;

  // --- LOGIC ---
  const currentTotalBids = Object.values(bids).reduce((a, b) => a + b, 0);
  const getTableMinTotal = () => {
    if (players.length === 0) return 11;
    const maxScore = Math.max(...players.map(p => p.totalScore));
    if (maxScore >= 50) return 14;
    if (maxScore >= 40) return 13;
    if (maxScore >= 30) return 12;
    return 11;
  };
  const requiredTotal = getTableMinTotal();
  const isBiddingValid = currentTotalBids >= requiredTotal;

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
    let updatedPlayers = players.map(p => {
      const bid = bids[p.id];
      const passed = results[p.id];
      const points = calculatePoints(bid, p.totalScore);
      const change = passed ? points : -points;
      roundDetails[p.id] = { score: change, bid, passed };
      const newTotal = p.totalScore + change;
      return { ...p, totalScore: newTotal, isDanger: newTotal < 0 };
    });

    const newHistory = [...history, { roundNum: history.length + 1, playerDetails: roundDetails }];

    // Win Condition Logic
    const p0 = updatedPlayers[0];
    const p1 = updatedPlayers[1];
    const p2 = updatedPlayers[2];
    const p3 = updatedPlayers[3];

    // Assuming standard 4-player team logic for 400
    const limit = scoreLimit || 41;
    const teamA_Qualified = (p0.totalScore >= limit && p1.totalScore > 0) || (p1.totalScore >= limit && p0.totalScore > 0);
    const teamB_Qualified = (p2.totalScore >= limit && p3.totalScore > 0) || (p3.totalScore >= limit && p2.totalScore > 0);

    let winningTeam: 'A' | 'B' | null = null;
    if (teamA_Qualified && !teamB_Qualified) winningTeam = 'A';
    else if (!teamA_Qualified && teamB_Qualified) winningTeam = 'B';
    else if (teamA_Qualified && teamB_Qualified) {
        const maxA = Math.max(p0.totalScore, p1.totalScore);
        const maxB = Math.max(p2.totalScore, p3.totalScore);
        if (maxA > maxB) winningTeam = 'A';
        else if (maxB > maxA) winningTeam = 'B';
    }

    // UPDATE VIA HOOK
    if (winningTeam) {
        updatedPlayers = updatedPlayers.map((player, idx) => {
            const isTeamA = (idx === 0 || idx === 1);
            return { ...player, isWinner: winningTeam === 'A' ? isTeamA : !isTeamA };
        });
        Logger.info('GAME_ACTION', '400 Match Won', { winningTeam });
        updateState({ players: updatedPlayers, history: newHistory, status: 'completed' });
    } else {
        Logger.info('GAME_ACTION', `Round ${newHistory.length} Committed`, { bids, results });
        updateState({ players: updatedPlayers, history: newHistory, roundLabel: `Round ${newHistory.length + 1}` });
        setPhase('bidding');
    }
  };

  const handleRematch = () => {
    const profileParams = players.map(p => ({ id: p.profileId, name: p.name }));
    router.push({
      pathname: "/games/400",
      params: {
        playerProfiles: JSON.stringify(profileParams),
        gameName: title,
        scoreLimit: scoreLimit?.toString(),
        mode: mode
      }
    });
  };

  const startEditingRound = (index: number) => {
    const round = history[index];
    const editBids: Record<string, number> = {};
    const editResults: Record<string, boolean> = {};
    Object.keys(round.playerDetails).forEach(pid => {
      editBids[pid] = round.playerDetails[pid].bid;
      editResults[pid] = round.playerDetails[pid].passed;
    });
    setEditingRound({ index, bids: editBids, results: editResults });
  };

  const saveEditedRound = () => {
    if (!editingRound) return;
    const newHistory = [...history];
    const roundDetails: Record<string, any> = {};
    players.forEach(p => {
        const bid = editingRound.bids[p.id];
        const passed = editingRound.results[p.id];
        roundDetails[p.id] = { bid, passed };
    });
    newHistory[editingRound.index] = { ...newHistory[editingRound.index], playerDetails: roundDetails };

    let tempPlayers = players.map(p => ({...p, totalScore: 0}));
    const finalHistory = newHistory.map(round => {
        const calculatedDetails: Record<string, any> = {};
        tempPlayers = tempPlayers.map(p => {
            const rData = round.playerDetails[p.id];
            const points = calculatePoints(rData.bid, p.totalScore);
            const change = rData.passed ? points : -points;
            calculatedDetails[p.id] = { score: change, bid: rData.bid, passed: rData.passed };
            return { ...p, totalScore: p.totalScore + change };
        });
        return { ...round, playerDetails: calculatedDetails };
    });

    const finalPlayers = tempPlayers.map(p => ({ ...p, isDanger: p.totalScore < 0 }));
    Logger.info('GAME_ACTION', `Round ${editingRound.index + 1} Edited`);
    
    updateState({ players: finalPlayers, history: finalHistory });
    setEditingRound(null);
  };

  const orderedPlayersForUI = players.length === 4 ? [players[0], players[2], players[1], players[3]] : players;
  const winners = players.filter(p => p.isWinner);
  const winnerText = winners.length > 0 ? `${winners.map(p => p.name).join(' & ')}` : "No Winner";

  return (
    <SafeAreaView style={GlobalStyles.container} edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ headerShown: false }} />
      <GameHeader 
        title={title.toUpperCase()} 
        subtitle={status === 'completed' ? "COMPLETED" : `Score Limit: ${scoreLimit}`}
        onBack={() => router.dismissAll()} 
      />
      <ScoreboardHistory 
        players={players}
        history={history}
        isExpanded={isExpanded}
        toggleExpand={() => setIsExpanded(!isExpanded)}
        onEditRound={startEditingRound}
        isTeamScoreboard={false} 
      />
      
      {phase !== 'gameover' ? (
        <>
          <View style={GameStyles.statusRowFixed}>
            {phase === 'bidding' ? (
              <>
                <Text style={GameStyles.phaseTitle}>Place Bids</Text>
                <View style={[GameStyles.badge, isBiddingValid ? GameStyles.badgeSuccess : GameStyles.badgeError]}>
                    <Text style={[GameStyles.badgeText, isBiddingValid ? { color: Colors.primary } : { color: Colors.danger }]}>
                      Total: {currentTotalBids} / {requiredTotal}
                    </Text>
                </View>
              </>
            ) : (
              <>
                <Text style={GameStyles.phaseTitle}>Round Results</Text>
                <Text style={GlobalStyles.textSmall}>Select Outcome</Text>
              </>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={GameStyles.scrollContent}>
              {phase === 'bidding' ? (
                <View style={GameStyles.biddingGrid}>
                  {orderedPlayersForUI.map(p => (
                    <BiddingCard key={p.id} player={p} bid={bids[p.id]} onAdjust={(delta) => adjustBid(p.id, delta)} />
                  ))}
                </View>
              ) : (
                <View style={{ gap: 8 }}>
                  {orderedPlayersForUI.map(p => (
                    <ScoringCard key={p.id} player={p} bid={bids[p.id]} passed={results[p.id]} onSetResult={(res) => setResults(prev => ({ ...prev, [p.id]: res }))} />
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
          <View style={GameStyles.footer}>
            {phase === 'bidding' ? (
              <TouchableOpacity 
                style={[GlobalStyles.primaryButton, !isBiddingValid && GameStyles.disabledButton]} 
                onPress={() => setPhase('scoring')}
                disabled={!isBiddingValid}
              >
                <Text style={[GlobalStyles.primaryButtonText, !isBiddingValid && { color: Colors.textMuted }]}>
                  ENTER RESULTS
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={GlobalStyles.primaryButton} onPress={commitRound}>
                <Text style={GlobalStyles.primaryButtonText}>UPDATE SCOREBOARD</Text>
              </TouchableOpacity>
            )}
          </View>
        </>
      ) : (
        <GameOverScreen winners={winnerText} onRematch={handleRematch} />
      )}

      {/* Edit Modal */}
      {editingRound && (
        <Modal animationType="slide" transparent={true} visible={true}>
            <View style={GameStyles.modalOverlay}>
              <View style={GameStyles.modalContent}>
                <Text style={GameStyles.modalTitle}>Edit Round {editingRound.index + 1}</Text>
                <ScrollView style={{ maxHeight: 400 }}>
                  <View style={{ gap: 12 }}>
                    {orderedPlayersForUI.map(p => {
                      const bid = editingRound.bids[p.id];
                      const passed = editingRound.results[p.id];
                      return (
                        <View key={p.id} style={GameStyles.editRow}>
                           <Text style={GameStyles.editName}>{p.name}</Text>
                           <View style={{flexDirection:'row', alignItems:'center', gap: 10}}>
                              <TouchableOpacity onPress={() => setEditingRound(prev => prev ? ({...prev, bids: {...prev.bids, [p.id]: Math.max(2, bid-1)}}) : null)}>
                                 <Text style={GameStyles.editBtn}>-</Text>
                              </TouchableOpacity>
                              <Text style={GameStyles.editVal}>{bid}</Text>
                              <TouchableOpacity onPress={() => setEditingRound(prev => prev ? ({...prev, bids: {...prev.bids, [p.id]: Math.min(13, bid+1)}}) : null)}>
                                 <Text style={GameStyles.editBtn}>+</Text>
                              </TouchableOpacity>
                           </View>
                           <TouchableOpacity 
                             style={[GameStyles.editToggle, passed ? GameStyles.wonActive : GameStyles.brokeActive]}
                             onPress={() => setEditingRound(prev => prev ? ({...prev, results: {...prev.results, [p.id]: !passed}}) : null)}
                           >
                             <Text style={{color: '#fff', fontSize: 12, fontWeight: 'bold'}}>
                               {passed ? "WON" : "BROKE"}
                             </Text>
                           </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                </ScrollView>
                <View style={GameStyles.modalFooter}>
                  <TouchableOpacity onPress={() => setEditingRound(null)} style={GameStyles.modalCancel}>
                    <Text style={{color: Colors.textMuted}}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={saveEditedRound} style={GameStyles.modalSave}>
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

const BiddingCard = ({ player, bid, onAdjust }: { player: Player, bid: number, onAdjust: (d: number) => void }) => (
  <View style={GameStyles.biddingCard}>
    <View style={{ alignItems: 'center', marginBottom: 8 }}>
      <Text style={GameStyles.playerNameSmall} numberOfLines={1}>{player.name}</Text>
      <Text style={GameStyles.minBidTextSmall}>Min: {getMinBidForPlayer(player.totalScore)}</Text>
    </View>
    <View style={GameStyles.controlsRowCompact}>
      <TouchableOpacity onPress={() => onAdjust(-1)} style={GameStyles.controlBtnSmall}><Text style={GameStyles.controlBtnTextSmall}>-</Text></TouchableOpacity>
      <Text style={GameStyles.bidValueSmall}>{bid || 2}</Text>
      <TouchableOpacity onPress={() => onAdjust(1)} style={GameStyles.controlBtnSmall}><Text style={GameStyles.controlBtnTextSmall}>+</Text></TouchableOpacity>
    </View>
  </View>
);

const ScoringCard = ({ player, bid, passed, onSetResult }: { player: Player, bid: number, passed: boolean, onSetResult: (res: boolean) => void }) => {
  const points = calculatePoints(bid, player.totalScore);
  return (
    <View style={GameStyles.scoringCardCompact}>
      <View style={GameStyles.scoringInfo}>
        <Text style={GameStyles.playerNameSmall} numberOfLines={1}>{player.name}</Text>
      </View>
      <View style={GameStyles.scoringButtonsContainer}>
        <TouchableOpacity activeOpacity={0.8} onPress={() => onSetResult(false)} style={[GameStyles.compactResultBtn, !passed ? GameStyles.brokeActive : GameStyles.buttonInactive]}>
          <ThumbsDown size={14} color={!passed ? "#fff" : Colors.textMuted} />
          <Text style={[GameStyles.toggleTextSmall, !passed && { color: '#fff' }]}>BROKE</Text>
          {!passed && <Text style={GameStyles.scorePreviewSmall}>-{points}</Text>}
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.8} onPress={() => onSetResult(true)} style={[GameStyles.compactResultBtn, passed ? GameStyles.wonActive : GameStyles.buttonInactive]}>
          <ThumbsUp size={14} color={passed ? "#fff" : Colors.textMuted} />
          <Text style={[GameStyles.toggleTextSmall, passed && { color: '#fff' }]}>WON</Text>
          {passed && <Text style={GameStyles.scorePreviewSmall}>+{points}</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
};