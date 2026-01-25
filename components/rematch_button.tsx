import { LinearGradient } from 'expo-linear-gradient';
import { RotateCcw, Trophy } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ConfettiCannon from 'react-native-confetti-cannon';
import { Colors, FontSize, FontWeight, Radius, Shadows, Spacing } from "../constants/theme";

type GameOverScreenProps = {
  winners: string;
  onRematch: () => void;
};

export const GameOverScreen: React.FC<GameOverScreenProps> = ({ winners, onRematch }) => {
  return (
    <View style={styles.container}>
      {/* 1. Regular Confetti Cannon */}
      <ConfettiCannon
        count={200}
        origin={{x: -20, y: 0}}
        autoStart={true}
        fadeOut={true}
        fallSpeed={3000}
      />

      {/* 2. Winner Card */}
      <View style={styles.card}>
        <View style={styles.trophyGlow} />
        <View style={styles.trophyContainer}>
          <Trophy size={64} color={Colors.gold} fill={Colors.gold} />
        </View>

        <Text style={styles.title}>CONGRATULATIONS</Text>
        <Text style={styles.winnerText}>{winners}</Text>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>WON THE MATCH</Text>
        </View>
      </View>

      {/* 3. Modern Rematch Button */}
      <TouchableOpacity activeOpacity={0.8} onPress={onRematch}>
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.button}
        >
          <RotateCcw size={20} color={Colors.white} />
          <Text style={styles.buttonText}>START REMATCH</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xxxl,
    paddingBottom: 50,
  },
  card: {
    alignItems: 'center',
    zIndex: 1,
  },
  trophyGlow: {
    position: 'absolute',
    width: 150,
    height: 150,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderRadius: 75,
    top: -40,
  },
  trophyContainer: {
    marginBottom: Spacing.xl,
    ...Shadows.glow(Colors.gold),
    transform: [{ scale: 1.1 }],
  },
  title: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    letterSpacing: 4,
    marginBottom: Spacing.m,
  },
  winnerText: {
    color: Colors.text,
    fontSize: FontSize.hero,
    fontWeight: FontWeight.black,
    textAlign: 'center',
    marginBottom: Spacing.m,
    textShadowColor: Colors.overlayDark,
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 4,
    paddingHorizontal: Spacing.xl,
  },
  badge: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: Spacing.l,
    paddingVertical: 6,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  badgeText: {
    color: Colors.gold,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.extrabold,
    letterSpacing: 1,
  },
  button: {
    paddingVertical: Spacing.l,
    paddingHorizontal: Spacing.xxxl,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.m,
    zIndex: 10,
    ...Shadows.lg,
    shadowColor: Colors.primary,
    borderWidth: 1,
    borderColor: Colors.overlayLight,
  },
  buttonText: {
    color: Colors.white,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
    letterSpacing: 1,
  },
});