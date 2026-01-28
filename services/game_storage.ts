import AsyncStorage from "@react-native-async-storage/async-storage";
import { GameState } from "../constants/types";
import { Logger } from "./logger";
import { CURRENT_SCHEMA_VERSION, Migrations } from "./migrations";
import { PlayerStorage } from "./player_storage";

const STORAGE_KEY = "card_games_data";

/**
 * Validates a game before saving to ensure data integrity
 */
function validateGame(game: GameState): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate schemaVersion
  if (game.schemaVersion === undefined || game.schemaVersion === null) {
    errors.push("Missing schemaVersion");
  } else if (typeof game.schemaVersion !== "number") {
    errors.push("schemaVersion must be a number");
  }

  // Validate required fields
  if (!game.instanceId && !game.id) {
    errors.push("Missing instanceId or id");
  }
  if (!game.gameType) {
    errors.push("Missing gameType");
  }
  if (!game.players || !Array.isArray(game.players)) {
    errors.push("Missing or invalid players array");
  }

  // Validate all players have profileId
  if (game.players && Array.isArray(game.players)) {
    game.players.forEach((player, index) => {
      if (!player.profileId) {
        errors.push(`Player at index ${index} (${player.name || "unnamed"}) is missing profileId`);
      }
      if (!player.id) {
        errors.push(`Player at index ${index} (${player.name || "unnamed"}) is missing id`);
      }
    });
  }

  // Validate history structure if present
  if (game.history && Array.isArray(game.history)) {
    game.history.forEach((round, roundIndex) => {
      if (!round.playerDetails || typeof round.playerDetails !== "object") {
        errors.push(`Round ${round.roundNum || roundIndex} is missing playerDetails`);
        return;
      }

      // Ensure all players have entries in round history
      game.players?.forEach((player) => {
        if (!round.playerDetails[player.profileId]) {
          errors.push(
            `Round ${round.roundNum || roundIndex} is missing details for player ${player.name} (profileId: ${player.profileId})`
          );
        }
      });
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export const GameStorage = {
  /**
   * Save or Update a Game (Always persists current schema)
   */
  save: async (game: GameState) => {
    try {
      // Ensure game has schemaVersion before validation
      const gameWithSchema = {
        ...game,
        schemaVersion: game.schemaVersion ?? CURRENT_SCHEMA_VERSION,
      };

      // Validate game structure before saving
      const validation = validateGame(gameWithSchema);
      if (!validation.valid) {
        const errorMessage = `Game validation failed: ${validation.errors.join("; ")}`;
        Logger.error("STORAGE", errorMessage, {
          instanceId: game.instanceId || game.id,
          gameType: game.gameType,
          errors: validation.errors,
        });
        throw new Error(errorMessage);
      }

      const existingData = await AsyncStorage.getItem(STORAGE_KEY);
      const rawGames: any[] = existingData ? JSON.parse(existingData) : [];

      // Ensure game is at current schema before saving
      const clean = Migrations.migrate(gameWithSchema);

      // Re-validate after migration to ensure migration didn't break anything
      const postMigrationValidation = validateGame(clean);
      if (!postMigrationValidation.valid) {
        const errorMessage = `Post-migration validation failed: ${postMigrationValidation.errors.join("; ")}`;
        Logger.error("STORAGE", errorMessage, {
          instanceId: clean.instanceId || clean.id,
          gameType: clean.gameType,
          errors: postMigrationValidation.errors,
        });
        throw new Error(errorMessage);
      }

      const index = rawGames.findIndex((g) => g.instanceId === clean.instanceId);
      if (index >= 0) rawGames[index] = clean;
      else rawGames.push(clean);

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(rawGames));
      Logger.info("STORAGE", `Game saved: ${clean.instanceId} (${clean.gameType})`);
    } catch (e: any) {
      Logger.error("STORAGE", `Failed to save game: ${game.instanceId || game.id}`, {
        error: e?.message || String(e),
        gameType: game.gameType,
        instanceId: game.instanceId,
      });
      // Re-throw to allow caller to handle if needed
      throw new Error(`Failed to save game: ${e?.message || String(e)}`);
    }
  },

  /**
   * Get a single game (FULL detail, automatically migrated)
   */
  get: async (instanceId: string): Promise<GameState | null> => {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      if (!json) {
        Logger.info("STORAGE", `Game not found: ${instanceId} (no data in storage)`);
        return null;
      }

      const rawGames: any[] = JSON.parse(json);
      // Support finding by instanceId OR id (legacy compatibility)
      const found = rawGames.find((g) => g.instanceId === instanceId || g.id === instanceId);
      if (!found) {
        Logger.info("STORAGE", `Game not found: ${instanceId}`);
        return null;
      }

      const migrated = Migrations.migrate(found);

      // Self-Healing: Persist the migration back to disk if it was old
      const needsSave = (found.schemaVersion || 0) < CURRENT_SCHEMA_VERSION;
      if (needsSave) {
        Logger.info("STORAGE", `Migrating game: ${instanceId} (v${found.schemaVersion || 0} -> v${CURRENT_SCHEMA_VERSION})`);
        const updated = rawGames.map((g) =>
          (g.instanceId === found.instanceId ? migrated : g)
        );
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }

      return migrated;
    } catch (e: any) {
      Logger.error("STORAGE", `Failed to get game: ${instanceId}`, {
        error: e?.message || String(e),
        instanceId,
      });
      return null;
    }
  },

  /**
   * Get All Games (Summary Only - for Home Screen performance)
   * Still runs migrations, but strips 'history' to save RAM.
   */
  getAll: async (): Promise<GameState[]> => {
    const full = await GameStorage.getAllFull();
    // Strip history for the UI list
    return full.map(({ history, ...rest }) => ({ ...rest, history: [] }));
  },

  /**
   * Get All Games (FULL DATA, Migrated)
   * Use this for Stats Engine and Backup
   */
  getAllFull: async (): Promise<GameState[]> => {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      if (!json) {
        Logger.info("STORAGE", "No games found in storage");
        return [];
      }

      const rawGames: any[] = JSON.parse(json);

      // Run migration on every single game
      const migratedGames = rawGames.map((g) => Migrations.migrate(g));

      // Self-Healing: If any game was old, save the whole batch back to disk
      const needsSave = rawGames.some((g) => (g.schemaVersion || 0) < CURRENT_SCHEMA_VERSION);
      if (needsSave) {
        Logger.info("STORAGE", `Migrating ${rawGames.length} games to schema v${CURRENT_SCHEMA_VERSION}`);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(migratedGames));
      }

      Logger.info("STORAGE", `Loaded ${migratedGames.length} games from storage`);
      return migratedGames;
    } catch (e: any) {
      Logger.error("STORAGE", "Failed to get all games", {
        error: e?.message || String(e),
      });
      return [];
    }
  },

  /**
   * Overwrite ALL games (Required for Restore feature)
   */
  overwriteAll: async (games: GameState[]) => {
    try {
      // Validate all games before overwriting
      const validationErrors: string[] = [];
      games.forEach((game, index) => {
        const gameWithSchema = {
          ...game,
          schemaVersion: game.schemaVersion ?? CURRENT_SCHEMA_VERSION,
        };
        const validation = validateGame(gameWithSchema);
        if (!validation.valid) {
          validationErrors.push(
            `Game ${index} (${game.instanceId || game.id}): ${validation.errors.join("; ")}`
          );
        }
      });

      if (validationErrors.length > 0) {
        const errorMessage = `Validation failed for ${validationErrors.length} game(s): ${validationErrors.join(" | ")}`;
        Logger.error("STORAGE", errorMessage, {
          gameCount: games.length,
          errorCount: validationErrors.length,
        });
        throw new Error(errorMessage);
      }

      // Sanitize before writing
      const clean = games.map((g) => Migrations.migrate({
        ...g,
        schemaVersion: g.schemaVersion ?? CURRENT_SCHEMA_VERSION,
      }));

      // Re-validate after migration
      clean.forEach((game, index) => {
        const validation = validateGame(game);
        if (!validation.valid) {
          validationErrors.push(
            `Post-migration Game ${index} (${game.instanceId || game.id}): ${validation.errors.join("; ")}`
          );
        }
      });

      if (validationErrors.length > 0) {
        const errorMessage = `Post-migration validation failed: ${validationErrors.join(" | ")}`;
        Logger.error("STORAGE", errorMessage, {
          gameCount: clean.length,
          errorCount: validationErrors.length,
        });
        throw new Error(errorMessage);
      }

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
      Logger.info("STORAGE", `Overwritten all games: ${clean.length} games saved`);
    } catch (e: any) {
      Logger.error("STORAGE", "Failed to overwrite all games", {
        error: e?.message || String(e),
        gameCount: games.length,
      });
      throw new Error(`Failed to overwrite games: ${e?.message || String(e)}`);
    }
  },

  /**
   * Remove a single game
   */
  remove: async (instanceId: string) => {
    try {
      const games = await GameStorage.getAllFull();
      const beforeCount = games.length;
      const filtered = games.filter((g) => g.instanceId !== instanceId && g.id !== instanceId);
      
      if (filtered.length === beforeCount) {
        Logger.info("STORAGE", `Game not found for removal: ${instanceId}`);
        return;
      }

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      Logger.info("STORAGE", `Game removed: ${instanceId} (${beforeCount} -> ${filtered.length} games)`);
    } catch (e: any) {
      Logger.error("STORAGE", `Failed to remove game: ${instanceId}`, {
        error: e?.message || String(e),
        instanceId,
      });
      throw new Error(`Failed to remove game: ${e?.message || String(e)}`);
    }
  },

  /**
   * Verify storage integrity and check for orphaned data
   * Returns a detailed report of any issues found
   */
  verifyIntegrity: async (): Promise<{
    valid: boolean;
    totalGames: number;
    totalPlayers: number;
    issues: {
      orphanedProfileIds: { gameId: string; gameType: string; profileId: string; playerName: string }[];
      invalidGames: { gameId: string; gameType: string; errors: string[] }[];
      missingProfileIds: { gameId: string; gameType: string; playerIndex: number; playerName: string }[];
      inconsistentHistory: { gameId: string; gameType: string; roundNum: number; issue: string }[];
      duplicateInstanceIds: { instanceId: string; count: number }[];
    };
  }> => {
    try {
      const games = await GameStorage.getAllFull();
      const profiles = await PlayerStorage.getAll();
      
      // Create a Set of valid profileIds for quick lookup
      const validProfileIds = new Set(profiles.map(p => p.id));
      
      const issues = {
        orphanedProfileIds: [] as { gameId: string; gameType: string; profileId: string; playerName: string }[],
        invalidGames: [] as { gameId: string; gameType: string; errors: string[] }[],
        missingProfileIds: [] as { gameId: string; gameType: string; playerIndex: number; playerName: string }[],
        inconsistentHistory: [] as { gameId: string; gameType: string; roundNum: number; issue: string }[],
        duplicateInstanceIds: [] as { instanceId: string; count: number }[],
      };

      // Track instanceIds to find duplicates
      const instanceIdCounts = new Map<string, number>();
      
      // Check each game
      games.forEach((game) => {
        const gameId = game.instanceId || game.id;
        const gameType = game.gameType || "unknown";

        // Track instanceId usage
        if (game.instanceId) {
          instanceIdCounts.set(game.instanceId, (instanceIdCounts.get(game.instanceId) || 0) + 1);
        }

        // Validate game structure
        const validation = validateGame(game);
        if (!validation.valid) {
          issues.invalidGames.push({
            gameId,
            gameType,
            errors: validation.errors,
          });
        }

        // Check players for orphaned profileIds and missing profileIds
        if (game.players && Array.isArray(game.players)) {
          game.players.forEach((player, index) => {
            if (!player.profileId) {
              issues.missingProfileIds.push({
                gameId,
                gameType,
                playerIndex: index,
                playerName: player.name || "unnamed",
              });
            } else if (!validProfileIds.has(player.profileId)) {
              // Orphaned profileId - exists in game but not in PlayerStorage
              issues.orphanedProfileIds.push({
                gameId,
                gameType,
                profileId: player.profileId,
                playerName: player.name || "unnamed",
              });
            }
          });
        }

        // Check history consistency
        if (game.history && Array.isArray(game.history)) {
          const playerProfileIds = new Set(
            (game.players || []).map(p => p.profileId).filter(Boolean)
          );

          game.history.forEach((round) => {
            const roundNum = round.roundNum || 0;

            // Check if all players have entries in this round
            if (game.players) {
              game.players.forEach((player) => {
                if (player.profileId && !round.playerDetails?.[player.profileId]) {
                  issues.inconsistentHistory.push({
                    gameId,
                    gameType,
                    roundNum,
                    issue: `Missing details for player ${player.name} (profileId: ${player.profileId})`,
                  });
                }
              });
            }

            // Check for orphaned entries in playerDetails (profileIds not in game.players)
            if (round.playerDetails) {
              Object.keys(round.playerDetails).forEach((profileId) => {
                if (!playerProfileIds.has(profileId)) {
                  issues.inconsistentHistory.push({
                    gameId,
                    gameType,
                    roundNum,
                    issue: `Orphaned round data for profileId: ${profileId} (not in game players)`,
                  });
                }
              });
            }
          });
        }
      });

      // Find duplicate instanceIds
      instanceIdCounts.forEach((count, instanceId) => {
        if (count > 1) {
          issues.duplicateInstanceIds.push({ instanceId, count });
        }
      });

      const totalIssues = 
        issues.orphanedProfileIds.length +
        issues.invalidGames.length +
        issues.missingProfileIds.length +
        issues.inconsistentHistory.length +
        issues.duplicateInstanceIds.length;

      const totalPlayers = games.reduce((sum, g) => sum + (g.players?.length || 0), 0);

      const result = {
        valid: totalIssues === 0,
        totalGames: games.length,
        totalPlayers,
        issues,
      };

      if (totalIssues > 0) {
        Logger.error("STORAGE", "Storage integrity check found issues", {
          totalGames: games.length,
          totalIssues,
          orphanedProfileIds: issues.orphanedProfileIds.length,
          invalidGames: issues.invalidGames.length,
          missingProfileIds: issues.missingProfileIds.length,
          inconsistentHistory: issues.inconsistentHistory.length,
          duplicateInstanceIds: issues.duplicateInstanceIds.length,
        });
      } else {
        Logger.info("STORAGE", "Storage integrity check passed", {
          totalGames: games.length,
          totalPlayers,
        });
      }

      return result;
    } catch (e: any) {
      Logger.error("STORAGE", "Failed to verify storage integrity", {
        error: e?.message || String(e),
      });
      throw new Error(`Failed to verify storage integrity: ${e?.message || String(e)}`);
    }
  },

  /**
   * Clear ALL games from storage
   */
  clearAll: async () => {
    try {
      Logger.info("STORAGE", "Clearing ALL games...");
      await AsyncStorage.removeItem(STORAGE_KEY);
      Logger.info("STORAGE", "All games cleared");
    } catch (e: any) {
      Logger.error("STORAGE", "Failed to clear all games", {
        error: e?.message || String(e),
      });
      throw new Error(`Failed to clear games: ${e?.message || String(e)}`);
    }
  },
};