import AsyncStorage from "@react-native-async-storage/async-storage";
import { GameState } from "../constants/types";
import { CURRENT_SCHEMA_VERSION, Migrations } from "./migrations";

const STORAGE_KEY = "card_games_data";

export const GameStorage = {
  /**
   * Save or Update a Game (Always persists current schema)
   */
  save: async (game: GameState) => {
    try {
      const existingData = await AsyncStorage.getItem(STORAGE_KEY);
      const rawGames: any[] = existingData ? JSON.parse(existingData) : [];

      // Ensure game is at current schema before saving
      const clean = Migrations.migrate({ 
        ...game, 
        schemaVersion: game.schemaVersion ?? CURRENT_SCHEMA_VERSION 
      });

      const index = rawGames.findIndex((g) => g.instanceId === clean.instanceId);
      if (index >= 0) rawGames[index] = clean;
      else rawGames.push(clean);

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(rawGames));
    } catch (e) {
      console.error("Failed to save game", e);
    }
  },

  /**
   * Get a single game (FULL detail, automatically migrated)
   */
  get: async (instanceId: string): Promise<GameState | null> => {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      if (!json) return null;

      const rawGames: any[] = JSON.parse(json);
      // Support finding by instanceId OR id (legacy compatibility)
      const found = rawGames.find((g) => g.instanceId === instanceId || g.id === instanceId);
      if (!found) return null;

      const migrated = Migrations.migrate(found);

      // Self-Healing: Persist the migration back to disk if it was old
      const needsSave = (found.schemaVersion || 0) < CURRENT_SCHEMA_VERSION;
      if (needsSave) {
        const updated = rawGames.map((g) =>
          (g.instanceId === found.instanceId ? migrated : g)
        );
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }

      return migrated;
    } catch {
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
      if (!json) return [];

      const rawGames: any[] = JSON.parse(json);

      // Run migration on every single game
      const migratedGames = rawGames.map((g) => Migrations.migrate(g));

      // Self-Healing: If any game was old, save the whole batch back to disk
      const needsSave = rawGames.some((g) => (g.schemaVersion || 0) < CURRENT_SCHEMA_VERSION);
      if (needsSave) {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(migratedGames));
      }

      return migratedGames;
    } catch {
      return [];
    }
  },

  /**
   * Overwrite ALL games (Required for Restore feature)
   */
  overwriteAll: async (games: GameState[]) => {
    // Sanitize before writing
    const clean = games.map((g) => Migrations.migrate(g));
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
  },

  /**
   * Remove a single game
   */
  remove: async (instanceId: string) => {
    const games = await GameStorage.getAllFull();
    const filtered = games.filter((g) => g.instanceId !== instanceId && g.id !== instanceId);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  },
};