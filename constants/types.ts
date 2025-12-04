// --- START OF FILE: constants\types.ts ---

// 1. The Global "Profile" (Phonebook entry)
export type UserProfile = {
  id: string;   // Unique ID (e.g., "u_1709823")
  name: string; // "Charbel"
  // Future: avatar, totalWins, etc.
};

// 2. The Player inside a specific game
export type Player = {
  id: string;         // Game-context ID (e.g., "1", "2", "A", "B")
  profileId: string;  // Link to UserProfile
  name: string;       // Snapshot of name at game time
  totalScore: number;
  isDanger: boolean;
  isLeader?: boolean; // For Tarneeb/Leekha
};

// 3. History (Readable, explicit fields)
export type RoundHistory = {
  roundNum: number;
  // Flexible payload:
  // 400: { "1": { bid: 5, passed: true, score: 10 } }
  // Tarneeb: { "A": { bid: 7, tricks: 8, score: 8, isCaller: true } }
  playerDetails: Record<string, any>; 
};

// 4. The Full Game State (Saved in @skorat_game_<ID>)
export type GameState = {
  id: string;
  instanceId?: string; // Legacy compat
  gameType: 'leekha' | 'tarneeb' | '400';
  mode: 'solo' | 'teams';
  title: string;
  lastPlayed: string; // ISO String
  status: 'active' | 'completed';
  players: Player[];
  history: RoundHistory[]; 
  scoreLimit?: number;
  roundLabel?: string; 
  isTeamScoreboard?: boolean;
};

// 5. The Summary (Saved in @skorat_games_v1)
// It is identical to GameState but WITHOUT the heavy 'history' array
export type GameSummary = Omit<GameState, 'history'>;

// --- END OF FILE: constants\types.ts ---