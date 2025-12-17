import { Stack, useRouter } from "expo-router";
import { Check, Crown, X } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Local imports
import { GameHeader } from "../../components/game_header";
import { GameOverScreen } from "../../components/rematch_button";
import { ScoreboardHistory } from "../../components/scoreboard_history";
import { GameStyles } from "../../constants/game_styles";
import { Colors, GlobalStyles, Spacing } from "../../constants/theme";
import { GameRoundDetails, Player, RoundHistory } from "../../constants/types";
import { useGameCore } from "../../hooks/useGameCore";
import { Logger } from "../../services/logger";

type Phase = 'bidding' | 'scoring' | 'gameover';

export default function TarneebScreen() {
  const router = useRouter();

  // 1. USE THE GENERIC HOOK
  const { gameState, isLoaded, updateState } = useGameCore('tarneeb', 'TARNEEB', 31, true);

  // 2. EXTRACT DATA SAFELY
  const players = gameState?.players || [];
  const history = gameState?.history || [];
  const scoreLimit = gameState?.scoreLimit || 31;
  const title = gameState?.title || "TARNEEB";
  const status = gameState?.status || 'active';

  // 3. LOCAL STATE
  const [phase, setPhase] = useState<Phase>('bidding');
  const [callingTeam, setCallingTeam] = useState<'A' | 'B' | null>(null);
  const [bidAmount, setBidAmount] = useState<number>(7);
  const [tricksTaken, setTricksTaken] = useState<number>(7);
  const [isExpanded, setIsExpanded] = useState(false);

  const [editingRound, setEditingRound] = useState<{
    index: number;
    callingTeam: 'A' | 'B';
    bidAmount: number;
    tricksTaken: number;
  } | null>(null);

  useEffect(() => {
    if (status === 'completed') setPhase('gameover');
  }, [status]);

  // Helper for Team Names
  const teamAName = players.length >= 2 
    ? `${players[0].name.split(' ')[0]} & ${players[1].name.split(' ')[0]}` 
    : "Team A";
  const teamBName = players.length >= 4 
    ? `${players[2].name.split(' ')[0]} & ${players[3].name.split(' ')[0]}` 
    : "Team B";
  
  const teamNames = useMemo(() => ({ A: teamAName, B: teamBName }), [teamAName, teamBName]);

  // --- VIEW MODEL ---
  // The Scoreboard UI expects players with IDs 'A' and 'B' for the columns.
  const scoreboardPlayers = useMemo<Player[]>(() => {
  if (players.length < 4) return [];
  return [
    { id: "A", name: teamAName, totalScore: players[0].totalScore, isDanger: players[0].isDanger, profileId: "A", isWinner: false },
    { id: "B", name: teamBName, totalScore: players[2].totalScore, isDanger: players[2].isDanger, profileId: "B", isWinner: false },
  ];
}, [players, teamAName, teamBName]);

const scoreboardHistory = useMemo<RoundHistory[]>(() => {
  const p0Id = players[0]?.profileId;
  const p2Id = players[2]?.profileId;

  return history.map((h) => ({
    roundNum: h.roundNum,
    timestamp: h.timestamp,
    playerDetails: {
      A: (p0Id ? h.playerDetails[p0Id] : undefined) as GameRoundDetails,
      B: (p2Id ? h.playerDetails[p2Id] : undefined) as GameRoundDetails,
    },
  }));
}, [history, players]);


  // --- LOADING GUARD ---
  if (!isLoaded || !gameState) return <SafeAreaView style={GlobalStyles.container} />;

  // --- HANDLERS ---
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

  const commitRound = () => {
    if (!callingTeam) return;
    const result = calculateRoundScores(callingTeam, bidAmount, tricksTaken);
    if (!result) return;

    // Use strictly typed Record
    const roundDetails: Record<string, GameRoundDetails> = {};
    
    let updatedPlayers = players.map((p, index) => {
      const isTeamA = index < 2;
      const pointsChange = isTeamA ? result.pointsA : result.pointsB;
      const isMyTeamCalling = (isTeamA && callingTeam === 'A') || (!isTeamA && callingTeam === 'B');
      
      // Determine partner (0<->1, 2<->3)
      const partnerIdx = index < 2 ? (index === 0 ? 1 : 0) : (index === 2 ? 3 : 2);
      const partnerId = players[partnerIdx]?.profileId;

      // KEYING FIX: Use p.profileId
      roundDetails[p.profileId] = { 
        kind: 'tarneeb',       
        bid: bidAmount,
        tricksTaken: tricksTaken,
        isCallingTeamMember: isMyTeamCalling,
        score: pointsChange,
        partnerProfileId: partnerId
      };
      
      const newTotal = p.totalScore + pointsChange;
      return { ...p, totalScore: newTotal, isDanger: newTotal < 0, isWinner: false };
    });

    const newHistory = [...history, { 
        roundNum: history.length + 1, 
        timestamp: new Date().toISOString(),
        playerDetails: roundDetails 
    }];

    const scoreA = updatedPlayers[0].totalScore;
    const scoreB = updatedPlayers[2].totalScore;
    let winningTeam: 'A' | 'B' | null = null;

    if (scoreA >= scoreLimit || scoreB >= scoreLimit) {
        if (scoreA > scoreB && scoreA >= scoreLimit) winningTeam = 'A';
        else if (scoreB > scoreA && scoreB >= scoreLimit) winningTeam = 'B';
    }

    if (winningTeam) {
      updatedPlayers = updatedPlayers.map((p, index) => {
          const isTeamA = index < 2;
          return { ...p, isWinner: winningTeam === 'A' ? isTeamA : !isTeamA };
      });
      Logger.info('GAME_ACTION', 'Tarneeb Match Won', { winningTeam });
      updateState({ players: updatedPlayers, history: newHistory, status: 'completed' });
    } else {
        Logger.info('GAME_ACTION', `Round ${newHistory.length} Committed`, { result });
        updateState({ players: updatedPlayers, history: newHistory, roundLabel: `Round ${newHistory.length + 1}` });
        setCallingTeam(null);
        setBidAmount(7);
        setTricksTaken(7);
        setPhase('bidding');
    }
  };

  const handleRematch = () => {
    const profileParams = players.map(p => ({ id: p.profileId, name: p.name }));
    router.push({
      pathname: "/games/tarneeb",
      params: {
        playerProfiles: JSON.stringify(profileParams),
        gameName: title,
        scoreLimit: scoreLimit.toString(),
        mode: 'teams'
      }
    });
  };

  const startEditingRound = (index: number) => {
    const round = history[index];
    
    // READING FIX: Use profileId to find data
    const p0Id = players[0]?.profileId;
    const p2Id = players[2]?.profileId;

    // Use Type Guard to ensure we are reading Tarneeb data
    const detailsA = round.playerDetails[p0Id];
    const detailsB = round.playerDetails[p2Id];

    let caller: 'A' | 'B' = 'A';
    let bid = 7;
    let tricks = 7;
    
    // Check kind just to be safe, though this component only runs for Tarneeb
    if (detailsA?.kind === 'tarneeb' && detailsA.isCallingTeamMember) { 
        caller = 'A'; 
        bid = detailsA.bid; 
        tricks = detailsA.tricksTaken; 
    } else if (detailsB?.kind === 'tarneeb' && detailsB.isCallingTeamMember) { 
        caller = 'B'; 
        bid = detailsB.bid; 
        tricks = detailsB.tricksTaken; 
    }
    setEditingRound({ index, callingTeam: caller, bidAmount: bid, tricksTaken: tricks });
  };

  const saveEditedRound = () => {
    if (!editingRound) return;
    const result = calculateRoundScores(editingRound.callingTeam, editingRound.bidAmount, editingRound.tricksTaken);
    if (!result) return;
    
    const newHistory = [...history];
    const roundDetails: Record<string, GameRoundDetails> = {};
    
    players.forEach((p, index) => {
      const isTeamA = index < 2;
      const pointsChange = isTeamA ? result.pointsA : result.pointsB;
      const isMyTeamCalling = (isTeamA && editingRound.callingTeam === 'A') || (!isTeamA && editingRound.callingTeam === 'B');
      
      const partnerIdx = index < 2 ? (index === 0 ? 1 : 0) : (index === 2 ? 3 : 2);
      const partnerId = players[partnerIdx]?.profileId;

      // KEYING FIX: Use p.profileId
      roundDetails[p.profileId] = { 
        kind: 'tarneeb',
        score: pointsChange, 
        isCallingTeamMember: isMyTeamCalling, 
        bid: editingRound.bidAmount, 
        tricksTaken: editingRound.tricksTaken,
        partnerProfileId: partnerId
      };
    });
    
    const originalRound = newHistory[editingRound.index];
    newHistory[editingRound.index] = { 
        ...originalRound, 
        playerDetails: roundDetails 
    };

    let recalculatedPlayers = players.map(p => {
      const totalScore = newHistory.reduce((sum, round) => {
          // KEYING FIX: Read by profileId
          const details = round.playerDetails[p.profileId];
          // Type Guard for safety
          if (details && details.kind === 'tarneeb') {
             return sum + details.score;
          }
          return sum;
      }, 0);
      return { ...p, totalScore, isDanger: totalScore < 0, isWinner: false };
    });

    const scoreA = recalculatedPlayers[0].totalScore;
    const scoreB = recalculatedPlayers[2].totalScore;
    let winningTeam: 'A' | 'B' | null = null;
    let newStatus: 'active' | 'completed' = 'active';

    if (scoreA >= scoreLimit || scoreB >= scoreLimit) {
        if (scoreA > scoreB && scoreA >= scoreLimit) winningTeam = 'A';
        else if (scoreB > scoreA && scoreB >= scoreLimit) winningTeam = 'B';
    }

    if (winningTeam) {
        recalculatedPlayers = recalculatedPlayers.map((p, index) => {
            const isTeamA = index < 2;
            return { ...p, isWinner: winningTeam === 'A' ? isTeamA : !isTeamA };
        });
        newStatus = 'completed';
    } else {
        newStatus = 'active';
    }

    Logger.info('GAME_ACTION', `Round ${editingRound.index + 1} Edited`);
    updateState({ players: recalculatedPlayers, history: newHistory, status: newStatus });
    setEditingRound(null);
  };

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
        players={scoreboardPlayers}
        history={scoreboardHistory}
        isExpanded={isExpanded}
        toggleExpand={() => setIsExpanded(!isExpanded)}
        onEditRound={startEditingRound}
        isTeamScoreboard={true}
      />

      {phase !== 'gameover' ? (
        <>
          <View style={GameStyles.statusRowFixed}>
            {phase === 'bidding' ? (
              <>
                <Text style={GameStyles.phaseTitle}>Place Bids</Text>
                <View style={[GameStyles.badge, callingTeam ? GameStyles.badgeSuccess : GameStyles.badgeError]}>
                    <Text style={[GameStyles.badgeText, callingTeam ? { color: Colors.primary } : { color: Colors.danger }]}>
                      {/* Ensure this is strictly Text */}
                      Total: {callingTeam ? bidAmount : 0}
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

          <View style={GameStyles.footer}>
            {phase === 'bidding' ? (
              <TouchableOpacity 
                style={[GlobalStyles.primaryButton, !callingTeam && GameStyles.disabledButton]} 
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
        <GameOverScreen winners={winnerText} onRematch={handleRematch} />
      )}

      {/* Edit Modal */}
      {editingRound && (
        <Modal animationType="slide" transparent={true} visible={true}>
            <View style={GameStyles.modalOverlay}>
              <View style={GameStyles.modalContent}>
                <Text style={GameStyles.modalTitle}>Edit Round {editingRound.index + 1}</Text>
                <ScrollView style={{ maxHeight: 400 }}>
                  <View style={{gap: 20}}>
                    <View>
                      <Text style={[GameStyles.sectionLabel, {marginBottom: 10}]}>Bidding</Text>
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
                      <Text style={[GameStyles.sectionLabel, {marginBottom: 10}]}>Result</Text>
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

// --- SUB-COMPONENTS ---

const BiddingPhase = ({ callingTeam, setCallingTeam, bidAmount, setBidAmount, setTricksTaken, teamNames, isModal = false }: any) => (
  <>
    <Text style={[GameStyles.sectionLabel, isModal && {fontSize: 10, marginBottom: 4}]}>Which team is calling?</Text>
    <View style={[GameStyles.grid, isModal && {gap: 8}]}>
      {['A', 'B'].map((team) => (
        <TouchableOpacity
          key={team}
          style={[
            GameStyles.playerOption, 
            callingTeam === team && GameStyles.playerOptionActive,
            isModal && { padding: 12, borderRadius: 12 } 
          ]}
          onPress={() => setCallingTeam(team)}
          activeOpacity={0.8}
        >
          <Text style={[GameStyles.teamNameBig, callingTeam === team && { color: Colors.primary }, isModal && {fontSize: 16, marginBottom: 2}]}>Team {team}</Text>
          {/* Ensure teamNames is strictly accessed as string */}
          <Text style={[GameStyles.teamPlayers, isModal && {fontSize: 10}]}>{teamNames[team]}</Text>
          {callingTeam === team && <Crown size={isModal ? 16 : 20} color={Colors.primary} style={{marginTop: isModal ? 4 : 8}} />}
        </TouchableOpacity>
      ))}
    </View>

    <Text style={[GameStyles.sectionLabel, { marginTop: Spacing.l }, isModal && {marginTop: Spacing.m, fontSize: 10, marginBottom: 4}]}>Call Amount</Text>
    <View style={[GameStyles.bidGrid, isModal && {gap: 8}]}>
      {[7, 8, 9, 10, 11, 12, 13].map(num => (
        <TouchableOpacity
          key={num}
          style={[
            GameStyles.bidOption, 
            bidAmount === num && GameStyles.bidOptionActive,
            isModal && {width: 40, height: 40, borderRadius: 20} 
          ]}
          onPress={() => {
            setBidAmount(num);
            if (setTricksTaken) setTricksTaken(num); 
          }}
          activeOpacity={0.8}
        >
          <Text style={[GameStyles.bidOptionText, bidAmount === num && { color: '#000' }, isModal && {fontSize: 14}]}>{num}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </>
);

const ScoringPhase = ({ callingTeam, tricksTaken, setTricksTaken, preview, isModal = false }: any) => (
  <View style={[GameStyles.scoringContainer, isModal && {gap: 12, flexDirection: 'row'}]}>
     <View style={[GameStyles.counterCard, isModal && {padding: 12, flex: 1}]}>
       {/* Use simple string for label */}
       <Text style={[GameStyles.counterLabel, isModal && {fontSize: 10, marginBottom: 8, textAlign: 'center'}]}>
         {isModal ? `Tricks (${callingTeam})` : `Tricks Taken by Team ${callingTeam}`}
       </Text>
       <View style={[GameStyles.counterRow, isModal && {gap: 8, justifyContent: 'center'}]}>
          <TouchableOpacity onPress={() => setTricksTaken((p: number) => Math.max(0, p - 1))} style={[GameStyles.counterBtn, isModal && {width: 32, height: 32, borderRadius: 16}]}>
            <Text style={[GameStyles.counterBtnText, isModal && {fontSize: 20, marginTop: -2}]}>-</Text>
          </TouchableOpacity>
          <Text style={[GameStyles.counterValue, isModal && {fontSize: 28, minWidth: 30}]}>{tricksTaken}</Text>
          <TouchableOpacity onPress={() => setTricksTaken((p: number) => Math.min(13, p + 1))} style={[GameStyles.counterBtn, isModal && {width: 32, height: 32, borderRadius: 16}]}>
            <Text style={[GameStyles.counterBtnText, isModal && {fontSize: 20, marginTop: -2}]}>+</Text>
          </TouchableOpacity>
       </View>
     </View>

     {preview && (
       <View style={[GameStyles.previewCard, preview.success ? GameStyles.previewSuccess : GameStyles.previewFail, isModal && {padding: 12, flex: 1}]}>
          <View style={GlobalStyles.rowBetween}>
             <View style={GlobalStyles.row}>
                {preview.success ? <Check size={isModal ? 16 : 24} color={Colors.primary} /> : <X size={isModal ? 16 : 24} color={Colors.danger} />}
                <Text style={[GameStyles.previewTitle, isModal && {fontSize: 14, marginLeft: 6}]}>{preview.success ? "Success" : "Failed"}</Text>
             </View>
          </View>
          <View style={[GameStyles.divider, isModal && {marginVertical: 8}]} />
          <View style={GlobalStyles.rowBetween}>
             <Text style={[GameStyles.previewSub, isModal && {fontSize: 10}]}>Team A</Text>
             <Text style={[GameStyles.previewSubScore, { color: preview.pointsA >= 0 ? Colors.text : Colors.danger }, isModal && {fontSize: 14}]}>
               {preview.pointsA > 0 ? '+' : ''}{preview.pointsA}
             </Text>
          </View>
          <View style={[GlobalStyles.rowBetween, { marginTop: isModal ? 4 : 8 }]}>
             <Text style={[GameStyles.previewSub, isModal && {fontSize: 10}]}>Team B</Text>
             <Text style={[GameStyles.previewSubScore, { color: preview.pointsB >= 0 ? Colors.text : Colors.danger }, isModal && {fontSize: 14}]}>
               {preview.pointsB > 0 ? '+' : ''}{preview.pointsB}
             </Text>
          </View>
       </View>
     )}
  </View>
);