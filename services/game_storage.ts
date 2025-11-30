
// Types shared between files
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
  instanceId: string; // Unique ID for this specific match (e.g. timestamp)
  gameType: 'leekha' | 'tarneeb' | '400'; // To know which screen to route to
  mode: 'solo' | 'teams';
  title: string;
  roundLabel: string;
  lastPlayed: string;
  players: Player[];
  history: RoundHistory[];
  roundNum: number;
  scoreLimit?: number;
  bestOf?: number;
  isTeamScoreboard?: boolean; 
};

// In-Memory Store (Note: Resets on app reload. Use AsyncStorage for permanent persistence)
let activeGames: GameState[] = [];

export const GameStorage = {
  save: (game: GameState) => {
    const index = activeGames.findIndex(g => g.instanceId === game.instanceId);
    if (index >= 0) {
      // Update existing game
      activeGames[index] = { ...game, lastPlayed: "Just now" };
    } else {
      // Add new game
      activeGames.unshift({ ...game, lastPlayed: "Just now" }); // Add to top
    }
  },
  
  get: (instanceId: string): GameState | undefined => {
    return activeGames.find(g => g.instanceId === instanceId);
  },

  getAll: (): GameState[] => {
    return activeGames;
  },
  
  clear: () => {
    activeGames = [];
  }
};