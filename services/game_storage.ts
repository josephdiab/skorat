// --- START OF FILE: services/game_storage.ts ---
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENABLE_LOGS } from '../constants/config'; // Imported Config
import { GameState, GameSummary } from '../constants/types';

const INDEX_KEY = '@skorat_games_v1'; 
const GAME_KEY_PREFIX = '@skorat_game_';

export const GameStorage = {

  // --- READ ---

  // 1. Get List (Fast, only summaries from Index)
  getAll: async (): Promise<GameSummary[]> => {
    try {
      const json = await AsyncStorage.getItem(INDEX_KEY);
      const data = json ? JSON.parse(json) : [];
      if (ENABLE_LOGS) console.log(`[STORAGE READ] Index Loaded: ${data.length} games found`);
      return data;
    } catch (e) {
      console.error("[STORAGE ERROR] Index Load Failed", e);
      return [];
    }
  },

  // 2. Get Full Game (Loads specific file for history)
  get: async (id: string): Promise<GameState | undefined> => {
    try {
      // Direct file access
      const json = await AsyncStorage.getItem(`${GAME_KEY_PREFIX}${id}`);
      if (json) {
        if (ENABLE_LOGS) console.log(`[STORAGE READ] Game Loaded: ${id}`);
        return JSON.parse(json);
      }
      
      if (ENABLE_LOGS) console.warn(`[STORAGE WARN] Game file missing for ${id}, checking index...`);
      
      // Fallback: If individual file is missing/corrupted, try to find in index
      const index = await GameStorage.getAll();
      const summary = index.find(g => g.id === id);
      if (summary) {
        return { ...summary, history: [] }; 
      }
      return undefined;
    } catch (e) {
      console.error(`[STORAGE ERROR] Failed to load game ${id}`, e);
      return undefined;
    }
  },

  // --- WRITE ---

  save: async (game: GameState) => {
    try {
      const now = new Date().toISOString();
      const gameWithTime = { ...game, lastPlayed: now };

      if (ENABLE_LOGS) console.log(`[STORAGE WRITE] Saving Game: ${game.title} (ID: ${game.id})`);

      // 1. Save Full Game to distinct key
      const key = `${GAME_KEY_PREFIX}${game.id}`;
      await AsyncStorage.setItem(key, JSON.stringify(gameWithTime));

      // 2. Update Index (Lightweight Summary)
      await GameStorage.updateIndex(gameWithTime);
      
      // --- LOG WINNERS (Wrapped in ENABLE_LOGS) ---
      if (ENABLE_LOGS && game.status === 'completed') {
        const playersLog = game.players.map(p => ({
            name: p.name,
            score: p.totalScore,
            isWinner: !!p.isWinner // Directly read from the data
        }));
        
        console.log("=========================================");
        console.log(`🏆 GAME COMPLETED: ${game.title}`);
        console.log(JSON.stringify(playersLog, null, 2));
        console.log("=========================================");
      }

    } catch (e) {
      console.error("[STORAGE ERROR] Save Failed", e);
    }
  },

  // Internal helper to update the summary list
  updateIndex: async (fullGame: GameState) => {
    try {
      const summaries = await GameStorage.getAll();
      const index = summaries.findIndex(g => g.id === fullGame.id);

      // Create Summary (Strip history to save space in Index)
      const { history, ...summaryData } = fullGame;

      if (index >= 0) {
        summaries[index] = summaryData;
      } else {
        summaries.unshift(summaryData); // Add to top
      }

      await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(summaries));
      if (ENABLE_LOGS) console.log(`[STORAGE WRITE] Index Updated`);
    } catch (e) {
      console.error("[STORAGE ERROR] Index Update Failed", e);
    }
  },

  // --- DELETE ---

  remove: async (id: string) => {
    try {
      if (ENABLE_LOGS) console.log(`[STORAGE DELETE] Removing Game: ${id}`);
      // 1. Remove specific file
      await AsyncStorage.removeItem(`${GAME_KEY_PREFIX}${id}`);

      // 2. Remove from Index
      const summaries = await GameStorage.getAll();
      const newSummaries = summaries.filter(g => g.id !== id);
      await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(newSummaries));
    } catch (e) {
      console.error("[STORAGE ERROR] Delete Failed", e);
    }
  },

  // --- DEBUG HELPER ---
  clearAll: async () => {
    try {
      if (ENABLE_LOGS) console.log("[STORAGE DEBUG] Clearing ALL Data...");
      const keys = await AsyncStorage.getAllKeys();
      const skoratKeys = keys.filter(k => k.startsWith('@skorat_'));
      await AsyncStorage.multiRemove(skoratKeys);
      if (ENABLE_LOGS) console.log("[STORAGE DEBUG] Storage Cleared");
    } catch (e) {
      console.error(e);
    }
  }
};
// --- END OF FILE: services/game_storage.ts ---