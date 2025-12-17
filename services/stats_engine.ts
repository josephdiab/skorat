// services/stats_engine.ts
import { GameRoundDetails, GameState } from "../constants/types";

// Helper Type
type PlayerRound = GameRoundDetails & {
  gameType: GameState["gameType"];
  date: string;
  roundNum: number;
  gameId: string;
  instanceId: string;
};

export const StatsEngine = {
  /**
   * CORE: returns all round details for a profileId across all games.
   * Sorted newest -> oldest.
   */
  getPlayerRounds: (games: GameState[], profileId: string): PlayerRound[] => {
    const rounds: PlayerRound[] = [];

    for (const game of games) {
      if (!game.history) continue;

      for (const round of game.history) {
        const details = round.playerDetails?.[profileId];
        if (!details) continue;

        rounds.push({
          ...details,
          gameType: game.gameType,
          date: round.timestamp || game.lastPlayed || new Date().toISOString(),
          roundNum: round.roundNum,
          gameId: game.id,
          instanceId: game.instanceId,
        });
      }
    }

    return rounds.sort((a, b) => (a.date < b.date ? 1 : -1));
  },

  /**
   * TARNEEB: "Team Break Rate"
   * Counts rounds where this player was on the calling team.
   */
  getTarneebStats: (games: GameState[], profileId: string) => {
    let calls = 0;
    let breaks = 0;
    let successful = 0;

    const rounds = StatsEngine.getPlayerRounds(games, profileId);

    for (const r of rounds) {
      if (r.kind !== "tarneeb") continue;

      if (r.isCallingTeamMember) {
        calls++;
        if (r.tricksTaken < r.bid) breaks++;
        else successful++;
      }
    }

    return {
      totalCalls: calls,
      successful,
      breaks,
      successRate: calls === 0 ? 0 : Math.round((successful / calls) * 100),
      breakRate: calls === 0 ? 0 : Math.round((breaks / calls) * 100),
    };
  },

  /**
   * LEEKHA: basic counters
   */
  getLeekhaStats: (games: GameState[], profileId: string) => {
    let qsTaken = 0;
    let tenTaken = 0;
    let totalHearts = 0;
    let roundsPlayed = 0;

    const rounds = StatsEngine.getPlayerRounds(games, profileId);

    for (const r of rounds) {
      if (r.kind !== "leekha") continue;

      roundsPlayed++;
      if (r.hasQS) qsTaken++;
      if (r.hasTen) tenTaken++;
      totalHearts += r.heartsTaken;
    }

    return { roundsPlayed, qsTaken, tenTaken, totalHearts };
  },

  /**
   * 400: calls vs breaks (and win rate)
   * Every recorded hand implies a bid was made -> "call".
   */
  get400Stats: (games: GameState[], profileId: string) => {
    let calls = 0;
    let breaks = 0;
    let successful = 0;

    const rounds = StatsEngine.getPlayerRounds(games, profileId);

    for (const r of rounds) {
      if (r.kind !== "400") continue;

      calls++;
      if (r.won) successful++;
      else breaks++;
    }

    return {
      calls,
      successful,
      breaks,
      successRate: calls === 0 ? 0 : Math.round((successful / calls) * 100),
      breakRate: calls === 0 ? 0 : Math.round((breaks / calls) * 100),
    };
  },
};
