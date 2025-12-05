// --- START OF FILE: app/rules/leekha.tsx ---
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GameHeader } from "../../components/game_header";
import { Colors, GlobalStyles, Spacing } from "../../constants/theme";

export default function RulesLeekhaScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={GlobalStyles.container} edges={['top', 'left', 'right']}>
      <GameHeader 
        title="LEEKHA RULES" 
        subtitle="Standard Rules" 
        onBack={() => router.back()} 
      />
      
      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Setup */}
        <View style={styles.section}>
            <Text style={styles.header}>Setup & Deal</Text>
            <View style={styles.bulletList}>
                <Text style={styles.bullet}>• Each player is dealt <Text style={styles.bold}>13 cards</Text> (one at a time).</Text>
                <Text style={styles.bullet}>• <Text style={styles.bold}>Passing Phase:</Text> Select 3 cards to pass to the right.</Text>
                <Text style={styles.bullet}>• The player to the <Text style={styles.bold}>dealer&apos;s right</Text> starts.</Text>
                <Text style={styles.bullet}>• <Text style={styles.bold}>Next Dealer:</Text> Whoever collects the <Text style={styles.bold}>Q♠</Text> becomes the dealer.</Text>
            </View>
        </View>

        {/* Objective */}
        <View style={styles.section}>
            <Text style={styles.header}>Objective</Text>
            <Text style={styles.text}>
                The goal is to <Text style={styles.bold}>avoid collecting points</Text>. 
                {"\n\n"}
                The game is played until a player reaches <Text style={styles.bold}>101 points</Text>. That player (and their partner) loses immediately.
            </Text>
        </View>

        {/* Scoring */}
        <View style={styles.section}>
            <Text style={styles.header}>Penalty Points</Text>
            <Text style={styles.text}>
                There are exactly <Text style={styles.bold}>36 points</Text> in every round.
            </Text>

            <View style={[styles.table, { marginTop: 12 }]}>
                <View style={styles.tableHeader}>
                    <Text style={styles.th}>Card</Text>
                    <Text style={styles.th}>Value</Text>
                </View>
                <TableRow col1="♥ Any Heart" col2="1 Point" />
                <TableRow col1="♦ 10 of Diamonds" col2="10 Points" />
                <TableRow col1="♠ Queen of Spades" col2="13 Points" />
            </View>
        </View>

        {/* Gameplay */}
        <View style={styles.section}>
            <Text style={styles.header}>Gameplay Rules</Text>
            <Text style={styles.text}>
                Players must follow the suit of the first card played.
            </Text>
            
            <View style={[styles.summaryBox, { alignItems: 'flex-start' }]}>
                <Text style={[styles.summaryText, { fontWeight: 'bold', marginBottom: 4 }]}>
                    If you do NOT have the suit led:
                </Text>
                <Text style={styles.summaryText}>
                    1. You <Text style={styles.bold}>MUST</Text> play a &quot;Leekha&quot; (<Text style={styles.red}>10♦</Text> or <Text style={styles.bold}>Q♠</Text>) if you have one.
                </Text>
                <Text style={styles.summaryText}>
                    2. If you don&apos;t have a Leekha, you may discard any card.
                </Text>
            </View>

            <Text style={[styles.text, { marginTop: 12 }]}>
                The trick is won by the <Text style={styles.bold}>highest card</Text> of the suit led. That player leads the next trick.
            </Text>
        </View>

        {/* Winning */}
        <View style={styles.section}>
            <Text style={styles.header}>Game Over</Text>
            <Text style={styles.text}>
                The game ends the moment a player&apos;s total score reaches <Text style={styles.bold}>101 or more</Text>.
            </Text>
            <Text style={[styles.text, { marginTop: 8 }]}>
                <Text style={styles.red}>LOSE:</Text> The team containing the player who reached 101.
            </Text>
            <Text style={styles.text}>
                <Text style={styles.green}>WIN:</Text> The opposing team.
            </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const TableRow = ({ col1, col2 }: any) => (
    <View style={styles.tableRow}>
        <Text style={styles.td}>{col1}</Text>
        <Text style={[styles.td, { color: Colors.danger, fontWeight: 'bold' }]}>{col2}</Text>
    </View>
);

const styles = StyleSheet.create({
  content: {
    padding: Spacing.l,
    paddingBottom: 40,
  },
  section: {
    marginBottom: Spacing.xl,
    backgroundColor: Colors.surface,
    padding: Spacing.l,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    color: Colors.primary,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: Spacing.m,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  text: {
    color: Colors.text,
    fontSize: 15,
    lineHeight: 24,
  },
  bold: {
    fontWeight: 'bold',
    color: Colors.text,
  },
  green: { color: Colors.primary, fontWeight: 'bold' },
  red: { color: Colors.danger, fontWeight: 'bold' },
  table: {
    backgroundColor: Colors.surfaceInner,
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceLight,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  th: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  td: {
    flex: 1,
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  summaryBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 82, 82, 0.3)',
  },
  summaryText: {
    color: Colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  bulletList: {
    marginTop: 4,
    gap: 8,
  },
  bullet: {
    color: Colors.text,
    fontSize: 15,
    lineHeight: 22,
  }
});
// --- END OF FILE: app/rules/leekha.tsx ---