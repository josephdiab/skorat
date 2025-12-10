import { useKeepAwake } from 'expo-keep-awake';
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ThumbsDown, ThumbsUp } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
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
import { GameStyles } from "../../constants/game_styles"; // <--- NEW IMPORT
import { Colors, GlobalStyles } from "../../constants/theme";
import { GameState, Player, RoundHistory, UserProfile } from "../../constants/types";
import { GameStorage } from "../../services/game_storage";

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
  const params = useLocalSearchParams();
  const instanceId = (params.instanceId as string) || (params.id as string);
  const isFirstLoad = useRef(true);
  
  // --- State ---
  const [isLoaded, setIsLoaded] = useState(false);
  const [gameId, setGameId] = useState<string>("");
  const [lastPlayed, setLastPlayed] = useState<string>(""); 

  const [players, setPlayers] = useState<Player[]>([]);
  const [history, setHistory] = useState<RoundHistory[]>([]);
  const [roundNum, setRoundNum] = useState(1);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const [mode, setMode] = useState<'solo' | 'teams'>('teams');
  const [gameName, setGameName] = useState("400");
  const [scoreLimit, setScoreLimit] = useState(41); 
  const [gameStatus, setGameStatus] = useState<'active' | 'completed'>('active');
  const [phase, setPhase] = useState<'bidding' | 'scoring' | 'gameover'>('bidding');
  const [bids, setBids] = useState<Record<string, number>>({});
  const [results, setResults] = useState<Record<string, boolean>>({}); 

  const [editingRound, setEditingRound] = useState<{
    index: number;
    bids: Record<string, number>;
    results: Record<string, boolean>;
  } | null>(null);
  
  // --- LOAD DATA ---
  useEffect(() => {
    const loadGameData = async () => {
      if (instanceId) {
        const savedGame = await GameStorage.get(instanceId);
        if (savedGame) {
          setGameId(savedGame.id);
          setPlayers(savedGame.players);
          setHistory(savedGame.history);
          setRoundNum(savedGame.history.length + 1);
          setMode(savedGame.mode);
          setGameName(savedGame.title);
          setScoreLimit(savedGame.scoreLimit || 41);
          setGameStatus(savedGame.status);
          if (savedGame.status === 'completed') setPhase('gameover');
          setLastPlayed(savedGame.lastPlayed); 
          setIsLoaded(true);
          return;
        }
      }

      if (params.playerProfiles) {
        try {
          const profiles: UserProfile[] = JSON.parse(params.playerProfiles as string);
          const initialPlayers: Player[] = profiles.map((p, index) => ({
            id: (index + 1).toString(),
            profileId: p.id,
            name: p.name,
            totalScore: 0, 
            isDanger: false
          }));

          const newId = Date.now().toString();
          const now = new Date().toISOString();
          setGameId(newId);
          setPlayers(initialPlayers);
          setMode((params.mode as 'solo' | 'teams') || 'teams');
          setGameName((params.gameName as string) || "400");
          setScoreLimit(params.scoreLimit ? Number(params.scoreLimit) : 41);
          setLastPlayed(now);

          const initialGame: GameState = {
            id: newId,
            instanceId: newId,
            gameType: '400',
            status: 'active',
            mode: (params.mode as 'solo' | 'teams') || 'teams',
            title: (params.gameName as string) || "400",
            roundLabel: 'Round 1',
            lastPlayed: now,
            players: initialPlayers,
            history: [],
            scoreLimit: params.scoreLimit ? Number(params.scoreLimit) : 41,
            isTeamScoreboard: false,
          };
          await GameStorage.save(initialGame);
          setIsLoaded(true);
        } catch (e) { console.log(e); }
      }
    };
    loadGameData();
  }, [instanceId]);

  useEffect(() => {
    if (!isLoaded || players.length === 0) return;
    const initialBids: Record<string, number> = {};
    const initialResults: Record<string, boolean> = {};
    players.forEach(p => {
      initialBids[p.id] = getMinBidForPlayer(p.totalScore);
      initialResults[p.id] = true;
    });
    setBids(initialBids);
    setResults(initialResults);
  }, [roundNum, isLoaded, players.length]);

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

    setHistory(prev => [...prev, { roundNum, playerDetails: roundDetails }]);

    const p0 = updatedPlayers[0];
    const p1 = updatedPlayers[1];
    const p2 = updatedPlayers[2];
    const p3 = updatedPlayers[3];

    const teamA_Qualified = (p0.totalScore >= scoreLimit && p1.totalScore > 0) || (p1.totalScore >= scoreLimit && p0.totalScore > 0);
    const teamB_Qualified = (p2.totalScore >= scoreLimit && p3.totalScore > 0) || (p3.totalScore >= scoreLimit && p2.totalScore > 0);

    let winningTeam: 'A' | 'B' | null = null;
    if (teamA_Qualified && !teamB_Qualified) winningTeam = 'A';
    else if (!teamA_Qualified && teamB_Qualified) winningTeam = 'B';
    else if (teamA_Qualified && teamB_Qualified) {
        const maxA = Math.max(p0.totalScore, p1.totalScore);
        const maxB = Math.max(p2.totalScore, p3.totalScore);
        if (maxA > maxB) winningTeam = 'A';
        else if (maxB > maxA) winningTeam = 'B';
    }

    if (winningTeam) {
        updatedPlayers = updatedPlayers.map((player, idx) => {
            const isTeamA = (idx === 0 || idx === 1);
            return { ...player, isWinner: winningTeam === 'A' ? isTeamA : !isTeamA };
        });
        setPlayers(updatedPlayers);
        setGameStatus('completed');
        setPhase('gameover');
    } else {
        setPlayers(updatedPlayers);
        setRoundNum(prev => prev + 1);
        setPhase('bidding');
    }
    setLastPlayed(new Date().toISOString()); 
  };

  const handleRematch = () => {
    const profileParams = players.map(p => ({ id: p.profileId, name: p.name }));
    router.push({
      pathname: "/games/400",
      params: {
        playerProfiles: JSON.stringify(profileParams),
        gameName: gameName,
        scoreLimit: scoreLimit.toString(),
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
    setHistory(finalHistory);
    setPlayers(finalPlayers);
    setEditingRound(null);
    setLastPlayed(new Date().toISOString()); 
  };

  useEffect(() => {
    if (!isLoaded || !gameId || !lastPlayed) return;
    if (isFirstLoad.current) { isFirstLoad.current = false; return; }
    const gameState: GameState = {
      id: gameId,
      instanceId: gameId,
      gameType: '400',
      status: gameStatus, 
      mode: 'teams',
      title: gameName, 
      roundLabel: `Round ${roundNum}`, 
      lastPlayed, 
      players,
      history,
      scoreLimit: scoreLimit, 
      isTeamScoreboard: false 
    };
    GameStorage.save(gameState);
  }, [players, history, roundNum, isLoaded, gameId, gameStatus, lastPlayed]);

  if (!isLoaded) return <SafeAreaView style={GlobalStyles.container} />;

  const orderedPlayersForUI = players.length === 4 ? [players[0], players[2], players[1], players[3]] : players;
  const winners = players.filter(p => p.isWinner);
  const winnerText = winners.length > 0 ? `${winners.map(p => p.name).join(' & ')}` : "No Winner";

  return (
    <SafeAreaView style={GlobalStyles.container} edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ headerShown: false }} />
      <GameHeader 
        title={gameName.toUpperCase()} 
        subtitle={gameStatus === 'completed' ? "COMPLETED" : `Score Limit: ${scoreLimit}`}
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