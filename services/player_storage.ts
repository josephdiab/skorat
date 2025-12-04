// --- START OF FILE: services\player_storage.ts ---
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENABLE_LOGS } from '../constants/config'; // Import Config
import { UserProfile } from '../constants/types';

const PLAYER_KEY = '@skorat_players_v1';

export const PlayerStorage = {
  // Get all available profiles
  getAll: async (): Promise<UserProfile[]> => {
    try {
      const json = await AsyncStorage.getItem(PLAYER_KEY);
      return json ? JSON.parse(json) : [];
    } catch (e) { return []; }
  },

  // 1. Check if name exists in memory (Case Insensitive + Trimmed)
  findByName: async (name: string): Promise<UserProfile | undefined> => {
    const all = await PlayerStorage.getAll();
    const searchName = name.trim().toLowerCase();
    
    return all.find(p => p.name.trim().toLowerCase() === searchName);
  },

  // Create or Update a profile
  save: async (profile: UserProfile) => {
    const profiles = await PlayerStorage.getAll();
    const index = profiles.findIndex(p => p.id === profile.id);
    
    if (index >= 0) {
      profiles[index] = profile;
    } else {
      profiles.push(profile);
    }
    
    await AsyncStorage.setItem(PLAYER_KEY, JSON.stringify(profiles));
  },

  // 2. Helper used by New Game Screen
  // If name matches existing profile (insensitive), return that ID.
  // Otherwise, create a new profile.
  getOrCreate: async (name: string): Promise<UserProfile> => {
    const cleanName = name.trim();
    if (!cleanName) throw new Error("Name cannot be empty");

    // CHECK MEMORY FIRST
    const existing = await PlayerStorage.findByName(cleanName);
    if (existing) {
      if (ENABLE_LOGS) console.log(`[PlayerStorage] Found existing profile for "${cleanName}": ${existing.id}`);
      return existing;
    }

    // CREATE NEW IF NOT FOUND
    const newProfile: UserProfile = {
      id: `u_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      name: cleanName,
    };
    await PlayerStorage.save(newProfile);
    if (ENABLE_LOGS) console.log(`[PlayerStorage] Created new profile for "${cleanName}": ${newProfile.id}`);
    return newProfile;
  },

  // --- DEBUG HELPER ---
  // Call this to manually wipe the phonebook
  clearAll: async () => {
    try {
      if (ENABLE_LOGS) console.log("[PlayerStorage] Clearing ALL Profiles...");
      await AsyncStorage.removeItem(PLAYER_KEY);
      if (ENABLE_LOGS) console.log("[PlayerStorage] Profiles Cleared");
    } catch (e) {
      console.error(e);
    }
  }
};
// --- END OF FILE: services\player_storage.ts ---