// --- START OF FILE: services\player_storage.ts ---
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENABLE_LOGS } from '../constants/config'; // Import Config
import { UserProfile } from '../constants/types';
import { Logger } from './logger';

const PLAYER_KEY = '@skorat_players_v1';

export const PlayerStorage = {
  // Get all available profiles
  getAll: async (): Promise<UserProfile[]> => {
    try {
      const json = await AsyncStorage.getItem(PLAYER_KEY);
      const profiles = json ? JSON.parse(json) : [];
      if (ENABLE_LOGS && profiles.length > 0) {
        Logger.info("STORAGE", `Loaded ${profiles.length} player profiles`);
      }
      return profiles;
    } catch (e: any) {
      Logger.error("STORAGE", "Failed to get all player profiles", {
        error: e?.message || String(e),
      });
      return [];
    }
  },

  // 1. Check if name exists in memory (Case Insensitive + Trimmed)
  findByName: async (name: string): Promise<UserProfile | undefined> => {
    const all = await PlayerStorage.getAll();
    const searchName = name.trim().toLowerCase();
    
    return all.find(p => p.name.trim().toLowerCase() === searchName);
  },

  // Create or Update a profile
  save: async (profile: UserProfile) => {
    try {
      if (!profile.id || !profile.name) {
        throw new Error("Profile must have id and name");
      }

      const profiles = await PlayerStorage.getAll();
      const index = profiles.findIndex(p => p.id === profile.id);
      const isUpdate = index >= 0;
      
      if (isUpdate) {
        profiles[index] = profile;
        Logger.info("STORAGE", `Updated player profile: ${profile.name} (${profile.id})`);
      } else {
        profiles.push(profile);
        Logger.info("STORAGE", `Created player profile: ${profile.name} (${profile.id})`);
      }
      
      await AsyncStorage.setItem(PLAYER_KEY, JSON.stringify(profiles));
    } catch (e: any) {
      Logger.error("STORAGE", `Failed to save player profile: ${profile.name || 'unknown'}`, {
        error: e?.message || String(e),
        profileId: profile.id,
      });
      throw new Error(`Failed to save player profile: ${e?.message || String(e)}`);
    }
  },

  // 2. Helper used by New Game Screen
  // If name matches existing profile (insensitive), return that ID.
  // Otherwise, create a new profile.
  getOrCreate: async (name: string): Promise<UserProfile> => {
    try {
      const cleanName = name.trim();
      if (!cleanName) {
        Logger.error("STORAGE", "Cannot create profile with empty name");
        throw new Error("Name cannot be empty");
      }

      // CHECK MEMORY FIRST
      const existing = await PlayerStorage.findByName(cleanName);
      if (existing) {
        Logger.info("STORAGE", `Found existing profile for "${cleanName}": ${existing.id}`);
        return existing;
      }

      // CREATE NEW IF NOT FOUND
      const newProfile: UserProfile = {
        id: `u_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        name: cleanName,
      };
      await PlayerStorage.save(newProfile);
      Logger.info("STORAGE", `Created new profile for "${cleanName}": ${newProfile.id}`);
      return newProfile;
    } catch (e: any) {
      // Re-throw if it's our validation error, otherwise wrap it
      if (e.message === "Name cannot be empty" || e.message?.includes("Failed to save")) {
        throw e;
      }
      Logger.error("STORAGE", `Failed to get or create profile for "${name}"`, {
        error: e?.message || String(e),
      });
      throw new Error(`Failed to get or create profile: ${e?.message || String(e)}`);
    }
  },

  // --- DEBUG HELPER ---
  // Call this to manually wipe the phonebook
  clearAll: async () => {
    try {
      Logger.info("STORAGE", "Clearing ALL player profiles...");
      await AsyncStorage.removeItem(PLAYER_KEY);
      Logger.info("STORAGE", "All player profiles cleared");
    } catch (e: any) {
      Logger.error("STORAGE", "Failed to clear player profiles", {
        error: e?.message || String(e),
      });
      throw new Error(`Failed to clear profiles: ${e?.message || String(e)}`);
    }
  }
};
// --- END OF FILE: services\player_storage.ts ---