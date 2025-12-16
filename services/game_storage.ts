// services/game_storage.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GameState } from "../constants/types";

const STORAGE_KEY = "card_games_data";

export const GameStorage = {
  /**
   * Save or Update a Game
   * - Uses instanceId as the stable primary key.
   */
  save: async (game: GameState) => {
    try {
      const existingData = await AsyncStorage.getItem(STORAGE_KEY);
      const games: GameState[] = existingData ? JSON.parse(existingData) : [];

      const index = games.findIndex(g => g.instanceId === game.instanceId);
      if (index >= 0) {
        games[index] = game;
      } else {
        games.push(game);
      }

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(games));
    } catch (e) {
      console.error("Failed to save game", e);
    }
  },

  /**
   * Get a single game (Full Detail)
   */
  get: async (instanceId: string): Promise<GameState | null> => {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      if (!json) return null;
      const games: GameState[] = JSON.parse(json);
      return games.find(g => g.instanceId === instanceId) || null;
    } catch (e) {
      return null;
    }
  },

  /**
   * Delete a game by instanceId (Full Detail)
   * - This fixes your Index.tsx "remove is underlined red" issue.
   */
  remove: async (instanceId: string): Promise<void> => {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      if (!json) return;

      const games: GameState[] = JSON.parse(json);
      const filtered = games.filter(g => g.instanceId !== instanceId);

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.error("Failed to remove game", e);
    }
  },

  /**
   * Get All Games (Summary Only - Lighter for List)
   * IMPORTANT:
   * - Still returns GameState[] but with history stripped.
   * - This is why "players.map(p => p.profileId)" can be red if your UI uses a separate GameSummary type.
   * - For rematch and stats, use get(instanceId) or getAllFull().
   */
  getAll: async (): Promise<GameState[]> => {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      if (!json) return [];
      const games: GameState[] = JSON.parse(json);

      return games.map(g => ({
        ...g,
        history: [], // strip heavy payload for list screens
      }));
    } catch (e) {
      return [];
    }
  },

  /**
   * Get All Games (FULL DATA)
   * Use THIS for StatsEngine, debugging, validators, exports, etc.
   */
  getAllFull: async (): Promise<GameState[]> => {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      return json ? JSON.parse(json) : [];
    } catch (e) {
      return [];
    }
  },

  /**
   * Optional: wipe everything (dev utility)
   */
  clearAll: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error("Failed to clear storage", e);
    }
  },
};
