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
import { Colors, FontSize, FontWeight, GlobalStyles, Radius, Shadows, Spacing } from "../constants/theme";
import { Player, RoundHistory } from "../constants/types";

// Enable LayoutAnimation for Android
if (Platform.OS === "android") {
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
  isTeamScoreboard = false,
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
  const orderedPlayers = useMemo(() => {
    if (!isTeamScoreboard && players.length === 4) {
      return [players[0], players[2], players[1], players[3]];
    }
    return players;
  }, [players, isTeamScoreboard]);

  // Key resolver:
  // - Leekha/400 store playerDetails by profileId (u_...)
  // - Tarneeb scoreboard uses virtual ids "A"/"B"
  const getHistoryKeyForPlayer = (p: Player) => p.profileId || p.id;

  const getRoundCellScore = (h: RoundHistory, p: Player): number => {
    const key = getHistoryKeyForPlayer(p);

    const details = h.playerDetails?.[key];
    if (details && typeof (details as any).score === "number") {
      return (details as any).score;
    }

    // Legacy fallback if you ever had `{ scores: { [id]: number } }`
    const legacy = (h as any).scores?.[p.id];
    if (typeof legacy === "number") return legacy;

    return 0;
  };

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
                <Edit2
                  size={12}
                  color={isEditing ? Colors.primary : Colors.textSecondary}
                />
                <Text style={[styles.editText, isEditing && { color: Colors.primary }]}>
                  {isEditing ? "DONE" : "EDIT"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Player Names Header (Ordered) */}
        <View style={styles.scoreGrid}>
          {orderedPlayers.map((p) => (
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
                      isEditing && styles.historyRowEditing,
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
                    {orderedPlayers.map((p) => {
                      const val = getRoundCellScore(h, p);
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
          {orderedPlayers.map((p) => (
            <View key={p.id} style={styles.scoreCol}>
              <Text style={[styles.totalScore, getScoreStyle(p)]}>{p.totalScore}</Text>
              {renderScoreExtra && renderScoreExtra(p)}
            </View>
          ))}
        </View>

        <View style={{ alignItems: "center", marginTop: Spacing.s, opacity: 0.6 }}>
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
    marginBottom: Spacing.xs,
    zIndex: 10,
  },
  scoreboardHeader: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.l,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.md,
  },
  scoreGrid: { flexDirection: "row", alignItems: "center" },
  columnHeader: {
    flex: 1,
    textAlign: "center",
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    textTransform: "uppercase",
    marginBottom: Spacing.s,
  },
  scoreCol: { flex: 1, alignItems: "center" },
  totalScore: {
    textAlign: "center",
    color: Colors.text,
    fontSize: FontSize.jumbo,
    fontWeight: FontWeight.extrabold,
    lineHeight: 48,
  },
  historyCell: {
    flex: 1,
    textAlign: "center",
    color: Colors.textMuted,
    fontSize: 15,
    fontWeight: FontWeight.normal,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.xs,
    backgroundColor: Colors.surfaceLight,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.s,
  },
  editButtonActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
    borderWidth: 1,
  },
  editText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    marginLeft: Spacing.xs,
  },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.m },
  roundNumContainer: {
    position: "absolute",
    left: 0,
    width: 20,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  roundNum: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    opacity: 0.5,
  },
  historyRowEditing: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: Radius.sm,
  },
  emptyText: {
    textAlign: "center",
    marginVertical: Spacing.m,
    fontStyle: "italic",
    opacity: 0.5,
    color: Colors.textMuted,
  },
});
