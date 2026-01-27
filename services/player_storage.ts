// --- START OF FILE: services\player_storage.ts ---
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENABLE_LOGS } from '../constants/config';
import { DEFAULT_AVATAR, UserProfile } from '../constants/types';
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
      // Comprehensive validation
      const validationErrors: string[] = [];

      // Validate profile object exists
      if (!profile || typeof profile !== 'object') {
        throw new Error("Profile must be a valid object");
      }

      // Validate id
      if (!profile.id) {
        validationErrors.push("Profile id is required");
      } else if (typeof profile.id !== 'string') {
        validationErrors.push("Profile id must be a string");
      } else if (profile.id.trim().length === 0) {
        validationErrors.push("Profile id cannot be empty");
      } else if (profile.id.length > 100) {
        validationErrors.push("Profile id is too long (max 100 characters)");
      }

      // Validate name
      if (!profile.name) {
        validationErrors.push("Profile name is required");
      } else if (typeof profile.name !== 'string') {
        validationErrors.push("Profile name must be a string");
      } else {
        const trimmedName = profile.name.trim();
        if (trimmedName.length === 0) {
          validationErrors.push("Profile name cannot be empty");
        } else if (trimmedName.length > 50) {
          validationErrors.push("Profile name is too long (max 50 characters)");
        } else if (trimmedName.length < 1) {
          validationErrors.push("Profile name must be at least 1 character");
        }
      }

      if (validationErrors.length > 0) {
        const errorMessage = `Profile validation failed: ${validationErrors.join("; ")}`;
        Logger.error("STORAGE", errorMessage, {
          profileId: profile.id,
          profileName: profile.name,
          errors: validationErrors,
        });
        throw new Error(errorMessage);
      }

      // Normalize the profile data
      const normalizedProfile: UserProfile = {
        id: profile.id.trim(),
        name: profile.name.trim(),
        avatar: profile.avatar || DEFAULT_AVATAR,
      };

      // Get existing profiles
      const profiles = await PlayerStorage.getAll();
      
      // Check if this is an update or create
      const existingIndex = profiles.findIndex(p => p.id === normalizedProfile.id);
      const isUpdate = existingIndex >= 0;

      // For new profiles, check for duplicate names (case-insensitive)
      if (!isUpdate) {
        const duplicateName = profiles.find(
          p => p.name.trim().toLowerCase() === normalizedProfile.name.toLowerCase()
        );
        if (duplicateName) {
          const errorMessage = `Profile with name "${normalizedProfile.name}" already exists with id: ${duplicateName.id}`;
          Logger.error("STORAGE", errorMessage, {
            newProfileId: normalizedProfile.id,
            existingProfileId: duplicateName.id,
            profileName: normalizedProfile.name,
          });
          throw new Error(errorMessage);
        }
      } else {
        // For updates, check if name change would create a duplicate
        const existingProfile = profiles[existingIndex];
        if (existingProfile.name.trim().toLowerCase() !== normalizedProfile.name.toLowerCase()) {
          const duplicateName = profiles.find(
            (p, idx) => idx !== existingIndex && 
            p.name.trim().toLowerCase() === normalizedProfile.name.toLowerCase()
          );
          if (duplicateName) {
            const errorMessage = `Cannot update profile: name "${normalizedProfile.name}" already exists with id: ${duplicateName.id}`;
            Logger.error("STORAGE", errorMessage, {
              profileId: normalizedProfile.id,
              existingProfileId: duplicateName.id,
              profileName: normalizedProfile.name,
            });
            throw new Error(errorMessage);
          }
        }
      }

      // Update or add profile
      if (isUpdate) {
        profiles[existingIndex] = normalizedProfile;
        Logger.info("STORAGE", `Updated player profile: ${normalizedProfile.name} (${normalizedProfile.id})`);
      } else {
        profiles.push(normalizedProfile);
        Logger.info("STORAGE", `Created player profile: ${normalizedProfile.name} (${normalizedProfile.id})`);
      }

      // Validate that profiles array is still valid before saving
      try {
        const testSerialization = JSON.stringify(profiles);
        if (testSerialization.length > 10 * 1024 * 1024) { // 10MB limit
          throw new Error("Profile data exceeds 10MB limit");
        }
      } catch (serializationError: any) {
        Logger.error("STORAGE", "Failed to serialize profiles before saving", {
          error: serializationError?.message || String(serializationError),
          profileCount: profiles.length,
        });
        throw new Error(`Failed to validate profile data: ${serializationError?.message || String(serializationError)}`);
      }

      // Save to storage
      await AsyncStorage.setItem(PLAYER_KEY, JSON.stringify(profiles));

      // Verify the save was successful by reading back
      const verifyProfiles = await PlayerStorage.getAll();
      const savedProfile = verifyProfiles.find(p => p.id === normalizedProfile.id);
      if (!savedProfile) {
        throw new Error("Profile was not saved correctly - verification failed");
      }

      return normalizedProfile;
    } catch (e: any) {
      // Don't re-log if it's already our validation error
      if (!e.message?.includes("validation failed") && 
          !e.message?.includes("already exists") &&
          !e.message?.includes("Failed to validate")) {
        Logger.error("STORAGE", `Failed to save player profile: ${profile?.name || 'unknown'}`, {
          error: e?.message || String(e),
          profileId: profile?.id,
          profileName: profile?.name,
        });
      }
      // Re-throw validation errors as-is, wrap others
      if (e.message?.includes("validation failed") || 
          e.message?.includes("already exists") ||
          e.message?.includes("Failed to validate")) {
        throw e;
      }
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
        avatar: DEFAULT_AVATAR,
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

  // Search profiles by name prefix (for autocomplete)
  searchByPrefix: async (prefix: string, limit: number = 5): Promise<UserProfile[]> => {
    if (!prefix.trim()) return [];

    try {
      const all = await PlayerStorage.getAll();
      const searchTerm = prefix.trim().toLowerCase();

      return all
        .filter(p => p.name.toLowerCase().includes(searchTerm))
        .slice(0, limit);
    } catch (e: any) {
      Logger.error("STORAGE", `Failed to search profiles by prefix "${prefix}"`, {
        error: e?.message || String(e),
      });
      return [];
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