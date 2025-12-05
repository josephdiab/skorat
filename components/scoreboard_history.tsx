import { ChevronDown, ChevronUp, Edit2 } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import {
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { Colors, GlobalStyles, Spacing } from "../constants/theme";
import { Player, RoundHistory } from "../constants/types";

// Enable LayoutAnimation for Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

type ScoreboardHistoryProps = {
  players: Player[];
  history: RoundHistory[];
  isExpanded: boolean;
  toggleExpand: () => void;
  renderScoreExtra?: (player: Player) => React.ReactNode;
  onEditRound?: (roundIndex: number) => void;
  isTeamScoreboard?: boolean;
};

export const ScoreboardHistory: React.FC<ScoreboardHistoryProps> = ({ 
  players, 
  history, 
  isExpanded, 
  toggleExpand,
  renderScoreExtra,
  onEditRound,
  isTeamScoreboard = false
}) => {
  const [isEditing, setIsEditing] = useState(false);

  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    toggleExpand();
    if (isExpanded) setIsEditing(false);
  };

  const getScoreStyle = (p: Player) => {
    if (p.isDanger) return { color: Colors.danger };
    if (p.totalScore < 0) return { color: Colors.danger };
    return { color: Colors.text };
  };

  // --- Display Logic ---
  // If Team Scoreboard (Tarneeb): Keep original order (A, B)
  // If NOT Team Scoreboard (400, Leekha): 
  //   Input State (Fixed): [P1(A), P2(A), P3(B), P4(B)]
  //   Output Visual:       [P1(A), P3(B), P2(A), P4(B)]
  const orderedPlayers = useMemo(() => {
    if (!isTeamScoreboard && players.length === 4) {
      // 0=A1, 1=A2, 2=B1, 3=B2
      // We want A1, B1, A2, B2 -> 0, 2, 1, 3
      return [players[0], players[2], players[1], players[3]];
    }
    return players;
  }, [players, isTeamScoreboard]);

  return (
    <View style={styles.scoreboardContainer}>
      <TouchableOpacity 
        style={styles.scoreboardHeader} 
        activeOpacity={0.95} 
        onPress={handleToggle}
      >
         {/* Header with Edit Button */}
         {isExpanded && (
           <View style={[GlobalStyles.rowBetween, { marginBottom: Spacing.m }]}>
             <Text style={GlobalStyles.textSmall}>MATCH HISTORY</Text>
             {history.length > 0 && (
               <TouchableOpacity 
                 style={[styles.editButton, isEditing && styles.editButtonActive]}
                 onPress={() => setIsEditing(!isEditing)}
               >
                 <Edit2 size={12} color={isEditing ? Colors.primary : Colors.textSecondary} />
                 <Text style={[styles.editText, isEditing && { color: Colors.primary }]}>
                   {isEditing ? "DONE" : "EDIT"}
                 </Text>
               </TouchableOpacity>
             )}
           </View>
         )}

         {/* Player Names Header (Ordered) */}
         <View style={styles.scoreGrid}>
            {orderedPlayers.map(p => (
              <Text key={p.id} style={styles.columnHeader} numberOfLines={1}>
                {p.name}
              </Text>
            ))}
         </View>
         
         {/* History Rows (Collapsible) */}
         {isExpanded && (
           <View>
             <View style={styles.divider} />
             <View style={{ maxHeight: 200 }}>
               <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
                 {history.map((h, index) => (
                   <TouchableOpacity 
                     key={index} 
                     style={[
                       styles.scoreGrid, 
                       { marginBottom: Spacing.s, paddingVertical: 4 },
                       isEditing && styles.historyRowEditing
                     ]}
                     disabled={!isEditing}
                     onPress={() => onEditRound?.(index)}
                     activeOpacity={0.7}
                   >
                     <View style={styles.roundNumContainer}>
                       {isEditing ? (
                         <Edit2 size={10} color={Colors.primary} />
                       ) : (
                         <Text style={styles.roundNum}>{index + 1}</Text>
                       )}
                     </View>

                     {/* Render cells in the same order as headers */}
                     {orderedPlayers.map(p => {
                       const val = h.playerDetails ? h.playerDetails[p.id]?.score : (h as any).scores?.[p.id] || 0;
                       return (
                         <Text key={p.id} style={styles.historyCell}>
                           {val}
                         </Text>
                       );
                     })}
                   </TouchableOpacity>
                 ))}
                 {history.length === 0 && (
                   <Text style={styles.emptyText}>No rounds recorded</Text>
                 )}
               </ScrollView>
             </View>
             <View style={styles.divider} />
           </View>
         )}

         {/* TOTAL SCORES (Ordered) */}
         <View style={[styles.scoreGrid, { marginTop: isExpanded ? Spacing.s : Spacing.xs }]}>
            {orderedPlayers.map(p => (
              <View key={p.id} style={styles.scoreCol}>
                <Text style={[styles.totalScore, getScoreStyle(p)]}>
                  {p.totalScore}
                </Text>
                {renderScoreExtra && renderScoreExtra(p)}
              </View>
            ))}
         </View>

         <View style={{ alignItems: 'center', marginTop: Spacing.s, opacity: 0.6 }}>
           {isExpanded ? (
             <ChevronUp size={20} color={Colors.textSecondary} />
           ) : (
             <ChevronDown size={20} color={Colors.textSecondary} />
           )}
         </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  scoreboardContainer: {
    paddingHorizontal: Spacing.l,
    paddingTop: Spacing.s,
    marginBottom: 4,
    zIndex: 10,
  },
  scoreboardHeader: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: Spacing.l,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  scoreGrid: { flexDirection: 'row', alignItems: 'center' },
  columnHeader: {
    flex: 1,
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: Spacing.s,
  },
  scoreCol: { flex: 1, alignItems: 'center' },
  totalScore: {
    textAlign: 'center',
    color: Colors.text,
    fontSize: 42,
    fontWeight: '800',
    lineHeight: 48,
  },
  historyCell: { flex: 1, textAlign: 'center', color: Colors.textMuted, fontSize: 15, fontWeight: '500' },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  editButtonActive: {
    backgroundColor: 'rgba(15, 157, 88, 0.15)',
    borderColor: Colors.primary,
    borderWidth: 1,
  },
  editText: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.m },
  roundNumContainer: {
    position: 'absolute',
    left: 0,
    width: 20,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roundNum: {
    fontSize: 10,
    color: Colors.textMuted,
    opacity: 0.5,
  },
  historyRowEditing: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 8,
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: Spacing.m,
    fontStyle: 'italic',
    opacity: 0.5,
    color: Colors.textMuted,
  },
});