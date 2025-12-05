// --- START OF FILE: app/rules/index.tsx ---
import { useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GameHeader } from "../../components/game_header";
import { Colors, GlobalStyles, Spacing } from "../../constants/theme";

export default function RulesMenuScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={GlobalStyles.container} edges={['top', 'left', 'right']}>
      <GameHeader 
        title="GAME RULES" 
        subtitle="How to Play" 
        onBack={() => router.back()} 
      />
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
            {/* 1. 400 */}
            <RuleLink 
                title="400" 
                subtitle="Partnership trick-taking game" 
                onPress={() => router.push("/rules/400")} 
            />
            
            <View style={styles.divider} />
            
            {/* 2. Leekha */}
            <RuleLink 
                title="Leekha" 
                subtitle="Avoid penalty cards" 
                onPress={() => router.push("/rules/leekha")}
            />

            <View style={styles.divider} />

            {/* 3. Tarneeb */}
            <RuleLink 
                title="Tarneeb" 
                subtitle="Standard partnership game" 
                onPress={() => router.push("/rules/tarneeb")}
            />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const RuleLink = ({ title, subtitle, onPress, disabled }: any) => (
    <TouchableOpacity 
        style={[styles.row, disabled && { opacity: 0.5 }]} 
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
    >
        <View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        <ChevronRight size={20} color={Colors.textMuted} />
    </TouchableOpacity>
);

const styles = StyleSheet.create({
  content: {
    padding: Spacing.l,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.l,
  },
  title: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.surfaceLight,
    marginLeft: Spacing.l,
  }
});
// --- END OF FILE: app/rules/index.tsx ---