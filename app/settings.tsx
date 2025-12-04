import { useRouter } from "expo-router";
import { Database, Info, Trash2 } from "lucide-react-native";
import React from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GameHeader } from "../components/game_header";
import { Colors, GlobalStyles, Spacing } from "../constants/theme";
import { GameStorage } from "../services/game_storage";
import { PlayerStorage } from "../services/player_storage";

export default function SettingsScreen() {
  const router = useRouter();

  const handleClearData = () => {
    // 1. First Authorization
    Alert.alert(
      "Clear All Data",
      "Are you sure you want to delete all match history and player profiles? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          style: "destructive",
          onPress: requestSecondAuth
        }
      ]
    );
  };

  const requestSecondAuth = () => {
    // 2. Second Authorization (Double Check)
    Alert.alert(
      "Final Confirmation",
      "This will permanently wipe all data from the device. Are you absolutely sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Delete Everything",
          style: "destructive",
          onPress: performClear
        }
      ]
    );
  };

  const performClear = async () => {
    try {
      await GameStorage.clearAll();
      await PlayerStorage.clearAll();
      
      Alert.alert("Success", "All data has been cleared.", [
        { 
          text: "OK", 
          onPress: () => {
            // Navigate back to reset the state of the app
            // Using dismissAll() alone ensures a clean pop to the root without conflict
            router.dismissAll(); 
          } 
        }
      ]);
    } catch (e) {
      Alert.alert("Error", "Failed to clear data.");
    }
  };

  return (
    <SafeAreaView style={GlobalStyles.container} edges={['top', 'left', 'right']}>
      <GameHeader 
        title="SETTINGS" 
        subtitle="Preferences" 
        onBack={() => router.back()} 
      />
      
      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Data Section */}
        <Text style={styles.sectionTitle}>Storage</Text>
        <View style={styles.sectionCard}>
            <View style={styles.row}>
                <View style={styles.rowLeft}>
                    <View style={[styles.iconBox, styles.iconBoxNeutral]}>
                        <Database size={20} color={Colors.text} />
                    </View>
                    <View>
                        <Text style={styles.rowTitle}>Clear All Data</Text>
                        <Text style={styles.rowSubtitle}>Reset all games and players</Text>
                    </View>
                </View>
                
                {/* Trash Can Button on Right */}
                <TouchableOpacity 
                    style={styles.deleteIconButton} 
                    onPress={handleClearData}
                    activeOpacity={0.7}
                >
                    <Trash2 size={20} color={Colors.danger} />
                </TouchableOpacity>
            </View>
        </View>

        {/* About Section */}
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.sectionCard}>
            <View style={styles.row}>
                <View style={styles.rowLeft}>
                    <View style={[styles.iconBox, styles.iconBoxNeutral]}>
                        <Info size={20} color={Colors.text} />
                    </View>
                    <Text style={styles.rowTitle}>Version</Text>
                </View>
                <Text style={styles.versionText}>1.0.0</Text>
            </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.l,
  },
  sectionTitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: Spacing.s,
    marginTop: Spacing.m,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.l,
    backgroundColor: Colors.surface,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1, 
    marginRight: 10,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxNeutral: {
    backgroundColor: Colors.surfaceLight,
  },
  rowTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  rowSubtitle: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  versionText: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  // Style for the new icon-only button
  deleteIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20, // Circular
    backgroundColor: 'rgba(255, 82, 82, 0.1)', // Light Red Background
    alignItems: 'center',
    justifyContent: 'center',
  }
});