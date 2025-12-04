import { Trash2 } from "lucide-react-native";
import React from "react";
import { Alert, Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { Colors, GlobalStyles, Spacing } from "../constants/theme";
import { GameSummary } from "../constants/types";

type MatchCardProps = {
  match: GameSummary;
  onPress: () => void;
  onDelete: () => void;
};

export const MatchCard: React.FC<MatchCardProps> = ({ match, onPress, onDelete }) => {
  const conditionLabel = match.scoreLimit 
    ? `Score Limit: ${match.scoreLimit}` 
    : '';

  const getScoreStyle = (p: { isDanger: boolean }) => p.isDanger ? { color: Colors.danger } : { color: Colors.text };

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
          <Text style={GlobalStyles.textSmall}>{conditionLabel}</Text>
        </View>
        
        {/* Timestamp */}
        <Text style={[GlobalStyles.textSmall, styles.cardTimestamp]}>
          {new Date(match.lastPlayed).toLocaleString()}
        </Text>

        {/* Content Body */}
        <View style={styles.cardInner}>
          {match.mode === "solo" ? (
            // SOLO VIEW (Leekha, etc.)
            match.players.map((p, i) => (
              <View key={i} style={GlobalStyles.rowBetween}>
                <Text style={[styles.rowText, p.isDanger && styles.dangerText]}>
                  {p.name}
                </Text>
                <Text style={[styles.rowText, p.isDanger && styles.dangerText]}>
                  {p.totalScore}
                </Text>
              </View>
            ))
          ) : (
            // TEAM VIEW
            <View>
              {(() => {
                // SPECIAL CASE: TEAM SCOREBOARD
                // If isTeamScoreboard is true, we aggregate players into a large "vs" view
                if (match.isTeamScoreboard) {
                   let teamA, teamB;
                   let n1, n2, n3, n4;

                   if (match.players.length === 4) {
                      // New Format: 4 Players. Scores are synced within teams.
                      teamA = match.players[0]; // P1 represents Team A score
                      teamB = match.players[2]; // P3 represents Team B score
                      
                      n1 = match.players[0].name;
                      n2 = match.players[1].name;
                      n3 = match.players[2].name;
                      n4 = match.players[3].name;
                   } else {
                      // Legacy Format (2 Players)
                      teamA = match.players[0];
                      teamB = match.players[1];
                      
                      const splitA = teamA.name.split(" & ");
                      const splitB = teamB.name.split(" & ");
                      
                      n1 = splitA[0] || teamA.name;
                      n2 = splitA[1];
                      n3 = splitB[0] || teamB.name;
                      n4 = splitB[1];
                   }

                   return (
                    <View style={styles.tarneebRow}>
                      <View style={styles.nameColLeft}>
                         <Text style={styles.teamLabel}>Team A</Text>
                         <Text style={styles.playerNameSmall} numberOfLines={1}>{n1}</Text>
                         {n2 ? <Text style={styles.playerNameSmall} numberOfLines={1}>{n2}</Text> : null}
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
                         <Text style={styles.playerNameSmall} numberOfLines={1}>{n3}</Text>
                         {n4 ? <Text style={styles.playerNameSmall} numberOfLines={1}>{n4}</Text> : null}
                      </View>
                    </View>
                   );
                }

                // GENERIC 4-PLAYER TEAM GAME (e.g. 400)
                // Displays individual scores in a quadrant layout
                if (match.players.length >= 4) {
                  const pA1 = match.players[0];
                  const pB1 = match.players[1];
                  const pA2 = match.players[2];
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
                             <Text style={styles.playerNameLeft} numberOfLines={1}>{pA1.name}</Text>
                             <View style={styles.scoreBox}>
                               <Text style={[styles.playerScoreSmall, getScoreStyle(pA1)]}>{pA1.totalScore}</Text>
                             </View>
                           </View>
                           <View style={styles.playerRow}>
                             <Text style={styles.playerNameLeft} numberOfLines={1}>{pA2.name}</Text>
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
                             <Text style={styles.playerNameRight} numberOfLines={1}>{pB1.name}</Text>
                           </View>
                           <View style={styles.playerRow}>
                             <View style={styles.scoreBox}>
                                <Text style={[styles.playerScoreSmall, getScoreStyle(pB2)]}>{pB2.totalScore}</Text>
                             </View>
                             <Text style={styles.playerNameRight} numberOfLines={1}>{pB2.name}</Text>
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
    color: "#ccc",
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
    color: "#ccc",
    fontSize: 13,
    flex: 1, 
    textAlign: 'left',
    marginRight: 8,
  },
  playerNameRight: {
    color: "#ccc",
    fontSize: 13,
    flex: 1,
    textAlign: 'right',
    marginLeft: 8,
  },
  playerNameSmall: {
    color: "#ccc",
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
  // Tarneeb Specific
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