import { Trash2 } from "lucide-react-native";
import React from "react";
import { Alert, Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { Colors, GlobalStyles, Spacing } from "../constants/theme";
import { GameSummary, Player } from "../constants/types";

type MatchCardProps = {
  match: GameSummary;
  onPress: () => void;
  onDelete: () => void;
};

export const MatchCard: React.FC<MatchCardProps> = ({ match, onPress, onDelete }) => {
  const isCompleted = match.status === 'completed';
  
  const conditionLabel = isCompleted 
    ? "Completed" 
    : (match.scoreLimit ? `Score Limit: ${match.scoreLimit}` : '');

  // --- Winner Logic ---
  const isWinner = (p: Player) => {
    if (!isCompleted) return false;
    
    // 1. PREFERRED: Check explicit flag from storage
    if (p.isWinner !== undefined) return p.isWinner;

    // 2. FALLBACK: Old calculation for legacy data
    if (match.gameType === 'leekha' && match.players.length === 4) {
        const maxScore = Math.max(...match.players.map(pl => pl.totalScore));
        const p0 = match.players[0]; const p1 = match.players[1];
        const teamALost = p0.totalScore === maxScore || p1.totalScore === maxScore;
        const isTeamA = p.id === p0.id || p.id === p1.id;
        return teamALost ? !isTeamA : isTeamA;
    }

    // Generic Fallback
    const maxScore = Math.max(...match.players.map(pl => pl.totalScore));
    return p.totalScore === maxScore;
  };

  // --- Styling ---
  const getScoreStyle = (p: Player) => {
    if (isWinner(p)) return { color: Colors.primary, fontWeight: '800' as const };
    
    if (isCompleted) {
        // Grey out losers
        return { color: Colors.textMuted, opacity: 0.5 };
    }
    
    // Active Game Logic
    if (p.isDanger) return { color: Colors.danger };
    return { color: Colors.text };
  };

  const getNameStyle = (p: Player) => {
    if (isWinner(p)) return { color: Colors.primary, fontWeight: '800' as const };
    
    if (isCompleted) {
        // Grey out losers
        return { color: Colors.textMuted, opacity: 0.5 };
    }
    
    return { color: "#ccc" };
  };

  // --- Actions ---
  const confirmDelete = () => {
    Alert.alert(
      "Delete Match",
      `Are you sure you want to delete "${match.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: onDelete },
      ]
    );
  };

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0.8],
      extrapolate: 'clamp',
    });

    return (
      <TouchableOpacity 
        onPress={confirmDelete} 
        style={styles.deleteButtonContainer}
        activeOpacity={0.7}
      >
        <Animated.View style={[styles.deleteButtonContent, { transform: [{ scale }] }]}>
          <Trash2 size={28} color={Colors.danger} />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <Swipeable renderRightActions={renderRightActions}>
      <TouchableOpacity style={GlobalStyles.card} activeOpacity={0.9} onPress={onPress}>
        {/* Header */}
        <View style={GlobalStyles.rowBetween}>
          <Text style={GlobalStyles.cardTitle}>{match.title}</Text>
          <Text style={[
              GlobalStyles.textSmall, 
              isCompleted && { color: Colors.primary, fontWeight: 'bold' }
          ]}>
            {conditionLabel}
          </Text>
        </View>
        
        {/* Timestamp */}
        <Text style={[GlobalStyles.textSmall, styles.cardTimestamp]}>
          {new Date(match.lastPlayed).toLocaleString()}
        </Text>

        {/* Content Body */}
        <View style={styles.cardInner}>
          {match.mode === "solo" ? (
            // SOLO VIEW
            match.players.map((p, i) => (
              <View key={i} style={GlobalStyles.rowBetween}>
                <Text style={[styles.rowText, getNameStyle(p)]}>
                  {p.name}
                </Text>
                <Text style={[styles.rowText, getScoreStyle(p)]}>
                  {p.totalScore}
                </Text>
              </View>
            ))
          ) : (
            // TEAM VIEW
            <View>
              {(() => {
                // SPECIAL CASE: TARNEEB (Already aggregated teams)
                if (match.isTeamScoreboard || match.gameType === 'tarneeb') {
                   let teamA, teamB;
                   let n1, n2, n3, n4;

                   if (match.players.length === 4) {
                      teamA = match.players[0]; // Team A Score Object
                      teamB = match.players[2]; // Team B Score Object
                      
                      n1 = match.players[0].name;
                      n2 = match.players[1].name;
                      n3 = match.players[2].name;
                      n4 = match.players[3].name;
                   } else {
                      // Fallback
                      teamA = match.players[0];
                      teamB = match.players[1];
                      n1 = teamA.name; n3 = teamB.name;
                   }

                   return (
                    <View style={styles.tarneebRow}>
                      <View style={styles.nameColLeft}>
                         <Text style={styles.teamLabel}>Team A</Text>
                         <Text style={[styles.playerNameSmall, getNameStyle(teamA)]} numberOfLines={1}>{n1}</Text>
                         {n2 ? <Text style={[styles.playerNameSmall, getNameStyle(teamA)]} numberOfLines={1}>{n2}</Text> : null}
                      </View>
                      
                      <View style={styles.scoreCenter}>
                         <Text style={[styles.playerScoreLarge, getScoreStyle(teamA)]}>
                           {teamA.totalScore}
                         </Text>
                         <Text style={styles.vsText}>vs</Text>
                         <Text style={[styles.playerScoreLarge, getScoreStyle(teamB)]}>
                           {teamB.totalScore}
                         </Text>
                      </View>
                      
                      <View style={styles.nameColRight}>
                         <Text style={styles.teamLabel}>Team B</Text>
                         <Text style={[styles.playerNameSmall, getNameStyle(teamB)]} numberOfLines={1}>{n3}</Text>
                         {n4 ? <Text style={[styles.playerNameSmall, getNameStyle(teamB)]} numberOfLines={1}>{n4}</Text> : null}
                      </View>
                    </View>
                   );
                }

                // GENERIC 4-PLAYER TEAM GAME (400, Leekha)
                // Assumes Storage: [TeamA_1, TeamA_2, TeamB_1, TeamB_2]
                if (match.players.length >= 4) {
                  const pA1 = match.players[0];
                  const pA2 = match.players[1];
                  const pB1 = match.players[2];
                  const pB2 = match.players[3];

                  return (
                    <>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                         <Text style={styles.teamLabel}>Team A</Text>
                         <Text style={styles.teamLabel}>Team B</Text>
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        {/* Team A (Left) */}
                        <View style={{ flex: 1, marginRight: 4 }}>
                           <View style={styles.playerRow}>
                             <Text style={[styles.playerNameLeft, getNameStyle(pA1)]} numberOfLines={1}>{pA1.name}</Text>
                             <View style={styles.scoreBox}>
                               <Text style={[styles.playerScoreSmall, getScoreStyle(pA1)]}>{pA1.totalScore}</Text>
                             </View>
                           </View>
                           <View style={styles.playerRow}>
                             <Text style={[styles.playerNameLeft, getNameStyle(pA2)]} numberOfLines={1}>{pA2.name}</Text>
                             <View style={styles.scoreBox}>
                                <Text style={[styles.playerScoreSmall, getScoreStyle(pA2)]}>{pA2.totalScore}</Text>
                             </View>
                           </View>
                        </View>
                        
                        <Text style={[styles.rowText, { fontSize: 12, color: Colors.textMuted, marginHorizontal: 4 }]}>vs</Text>
                        
                        {/* Team B (Right) */}
                        <View style={{ flex: 1, marginLeft: 4, alignItems: 'flex-end' }}>
                           <View style={styles.playerRow}>
                             <View style={styles.scoreBox}>
                                <Text style={[styles.playerScoreSmall, getScoreStyle(pB1)]}>{pB1.totalScore}</Text>
                             </View>
                             <Text style={[styles.playerNameRight, getNameStyle(pB1)]} numberOfLines={1}>{pB1.name}</Text>
                           </View>
                           <View style={styles.playerRow}>
                             <View style={styles.scoreBox}>
                                <Text style={[styles.playerScoreSmall, getScoreStyle(pB2)]}>{pB2.totalScore}</Text>
                             </View>
                             <Text style={[styles.playerNameRight, getNameStyle(pB2)]} numberOfLines={1}>{pB2.name}</Text>
                           </View>
                        </View>
                      </View>
                    </>
                  );
                }
                
                return null;
              })()}
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  cardTimestamp: {
    color: Colors.textMuted,
    marginBottom: Spacing.m,
  },
  cardInner: {
    backgroundColor: Colors.surfaceInner,
    borderRadius: 8,
    padding: Spacing.m,
    gap: 4, 
  },
  rowText: {
    fontSize: 14,
  },
  dangerText: {
    color: Colors.danger,
    fontWeight: "bold",
  },
  teamLabel: {
    color: Colors.textSecondary,
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%', 
    marginBottom: 4,
  },
  playerNameLeft: {
    fontSize: 13,
    flex: 1, 
    textAlign: 'left',
    marginRight: 8,
  },
  playerNameRight: {
    fontSize: 13,
    flex: 1,
    textAlign: 'right',
    marginLeft: 8,
  },
  playerNameSmall: {
    fontSize: 13,
    marginBottom: 2,
  },
  scoreBox: {
    width: 40, 
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerScoreSmall: {
    fontWeight: "bold",
    fontSize: 14,
    color: Colors.text,
    textAlign: 'center',
  },
  playerScoreLarge: {
    fontWeight: "800",
    fontSize: 24,
    color: Colors.text,
  },
  tarneebRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nameColLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  nameColRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  scoreCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
    gap: 8,
  },
  vsText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  deleteButtonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
  },
  deleteButtonContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});