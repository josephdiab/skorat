// constants/types.ts

// Default avatar for new players (preparing for future Profile feature)
export const DEFAULT_AVATAR = "👤";

export type UserProfile = {
  id: string;
  name: string;
  avatar: string;
};

export type Player = {
  id: string;
  profileId: string;
  name: string;
  totalScore: number;
  isDanger: boolean;
  isWinner: boolean;
};

export type TarneebRoundData = {
  kind: "tarneeb";
  bid: number;
  tricksTaken: number;
  isCallingTeamMember: boolean; // <--- RENAMED (Semantically clearer)
  score: number;
  partnerProfileId?: string;
};

export type LeekhaRoundData = {
  kind: "leekha";
  heartsTaken: number;
  hasQS: boolean;
  hasTen: boolean;
  score: number;
};

export type FourHundredRoundData = {
  kind: "400";
  bid: number;
  won: boolean;
  score: number; // <--- ADDED BACK (For integrity/performance)
};

export type GameRoundDetails =
  | TarneebRoundData
  | LeekhaRoundData
  | FourHundredRoundData;

export type RoundHistory = {
  roundNum: number;
  timestamp: string;
  playerDetails: Record<string, GameRoundDetails>;
};

export type GameState = {
  schemaVersion: 1;
  id: string;
  instanceId: string;
  gameType: "leekha" | "tarneeb" | "400";
  mode: "solo" | "teams";
  title: string;
  lastPlayed: string;
  status: "active" | "completed";
  players: Player[];
  history: RoundHistory[];
  scoreLimit?: number;
  roundLabel?: string;
  isTeamScoreboard?: boolean;
};

export type GameSummary = Omit<GameState, "history">;
