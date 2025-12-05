// --- START OF FILE: app/rules/tarneeb.tsx ---
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GameHeader } from "../../components/game_header";
import { Colors, GlobalStyles, Spacing } from "../../constants/theme";

export default function RulesTarneebScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={GlobalStyles.container} edges={['top', 'left', 'right']}>
      <GameHeader 
        title="TARNEEB RULES" 
        subtitle="Standard Rules" 
        onBack={() => router.back()} 
      />
      
      <ScrollView contentContainerStyle={styles.content}>
        
        {/* 1. Objective */}
        <View style={styles.section}>
            <Text style={styles.header}>Objective</Text>
            <Text style={styles.text}>
                Two teams of two partners compete to win <Text style={styles.bold}>Tricks</Text>. The goal is to reach the score limit (usually <Text style={styles.bold}>31</Text> or <Text style={styles.bold}>41</Text>).
            </Text>
        </View>

        {/* 2. Setup & Deal */}
        <View style={styles.section}>
            <Text style={styles.header}>Setup & Deal</Text>
            <View style={styles.bulletList}>
                <Text style={styles.bullet}>• Each player is dealt <Text style={styles.bold}>13 cards</Text>.</Text>
                <Text style={styles.bullet}>• All 13 cards are dealt at once.</Text>
                <Text style={styles.bullet}>• After bidding, the <Text style={styles.bold}>Highest Bidder</Text> starts the game.</Text>
            </View>
        </View>

        {/* 3. Card Ranking */}
        <View style={styles.section}>
            <Text style={styles.header}>Card Ranking</Text>
            <Text style={styles.text}>
                A standard 52-card deck is used. Ranking from high to low:
            </Text>
            <View style={styles.rankBox}>
                <Text style={styles.rankText}>A  K  Q  J  10  9  8  7  6  5  4  3  2</Text>
            </View>
            <Text style={styles.note}>Play proceeds counter-clockwise.</Text>
        </View>

        {/* 4. Bidding */}
        <View style={styles.section}>
            <Text style={styles.header}>Bidding</Text>
            <Text style={styles.text}>
                Players bid on how many tricks their team can win (minimum <Text style={styles.bold}>7</Text>, maximum <Text style={styles.bold}>13</Text>).
                {"\n\n"}
                The highest bidder becomes the <Text style={styles.bold}>Caller</Text> and chooses the Trump Suit (Tarneeb).
            </Text>
        </View>

        {/* 5. Gameplay */}
        <View style={styles.section}>
            <Text style={styles.header}>Gameplay</Text>
            <View style={styles.bulletList}>
                <Text style={styles.bullet}>• The Caller leads the first trick.</Text>
                <Text style={styles.bullet}>• Players must follow suit if able.</Text>
                <Text style={styles.bullet}>• If void in the suit led, you may play a Trump (to win) or discard.</Text>
                <Text style={styles.bullet}>• The highest card of the led suit wins, unless a Trump is played.</Text>
            </View>
        </View>

        {/* 6. Scoring */}
        <View style={styles.section}>
            <Text style={styles.header}>Scoring</Text>
            <Text style={styles.text}>
                Points are calculated based on the Caller&apos;s bid and the actual tricks taken.
            </Text>

            <View style={[styles.table, { marginTop: 12 }]}>
                <View style={styles.tableHeader}>
                    <Text style={styles.th}>Scenario</Text>
                    <Text style={styles.th}>Points Awarded</Text>
                </View>
                <TableRow col1="Caller Wins" col2="+ Tricks Taken" />
                <TableRow col1="Caller Fails" col2="- Bid Amount" />
                <TableRow col1="Opponents" col2="+ Tricks Taken" />
            </View>
            
            <Text style={[styles.note, { marginTop: 12 }]}>
                Example: If you bid 7 and take 9 tricks, you get +9. If you bid 7 and take 6, you get -7.
            </Text>
        </View>

        {/* 7. Winning */}
        <View style={styles.section}>
            <Text style={styles.header}>Winning the Game</Text>
            <Text style={styles.text}>
                The first team to reach the score limit wins.
            </Text>
            <Text style={[styles.text, { marginTop: 8 }]}>
                If both teams pass the limit in the same round, the team with the <Text style={styles.bold}>highest score</Text> wins. If tied, play continues.
            </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const TableRow = ({ col1, col2 }: any) => (
    <View style={styles.tableRow}>
        <Text style={styles.td}>{col1}</Text>
        <Text style={styles.td}>{col2}</Text>
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
  rankBox: {
    backgroundColor: Colors.surfaceInner,
    padding: 12,
    borderRadius: 8,
    marginVertical: 12,
    alignItems: 'center',
  },
  rankText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  note: {
    color: Colors.textMuted,
    fontSize: 13,
    fontStyle: 'italic',
  },
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
  bulletList: {
    marginTop: 8,
    gap: 4,
  },
  bullet: {
    color: Colors.text,
    fontSize: 15,
    lineHeight: 22,
  }
});
// --- END OF FILE: app/rules/tarneeb.tsx ---