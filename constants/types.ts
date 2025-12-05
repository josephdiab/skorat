// --- START OF FILE: constants/types.ts ---

// 1. The Global "Profile" (Phonebook entry)
export type UserProfile = {
  id: string;   // Unique ID (e.g., "u_1709823")
  name: string; // "Charbel"
  // Future: avatar, totalWins, etc.
};

// 2. The Player inside a specific game
export type Player = {
  id: string;           // Game-context ID (e.g., "1", "2", "A", "B")
  profileId: string;    // Link to UserProfile
  name: string;         // Snapshot of name at game time
  totalScore: number;
  isDanger: boolean;
  isWinner?: boolean;   // <--- NEW: Persist the win status
  isLeader?: boolean;   // For Tarneeb/Leekha
};

// 3. History (Readable, explicit fields)
export type RoundHistory = {
  roundNum: number;
  playerDetails: Record<string, any>; 
};

// 4. The Full Game State
export type GameState = {
  id: string;
  instanceId?: string;
  gameType: 'leekha' | 'tarneeb' | '400';
  mode: 'solo' | 'teams';
  title: string;
  lastPlayed: string;
  status: 'active' | 'completed';
  players: Player[];
  history: RoundHistory[]; 
  scoreLimit?: number;
  roundLabel?: string; 
  isTeamScoreboard?: boolean;
};

// 5. The Summary
export type GameSummary = Omit<GameState, 'history'>;
// --- END OF FILE: constants/types.ts ---