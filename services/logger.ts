import { ENABLE_LOGS } from "../constants/config";

type LogCategory = 'GAME_LIFECYCLE' | 'GAME_ACTION' | 'STORAGE' | 'ERROR' | "SANITY_STATS" | "DATA_INTEGRITY" | "STORAGE_VERIFY";

export const Logger = {
  info: (category: LogCategory, message: string, data?: any) => {
    if (!ENABLE_LOGS) return;
    
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] [${category}] ${message}`);
    
    if (data) {
      // Pretty print the data object if provided
      console.log(JSON.stringify(data, null, 2));
    }
  },

  error: (category: LogCategory, message: string, error?: any) => {
    console.error(`[ERROR] [${category}] ${message}`, error);
  }
};