import * as Clipboard from "expo-clipboard"; // Requires: npx expo install expo-clipboard
import { Share } from "react-native";
import { GameState } from "../constants/types";
import { GameStorage } from "./game_storage";
import { Migrations } from "./migrations";

export const BackupService = {
  /**
   * Get all data as a formatted JSON string
   */
  exportData: async () => {
    const games = await GameStorage.getAllFull();
    return JSON.stringify(games, null, 2);
  },

  /**
   * Copy JSON to user's clipboard
   */
  copyExportToClipboard: async () => {
    const json = await BackupService.exportData();
    await Clipboard.setStringAsync(json);
    return { success: true };
  },

  /**
   * Open system Share Sheet (Save to Files, Email, etc.)
   */
  shareExport: async () => {
    const json = await BackupService.exportData();
    await Share.share({ message: json, title: "Card Games Backup.json" });
  },

  /**
   * Import JSON string, validate, migrate, and overwrite data.
   */
  importData: async (jsonString: string) => {
    try {
      const raw = JSON.parse(jsonString);
      
      // Basic Validation
      if (!Array.isArray(raw)) throw new Error("Invalid format: expected an array");
      if (raw.length > 0 && !raw[0].gameType) throw new Error("Invalid format: missing game data");

      // Migrate & Sanitize
      const cleanGames: GameState[] = raw.map((g) => Migrations.migrate(g));
      
      // Save
      await GameStorage.overwriteAll(cleanGames);

      return { success: true, count: cleanGames.length };
    } catch (e: any) {
      return { success: false, error: e?.message ?? String(e) };
    }
  },
};