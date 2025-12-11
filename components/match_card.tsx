import { RotateCcw, Trash2 } from "lucide-react-native";
import React from "react";
import { Alert, Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { Colors, GlobalStyles, Spacing } from "../constants/theme";
import { GameSummary, Player } from "../constants/types";

type MatchCardProps = {
  match: GameSummary;
  onPress: () => void;
  onDelete: () => void;
  onRematch: () => void;
};

export const MatchCard: React.FC<MatchCardProps> = ({ match, onPress, onDelete, onRematch }) => {
  const isCompleted = match.status === 'completed';
  
  const conditionLabel = isCompleted 
    ? "Completed" 
    : (match.scoreLimit ? `Score Limit: ${match.scoreLimit}` : '');

  // --- Winner Logic ---
  const isWinner = (p: Player) => {
    if (!isCompleted) return false;
    if (p.isWinner !== undefined) return p.isWinner;
    const maxScore = Math.max(...match.players.map(pl => pl.totalScore));
    return p.totalScore === maxScore;
  };

  // --- Styling ---
  const getScoreStyle = (p: Player) => {
    if (isWinner(p)) return { color: Colors.primary, fontWeight: '800' as const };
    if (isCompleted) return { color: Colors.textMuted, opacity: 0.5 };
    if (p.isDanger) return { color: Colors.danger };
    return { color: Colors.text };
  };

  const getNameStyle = (p: Player) => {
    if (isWinner(p)) return { color: Colors.primary, fontWeight: '800' as const };
    if (isCompleted) return { color: Colors.textMuted, opacity: 0.5 };
    return { color: "#ccc" };
  };

  // --- Swipe Actions ---
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

  // Swipe Left to Delete (Red)
  const renderRightActions = (progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
    const scale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0.8],
      extrapolate: 'clamp',
    });
    
    return (
      <View style={styles.deleteSwipeContainer}>
        <Animated.View style={[styles.actionContent, { transform: [{ scale }] }]}>
          <Trash2 size={24} color={Colors.danger} />
          <Text style={styles.actionTextDanger}>DELETE</Text>
        </Animated.View>
      </View>
    );
  };

  // Swipe Right to Rematch (Green)
  const renderLeftActions = (progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
    const scale = dragX.interpolate({
      inputRange: [0, 80],
      outputRange: [0.8, 1],
      extrapolate: 'clamp',
    });
    
    return (
      <View style={styles.rematchSwipeContainer}>
        <Animated.View style={[styles.actionContent, { transform: [{ scale }] }]}>
          <RotateCcw size={24} color={Colors.text} />
          <Text style={styles.actionText}>REMATCH</Text>
        </Animated.View>
      </View>
    );
  };

  return (
    <View style={styles.cardWrapper}>
      <Swipeable
        renderRightActions={renderRightActions}
        renderLeftActions={isCompleted ? renderLeftActions : undefined}
        onSwipeableLeftOpen={isCompleted ? onRematch : undefined}
        onSwipeableRightOpen={confirmDelete} // <--- TRIGGERS DELETE ON FULL SWIPE
      >
        <TouchableOpacity 
          style={[GlobalStyles.card, { marginBottom: 0 }]} 
          activeOpacity={0.9} 
          onPress={onPress}
        >
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
                  <Text style={[styles.rowText, getNameStyle(p)]}>{p.name}</Text>
                  <Text style={[styles.rowText, getScoreStyle(p)]}>{p.totalScore}</Text>
                </View>
              ))
            ) : (
              // TEAM VIEW
              <View>
                {(() => {
                  if (match.isTeamScoreboard || match.gameType === 'tarneeb') {
                     const teamA = match.players[0];
                     const teamB = match.players[2]; 
                     return (
                      <View style={styles.tarneebRow}>
                        <View style={styles.nameColLeft}>
                            <Text style={styles.teamLabel}>Team A</Text>
                            <Text style={[styles.playerNameSmall, getNameStyle(teamA)]} numberOfLines={1}>{match.players[0].name}</Text>
                            <Text style={[styles.playerNameSmall, getNameStyle(teamA)]} numberOfLines={1}>{match.players[1]?.name}</Text>
                        </View>
                        <View style={styles.scoreCenter}>
                            <Text style={[styles.playerScoreLarge, getScoreStyle(teamA)]}>{teamA.totalScore}</Text>
                            <Text style={styles.vsText}>vs</Text>
                            <Text style={[styles.playerScoreLarge, getScoreStyle(teamB)]}>{teamB.totalScore}</Text>
                        </View>
                        <View style={styles.nameColRight}>
                            <Text style={styles.teamLabel}>Team B</Text>
                            <Text style={[styles.playerNameSmall, getNameStyle(teamB)]} numberOfLines={1}>{match.players[2].name}</Text>
                            <Text style={[styles.playerNameSmall, getNameStyle(teamB)]} numberOfLines={1}>{match.players[3]?.name}</Text>
                        </View>
                      </View>
                     );
                  }
                  return (
                    <>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                            <Text style={styles.teamLabel}>Team A</Text>
                            <Text style={styles.teamLabel}>Team B</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <View style={{ flex: 1, marginRight: 4 }}>
                              {[0, 1].map(i => match.players[i] && (
                                  <View key={i} style={styles.playerRow}>
                                      <Text style={[styles.playerNameLeft, getNameStyle(match.players[i])]}>{match.players[i].name}</Text>
                                      <View style={styles.scoreBox}><Text style={[styles.playerScoreSmall, getScoreStyle(match.players[i])]}>{match.players[i].totalScore}</Text></View>
                                  </View>
                              ))}
                          </View>
                          <Text style={[styles.rowText, { fontSize: 12, color: Colors.textMuted, marginHorizontal: 4 }]}>vs</Text>
                          <View style={{ flex: 1, marginLeft: 4, alignItems: 'flex-end' }}>
                              {[2, 3].map(i => match.players[i] && (
                                  <View key={i} style={styles.playerRow}>
                                      <View style={styles.scoreBox}><Text style={[styles.playerScoreSmall, getScoreStyle(match.players[i])]}>{match.players[i].totalScore}</Text></View>
                                      <Text style={[styles.playerNameRight, getNameStyle(match.players[i])]}>{match.players[i].name}</Text>
                                  </View>
                              ))}
                          </View>
                        </View>
                    </>
                  );
                })()}
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Swipeable>
    </View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: { marginBottom: Spacing.m, backgroundColor: 'transparent' },
  cardTimestamp: { color: Colors.textMuted, marginBottom: Spacing.m },
  cardInner: { backgroundColor: Colors.surfaceInner, borderRadius: 8, padding: Spacing.m, gap: 4 },
  rowText: { fontSize: 14 },
  teamLabel: { color: Colors.textSecondary, fontSize: 10, textTransform: 'uppercase', fontWeight: 'bold' },
  playerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 4 },
  playerNameLeft: { fontSize: 13, flex: 1, textAlign: 'left', marginRight: 8 },
  playerNameRight: { fontSize: 13, flex: 1, textAlign: 'right', marginLeft: 8 },
  playerNameSmall: { fontSize: 13, marginBottom: 2 },
  scoreBox: { width: 40, alignItems: 'center', justifyContent: 'center' },
  playerScoreSmall: { fontWeight: "bold", fontSize: 14, color: Colors.text, textAlign: 'center' },
  playerScoreLarge: { fontWeight: "800", fontSize: 24, color: Colors.text },
  tarneebRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nameColLeft: { flex: 1, alignItems: 'flex-start' },
  nameColRight: { flex: 1, alignItems: 'flex-end' },
  scoreCenter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', minWidth: 80, gap: 8 },
  vsText: { fontSize: 12, color: Colors.textMuted, fontWeight: '600' },
  
  // Both Swipe Actions are now 100% width containers
  deleteSwipeContainer: { 
    justifyContent: 'center', 
    alignItems: 'center', 
    width: '100%', 
    height: '100%', 
    backgroundColor: 'rgba(255, 82, 82, 0.1)', 
    borderRadius: 16 
  },
  rematchSwipeContainer: { 
    justifyContent: 'center', 
    alignItems: 'center', 
    width: '100%', 
    height: '100%', 
    backgroundColor: 'rgba(15, 157, 88, 0.1)', 
    borderRadius: 16 
  },
  
  actionContent: { justifyContent: 'center', alignItems: 'center' },
  actionText: { color: Colors.text, fontSize: 10, fontWeight: 'bold', marginTop: 4 },
  actionTextDanger: { color: Colors.danger, fontSize: 10, fontWeight: 'bold', marginTop: 4 },
});