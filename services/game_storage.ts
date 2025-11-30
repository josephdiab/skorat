import AsyncStorage from '@react-native-async-storage/async-storage';

// --- Types ---

export type Player = {
  id: string;
  name: string;
  totalScore: number;
  isDanger: boolean;
  isLeader?: boolean;
};

export type RoundDetails = {
  score: number;
  hearts: number;
  hasQS: boolean;
  hasTen: boolean;
};

export type RoundHistory = {
  roundNum: number;
  playerDetails: Record<string, RoundDetails>;
};

export type GameState = {
  id: string; // Unique ID (instanceId)
  instanceId: string; // Redundant but kept for compatibility with your current params
  gameType: 'leekha' | 'tarneeb' | '400';
  mode: 'solo' | 'teams';
  title: string;
  roundLabel: string;
  lastPlayed: string; // ISO Date string
  status: 'active' | 'completed'; // New field to filter tabs
  players: Player[];
  history: RoundHistory[];
  roundNum: number;
  scoreLimit?: number;
  bestOf?: number;
  isTeamScoreboard?: boolean; 
};

const STORAGE_KEY = '@skorat_games_v1';

export const GameStorage = {
  // Save or Update a game
  save: async (game: GameState) => {
    try {
      const existingData = await AsyncStorage.getItem(STORAGE_KEY);
      let games: GameState[] = existingData ? JSON.parse(existingData) : [];
      
      const index = games.findIndex(g => g.id === game.id);
      
      const updatedGame = { 
        ...game, 
        lastPlayed: new Date().toISOString() // Update timestamp
      };

      if (index >= 0) {
        games[index] = updatedGame;
      } else {
        games.unshift(updatedGame);
      }

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(games));
    } catch (e) {
      console.error("Failed to save game", e);
    }
  },
  
  // Get a specific game by ID
  get: async (id: string): Promise<GameState | undefined> => {
    try {
      const existingData = await AsyncStorage.getItem(STORAGE_KEY);
      if (!existingData) return undefined;
      
      const games: GameState[] = JSON.parse(existingData);
      return games.find(g => g.id === id);
    } catch (e) {
      console.error("Failed to get game", e);
      return undefined;
    }
  },

  // Get all games
  getAll: async (): Promise<GameState[]> => {
    try {
      const existingData = await AsyncStorage.getItem(STORAGE_KEY);
      return existingData ? JSON.parse(existingData) : [];
    } catch (e) {
      console.error("Failed to get all games", e);
      return [];
    }
  },
  
  // Remove a game
  remove: async (id: string) => {
    try {
      const existingData = await AsyncStorage.getItem(STORAGE_KEY);
      if (!existingData) return;
      
      const games: GameState[] = JSON.parse(existingData);
      const filteredGames = games.filter(g => g.id !== id);
      
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filteredGames));
    } catch (e) {
      console.error("Failed to remove game", e);
    }
  },

  // Clear all data (Debug use)
  clear: async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error("Failed to clear storage", e);
    }
  }
};