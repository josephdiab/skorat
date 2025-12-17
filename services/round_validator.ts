// services/round_validator.ts
import { GameState } from "../constants/types";

export const RoundValidator = {
  validateLastRound: (game: GameState): string[] => {
    const errors: string[] = [];

    if (!game.history?.length) return errors;

    const last = game.history[game.history.length - 1];
    if (!last?.playerDetails) return ["CRITICAL: Last round missing playerDetails"];

    // Ensure each player in THIS game has an entry keyed by profileId
    for (const p of game.players) {
      const d = last.playerDetails[p.profileId];
      if (!d) {
        errors.push(`Missing details for profileId=${p.profileId}`);
        continue;
      }
      if (d.kind !== game.gameType) {
        errors.push(`Kind mismatch for ${p.profileId}: ${d.kind} vs ${game.gameType}`);
      }
    }

    // Validate each entry in playerDetails
    for (const [k, d] of Object.entries(last.playerDetails)) {
      switch (d.kind) {
        case "tarneeb": {
          if (typeof d.bid !== "number") errors.push(`Tarneeb: bid not number for ${k}`);
          if (typeof d.tricksTaken !== "number") errors.push(`Tarneeb: tricksTaken not number for ${k}`);
          if (typeof d.isCallingTeamMember !== "boolean")
            errors.push(`Tarneeb: isCallingTeamMember not boolean for ${k}`);
          if (typeof d.score !== "number") errors.push(`Tarneeb: score not number for ${k}`);
          break;
        }

        case "leekha": {
          if (typeof d.heartsTaken !== "number") errors.push(`Leekha: heartsTaken not number for ${k}`);
          if (typeof d.hasQS !== "boolean") errors.push(`Leekha: hasQS not boolean for ${k}`);
          if (typeof d.hasTen !== "boolean") errors.push(`Leekha: hasTen not boolean for ${k}`);
          if (typeof d.score !== "number") errors.push(`Leekha: score not number for ${k}`);
          break;
        }

        case "400": {
          if (typeof d.bid !== "number") errors.push(`400: bid not number for ${k}`);
          if (typeof d.won !== "boolean") errors.push(`400: won not boolean for ${k}`);
          if (typeof d.score !== "number") errors.push(`400: score not number for ${k}`);
          break;
        }

        default: {
          errors.push(`Unknown round kind for ${k}`);
          break;
        }
      }
    }

    return errors;
  },
};
