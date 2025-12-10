import { LinearGradient } from 'expo-linear-gradient';
import { RotateCcw, Trophy } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ConfettiCannon from 'react-native-confetti-cannon';
import { Colors } from "../constants/theme";

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
          <Trophy size={64} color="#FFD700" fill="#FFD700" />
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
          colors={['#0f9d58', '#0b7541']} // Green Gradient
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.button}
        >
          <RotateCcw size={20} color="#fff" />
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
    gap: 40,
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
    marginBottom: 24,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
    transform: [{ scale: 1.1 }],
  },
  title: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 4,
    marginBottom: 12,
  },
  winnerText: {
    color: Colors.text,
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 12,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 4,
    paddingHorizontal: 20,
  },
  badge: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  badgeText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  button: {
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
});