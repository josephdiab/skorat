import { GameState, RoundHistory } from "../constants/types";

export const CURRENT_SCHEMA_VERSION = 2;

export const Migrations = {
  /**
   * Main entry point. Takes any object, returns a clean GameState at CURRENT_SCHEMA_VERSION.
   */
  migrate: (rawGame: any): GameState => {
    // Clone to avoid mutation side-effects
    let game: any = { ...(rawGame ?? {}) };

    // ---- Safety net defaults ----
    if (typeof game.schemaVersion !== 'number') game.schemaVersion = 0;
    if (!Array.isArray(game.players)) game.players = [];
    if (!Array.isArray(game.history)) game.history = [];

    // ---- Run migrations in order ----
    if (game.schemaVersion < 2) {
      game = Migrations.migrateToV2(game);
    }

    // Ensure final version tag
    game.schemaVersion = CURRENT_SCHEMA_VERSION;
    return game as GameState;
  },

  /**
   * v1 -> v2: Rename fields inside history for Tarneeb and 400
   */
  migrateToV2: (game: any): any => {
    const history: RoundHistory[] = Array.isArray(game.history) ? game.history : [];

    // 1. Tarneeb: isCaller -> isCallingTeamMember
    if (game.gameType === "tarneeb") {
      game.history = history.map((round: any) => {
        const playerDetails = round?.playerDetails ?? {};
        const newDetails: any = {};

        Object.keys(playerDetails).forEach((key) => {
          const d = { ...(playerDetails[key] ?? {}) };

          // The Rename Logic
          if (d.isCaller !== undefined && d.isCallingTeamMember === undefined) {
            d.isCallingTeamMember = d.isCaller;
            delete d.isCaller;
          }

          newDetails[key] = d;
        });

        return { ...round, playerDetails: newDetails };
      });
    }

    // 2. 400: didPass -> won
    if (game.gameType === "400") {
      game.history = history.map((round: any) => {
        const playerDetails = round?.playerDetails ?? {};
        const newDetails: any = {};

        Object.keys(playerDetails).forEach((key) => {
          const d = { ...(playerDetails[key] ?? {}) };

          if (d.didPass !== undefined && d.won === undefined) {
            d.won = d.didPass;
            delete d.didPass;
          }

          newDetails[key] = d;
        });

        return { ...round, playerDetails: newDetails };
      });
    }

    // 3. Leekha: No renames needed yet, but we ensure structure is valid
    if (game.gameType === "leekha") {
      game.history = history.map((round: any) => {
        const playerDetails = round?.playerDetails ?? {};
        // Just return as-is, or add default values if you want extra safety
        // e.g. if (d.heartsTaken === undefined) d.heartsTaken = 0;
        return round; 
      });
    }

    game.schemaVersion = 2;
    return game;
  },
};