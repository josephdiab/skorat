// --- START OF FILE: app/rules/400.tsx ---
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GameHeader } from "../../components/game_header";
import { Colors, GlobalStyles, Spacing } from "../../constants/theme";

const Rules400Screen = () => {
  const router = useRouter();

  return (
    <SafeAreaView style={GlobalStyles.container} edges={['top', 'left', 'right']}>
      <GameHeader 
        title="400 RULES" 
        subtitle="Standard Lebanese Rules" 
        onBack={() => router.back()} 
      />
      
      <ScrollView contentContainerStyle={styles.content}>
        
        {/* 1. Objective */}
        <View style={styles.section}>
            <Text style={styles.header}>Objective</Text>
            <Text style={styles.text}>
                Two teams of two partners sit opposite each other. The goal is to reach <Text style={styles.bold}>41 points</Text> by winning tricks.
            </Text>
        </View>

        {/* 2. Setup & Deal */}
        <View style={styles.section}>
            <Text style={styles.header}>Setup & Deal</Text>
            <View style={styles.bulletList}>
                <Text style={styles.bullet}>• Each player is dealt <Text style={styles.bold}>13 cards</Text>.</Text>
                <Text style={styles.bullet}>• Dealing method: 1 card each, then batches of 2 or 3 (dealer&apos;s choice).</Text>
                <Text style={styles.bullet}>• The player to the <Text style={styles.bold}>dealer&apos;s right</Text> starts.</Text>
                <Text style={styles.bullet}>• The dealer role moves one place to the right after every round.</Text>
            </View>
        </View>

        {/* 3. Card Ranking */}
        <View style={styles.section}>
            <Text style={styles.header}>Card Ranking</Text>
            <Text style={styles.text}>
                Cards are ranked low to high:
            </Text>
            <View style={styles.rankBox}>
                <Text style={styles.rankText}>2  3  4  5  6  7  8  9  10  J  Q  K  A</Text>
            </View>
            <Text style={styles.note}>Hearts (♥) are always the trump suit.</Text>
        </View>

        {/* 4. Bidding */}
        <View style={styles.section}>
            <Text style={styles.header}>Bidding</Text>
            <Text style={styles.text}>
                Every round, each player must bid between <Text style={styles.bold}>2</Text> and <Text style={styles.bold}>13</Text> tricks.
                {"\n\n"}
                <Text style={styles.muted}>• If total table bids are less than 11, cards are redealt.</Text>
            </Text>
            
            <View style={styles.table}>
                <View style={styles.tableHeader}>
                    <Text style={styles.th}>Player Score</Text>
                    <Text style={styles.th}>Min Bid</Text>
                    <Text style={styles.th}>Table Total</Text>
                </View>
                <TableRow col1="< 30" col2="2" col3="11" />
                <TableRow col1="30 - 39" col2="3" col3="12" />
                <TableRow col1="40 - 49" col2="4" col3="13" />
                <TableRow col1="50 +" col2="5" col3="14" />
            </View>
        </View>

        {/* 5. Scoring */}
        <View style={styles.section}>
            <Text style={styles.header}>Scoring Values</Text>
            <Text style={styles.text}>
                If you win your bid: <Text style={styles.green}>+ Points</Text>{"\n"}
                If you fail your bid: <Text style={styles.red}>- Points</Text>
            </Text>

            <View style={[styles.table, { marginTop: 12 }]}>
                <View style={styles.tableHeader}>
                    <Text style={styles.th}>Bid</Text>
                    <Text style={styles.th}>Value</Text>
                </View>
                <TableRow col1="2, 3, 4" col2="Face Value (2, 3, 4)" />
                <TableRow col1="5" col2="10 (or 5 if score ≥ 30)" />
                <TableRow col1="6" col2="12 (or 6 if score ≥ 30)" />
                <TableRow col1="7" col2="14" />
                <TableRow col1="8" col2="16" />
                <TableRow col1="9" col2="27" />
                <TableRow col1="10 - 13" col2="40" />
            </View>
        </View>

        {/* 6. Winning */}
        <View style={styles.section}>
            <Text style={styles.header}>Winning the Game</Text>
            <Text style={styles.text}>
                A team wins when:
            </Text>
            <View style={styles.bulletList}>
                <Text style={styles.bullet}>• A player reaches <Text style={styles.bold}>41 points</Text>.</Text>
                <Text style={styles.bullet}>• Their partner&apos;s score is <Text style={styles.bold}>greater than 0</Text>.</Text>
            </View>
            <Text style={[styles.text, { marginTop: 8 }]}>
                If players from opposing teams both pass 41 in the same round, the <Text style={styles.bold}>highest score wins</Text>.
            </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const TableRow = ({ col1, col2, col3 }: any) => (
    <View style={styles.tableRow}>
        <Text style={styles.td}>{col1}</Text>
        <Text style={styles.td}>{col2}</Text>
        {col3 && <Text style={styles.td}>{col3}</Text>}
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
  muted: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontStyle: 'italic',
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

export default Rules400Screen;
// --- END OF FILE: app/rules/400.tsx ---