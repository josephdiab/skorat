import * as Clipboard from "expo-clipboard"; // Requires: npx expo install expo-clipboard
import { Share } from "react-native";
import { GameState, UserProfile } from "../constants/types";
import { GameStorage } from "./game_storage";
import { PlayerStorage } from "./player_storage";
import { Migrations } from "./migrations";
import { Logger } from "./logger";

export type BackupData = {
  version: string;
  exportDate: string;
  schemaVersion: number;
  games: GameState[];
  profiles: UserProfile[];
  metadata: {
    totalGames: number;
    totalProfiles: number;
    gameTypes: Record<string, number>;
    profileIdsInGames: string[];
    orphanedProfileIds: string[];
  };
};

export const BackupService = {
  /**
   * Get all data as a formatted JSON string
   * Includes both games and player profiles for complete backup
   */
  exportData: async (): Promise<string> => {
    try {
      const games = await GameStorage.getAllFull();
      const profiles = await PlayerStorage.getAll();

      // Collect all profileIds referenced in games
      const profileIdsInGames = new Set<string>();
      const gameTypeCounts: Record<string, number> = {};

      games.forEach((game) => {
        // Count game types
        gameTypeCounts[game.gameType] = (gameTypeCounts[game.gameType] || 0) + 1;

        // Collect profileIds from players
        game.players?.forEach((player) => {
          if (player.profileId) {
            profileIdsInGames.add(player.profileId);
          }
        });

        // Collect profileIds from round history (for partnerProfileId in tarneeb)
        game.history?.forEach((round) => {
          if (round.playerDetails) {
            Object.values(round.playerDetails).forEach((details) => {
              if (details && typeof details === 'object' && 'partnerProfileId' in details) {
                const partnerId = (details as any).partnerProfileId;
                if (partnerId && typeof partnerId === 'string') {
                  profileIdsInGames.add(partnerId);
                }
              }
            });
          }
        });
      });

      // Find orphaned profileIds (referenced in games but not in profiles)
      const profileIdsSet = new Set(profiles.map(p => p.id));
      const orphanedProfileIds = Array.from(profileIdsInGames).filter(
        id => !profileIdsSet.has(id)
      );

      const backupData: BackupData = {
        version: "1.0",
        exportDate: new Date().toISOString(),
        schemaVersion: 2, // CURRENT_SCHEMA_VERSION
        games,
        profiles,
        metadata: {
          totalGames: games.length,
          totalProfiles: profiles.length,
          gameTypes: gameTypeCounts,
          profileIdsInGames: Array.from(profileIdsInGames),
          orphanedProfileIds,
        },
      };

      // Validate export structure
      const validationErrors: string[] = [];

      // Check that all games have required fields for merging
      games.forEach((game, index) => {
        if (!game.instanceId && !game.id) {
          validationErrors.push(`Game ${index}: Missing instanceId or id`);
        }
        if (!game.players || !Array.isArray(game.players)) {
          validationErrors.push(`Game ${index}: Missing or invalid players array`);
        } else {
          game.players.forEach((player, pIndex) => {
            if (!player.profileId) {
              validationErrors.push(`Game ${index}, Player ${pIndex}: Missing profileId`);
            }
          });
        }
        if (!game.history || !Array.isArray(game.history)) {
          validationErrors.push(`Game ${index}: Missing or invalid history array`);
        }
      });

      // Check that all profiles have required fields
      profiles.forEach((profile, index) => {
        if (!profile.id) {
          validationErrors.push(`Profile ${index}: Missing id`);
        }
        if (!profile.name) {
          validationErrors.push(`Profile ${index}: Missing name`);
        }
      });

      if (validationErrors.length > 0) {
        Logger.error("STORAGE", "Backup export validation failed", {
          errors: validationErrors,
          gameCount: games.length,
          profileCount: profiles.length,
        });
        // Still export, but log the issues
      }

      if (orphanedProfileIds.length > 0) {
        Logger.error("STORAGE", "Backup export contains orphaned profileIds", {
          orphanedCount: orphanedProfileIds.length,
          orphanedIds: orphanedProfileIds,
        });
      }

      Logger.info("STORAGE", "Backup export created", {
        gameCount: games.length,
        profileCount: profiles.length,
        orphanedProfileIds: orphanedProfileIds.length,
      });

      return JSON.stringify(backupData, null, 2);
    } catch (e: any) {
      Logger.error("STORAGE", "Failed to export backup data", {
        error: e?.message || String(e),
      });
      throw new Error(`Failed to export backup: ${e?.message || String(e)}`);
    }
  },

  /**
   * Copy JSON to user's clipboard
   */
  copyExportToClipboard: async () => {
    const json = await BackupService.exportData();
    await Clipboard.setStringAsync(json);
    return { success: true };
  },

  /**
   * Open system Share Sheet (Save to Files, Email, etc.)
   */
  shareExport: async () => {
    const json = await BackupService.exportData();
    await Share.share({ message: json, title: "Card Games Backup.json" });
  },

  /**
   * Import JSON string, validate, migrate, and overwrite data.
   * Supports both old format (array of games) and new format (BackupData object)
   */
  importData: async (jsonString: string) => {
    try {
      const raw = JSON.parse(jsonString);
      
      let games: GameState[] = [];
      let profiles: UserProfile[] = [];

      // Check if it's the new BackupData format
      if (raw && typeof raw === 'object' && 'games' in raw && 'profiles' in raw) {
        // New format with metadata
        const backupData = raw as BackupData;
        games = backupData.games || [];
        profiles = backupData.profiles || [];

        Logger.info("STORAGE", "Importing backup (new format)", {
          gameCount: games.length,
          profileCount: profiles.length,
          exportDate: backupData.exportDate,
        });
      } else if (Array.isArray(raw)) {
        // Old format - just array of games
        games = raw;
        Logger.info("STORAGE", "Importing backup (legacy format)", {
          gameCount: games.length,
        });
      } else {
        throw new Error("Invalid format: expected BackupData object or array of games");
      }

      // Basic Validation
      if (games.length > 0 && !games[0].gameType) {
        throw new Error("Invalid format: missing game data");
      }

      // Migrate & Sanitize games
      const cleanGames: GameState[] = games.map((g) => Migrations.migrate(g));
      
      // Validate and save profiles if provided
      if (profiles.length > 0) {
        // Validate profiles
        const invalidProfiles = profiles.filter(p => !p.id || !p.name);
        if (invalidProfiles.length > 0) {
          Logger.error("STORAGE", "Some profiles in backup are invalid", {
            invalidCount: invalidProfiles.length,
          });
          // Filter out invalid profiles
          profiles = profiles.filter(p => p.id && p.name);
        }

        // Save profiles
        for (const profile of profiles) {
          try {
            await PlayerStorage.save(profile);
          } catch (e: any) {
            // Log but continue - might be duplicate name which is okay
            Logger.error("STORAGE", `Failed to import profile: ${profile.name}`, {
              error: e?.message || String(e),
              profileId: profile.id,
            });
          }
        }
      }
      
      // Save games
      await GameStorage.overwriteAll(cleanGames);

      return { 
        success: true, 
        gameCount: cleanGames.length,
        profileCount: profiles.length,
      };
    } catch (e: any) {
      Logger.error("STORAGE", "Failed to import backup data", {
        error: e?.message ?? String(e),
      });
      return { success: false, error: e?.message ?? String(e) };
    }
  },
};