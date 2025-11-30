import { Feather } from '@expo/vector-icons'; // Import Feather icons
import React from "react";
import { Alert, Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { Colors, GlobalStyles, Spacing } from "../constants/theme";
import { GameState } from "../services/game_storage";

// Extend the base GameState to include optional properties that are saved
type ExtendedGameState = GameState & {
  bestOf?: number;
  scoreLimit?: number;
};

type MatchCardProps = {
  match: ExtendedGameState;
  onPress: () => void;
  onDelete: () => void;
};

export const MatchCard: React.FC<MatchCardProps> = ({ match, onPress, onDelete }) => {
  // Always display "Best of X" if available, otherwise fall back to Score Limit
  const conditionLabel = match.bestOf 
    ? `Best of ${match.bestOf}` 
    : (match.scoreLimit ? `Target: ${match.scoreLimit}` : '');

  // Helper for Score Color: Red if Danger, otherwise Default Text
  const getScoreStyle = (p: { isDanger: boolean }) => p.isDanger ? { color: Colors.danger } : { color: Colors.text };

  // Confirmation Alert Logic
  const confirmDelete = () => {
    Alert.alert(
      "Delete Match",
      `Are you sure you want to delete "${match.title}"?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: onDelete,
        },
      ]
    );
  };

  // Render the "Delete" button hidden behind the card
  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    // Add a simple scale animation on drag
    const scale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0.8], // Slight scaling effect
      extrapolate: 'clamp',
    });

    return (
      <TouchableOpacity 
        onPress={confirmDelete} 
        style={styles.deleteButtonContainer}
        activeOpacity={0.7}
      >
        <Animated.View style={[styles.deleteButtonContent, { transform: [{ scale }] }]}>
          {/* Replaced Text with Feather Icon and changed color to red */}
          <Feather name="trash-2" size={28} color={Colors.danger} />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <Swipeable renderRightActions={renderRightActions}>
      <TouchableOpacity style={GlobalStyles.card} activeOpacity={0.9} onPress={onPress}>
        {/* Header: Title + Game Condition */}
        <View style={GlobalStyles.rowBetween}>
          <Text style={GlobalStyles.cardTitle}>{match.title}</Text>
          <Text style={GlobalStyles.textSmall}>{conditionLabel}</Text>
        </View>
        
        {/* Timestamp */}
        <Text style={[GlobalStyles.textSmall, styles.cardTimestamp]}>
          {match.lastPlayed}
        </Text>

        {/* Content Body */}
        <View style={styles.cardInner}>
          {/* Solo Mode View */}
          {match.mode === "solo" ? (
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
            /* Team Mode View */
            <View>
              {(() => {
                // Case 1: Aggregated Team View (2 "Players" representing Teams, e.g. Tarneeb)
                if (match.players.length === 2) {
                   const teamA = match.players[0];
                   const teamB = match.players[1];
                   
                   // Try to split names if they were combined (e.g. "P1 & P2")
                   const namesA = teamA.name.includes("&") ? teamA.name.split(" & ") : [teamA.name];
                   const namesB = teamB.name.includes("&") ? teamB.name.split(" & ") : [teamB.name];
                   
                   const pA1 = namesA[0] || teamA.name;
                   const pA2 = namesA[1] || "";
                   const pB1 = namesB[0] || teamB.name;
                   const pB2 = namesB[1] || "";

                   return (
                    <View style={styles.tarneebRow}>
                      {/* Team A Names (Left) */}
                      <View style={styles.nameColLeft}>
                         <Text style={styles.teamLabel}>Team A</Text>
                         <Text style={styles.playerNameSmall} numberOfLines={1}>{pA1}</Text>
                         {pA2 ? <Text style={styles.playerNameSmall} numberOfLines={1}>{pA2}</Text> : null}
                      </View>
                      
                      {/* Center Scores */}
                      <View style={styles.scoreCenter}>
                         <Text style={[styles.playerScoreLarge, getScoreStyle(teamA)]}>
                           {teamA.totalScore}
                         </Text>
                         <Text style={styles.vsText}>vs</Text>
                         <Text style={[styles.playerScoreLarge, getScoreStyle(teamB)]}>
                           {teamB.totalScore}
                         </Text>
                      </View>
                      
                      {/* Team B Names (Right) */}
                      <View style={styles.nameColRight}>
                         <Text style={styles.teamLabel}>Team B</Text>
                         <Text style={styles.playerNameSmall} numberOfLines={1}>{pB1}</Text>
                         {pB2 ? <Text style={styles.playerNameSmall} numberOfLines={1}>{pB2}</Text> : null}
                      </View>
                    </View>
                   );
                }

                // Case 2: Individual Team View (4 Players split into teams, e.g. 400, Leekha)
                if (match.players.length >= 4) {
                  const pA1 = match.players[0]; // Team A
                  const pB1 = match.players[1]; // Team B
                  const pA2 = match.players[2]; // Team A
                  const pB2 = match.players[3]; // Team B

                  return (
                    <View>
                      {/* 1. Team Labels Row */}
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                         <Text style={styles.teamLabel}>Team A</Text>
                         <Text style={styles.teamLabel}>Team B</Text>
                      </View>

                      {/* 2. Players & Scores Row - Centered Alignment */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        
                        {/* Team A Column (Left) */}
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
                        
                        {/* VS Divider (Center) */}
                        <Text style={[styles.rowText, { fontSize: 12, color: Colors.textMuted, marginHorizontal: 4 }]}>
                            vs 
                        </Text>
                        
                        {/* Team B Column (Right) */}
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
                    </View>
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
  // Generic Layout Styles
  teamRowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
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
    minWidth: 100,
    marginTop: 18, 
  },
  vsText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginHorizontal: 8,
    fontWeight: '600',
  },
  
  // Labels
  teamLabel: {
    color: Colors.textSecondary,
    fontSize: 10,
    textTransform: 'uppercase',
    marginBottom: 4,
    fontWeight: 'bold',
  },

  // 4-Player Row Styles
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
  // Fixed width box for vertical alignment of scores
  scoreBox: {
    minWidth: 35,
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
  // Tarneeb Specific Layout
  tarneebRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  // Swipe Actions
  deleteButtonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
    // Removed backgroundColor and border radius for a simpler look
  },
  deleteButtonContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  // deleteText style removed as it is no longer used
});