export type GameDefinition = {
  id: string;
  name: string;
  isTeam: boolean;
  scoreLimits: number[];
  defaultLimit: number;
};

export const GAMES: GameDefinition[] = [
  {
    id: "leekha",
    name: "Leekha",
    isTeam: true,
    scoreLimits: [51, 101, 151],
    defaultLimit: 101,
  },
  {
    id: "tarneeb",
    name: "Tarneeb",
    isTeam: true,
    scoreLimits: [31, 61],
    defaultLimit: 31,
  },
  {
    id: "400",
    name: "400",
    isTeam: true,
    scoreLimits: [31, 41],
    defaultLimit: 41,
  },
];