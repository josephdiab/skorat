# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Skorat is a React Native mobile app (Expo) for scoring card games. It's a fully offline-first scoreboard application supporting three games: 400, Tarneeb, and Leekha.

**Stack:** Expo 54, React Native 0.81, React 19, TypeScript 5.9, Expo Router 6 (file-based routing)

## Commands

```bash
npm start           # Start Expo dev server
npm run android     # Run on Android emulator
npm run ios         # Run on iOS simulator
npm run web         # Run on web browser
npm run lint        # Run ESLint

# EAS Build (production)
eas build --platform ios --profile production
eas build --platform android --profile production
```

## Architecture

### Directory Structure

- `app/` - Screens using Expo Router file-based routing
  - `_layout.tsx` - Root layout with theme, fonts, SafeAreaProvider
  - `index.tsx` - Home screen (game list with active/completed tabs)
  - `games/` - Game screens (new.tsx for creation, 400.tsx, tarneeb.tsx, leekha.tsx for scoreboards)
  - `rules/` - Game rules display screens
- `components/` - Reusable UI components (header, match_card, fab, etc.)
- `constants/` - Types, theme, game definitions, config flags
- `services/` - Business logic: storage, migrations, stats, validation
- `hooks/` - Custom hooks (useGameCore is the central game engine)

### State Management

All state is managed through React hooks with AsyncStorage persistence. The central hook is `useGameCore.ts` which handles:
- Game state loading/resuming from storage
- Auto-save on state changes
- Schema validation
- Resume vs. new game detection from URL params

### Storage

No backend - all data stored locally via AsyncStorage:
- `@skorat_players_v1` - User profiles
- `card_games_data` - Game instances and history

Data schema is versioned (currently v2) with auto-migration on load (`services/migrations.ts`).

### Key Types (constants/types.ts)

- `GameState` - Main game data structure with players, history, status
- `Player` - Player info linked to UserProfile
- `RoundHistory` - Per-round scoring data
- `GameRoundDetails` - Union type for game-specific round data (TarneebRoundData | LeekhaRoundData | FourHundredRoundData)

### Game Logic Patterns

- **400 Game:** Uses replay engine that recalculates all scores from history to prevent delta desync
- **All games:** 4 players, configurable score limits, solo or team mode, complete history tracking

## Development Notes

- **Debug flags** in `constants/config.ts`: `ENABLE_LOGS` and `ENABLE_DEV_TOOLS`
- **Dark theme only** - all styling in `constants/theme.ts`
- **Fonts:** Only custom font is `Outfit_700Bold`
- **Animations:** Uses react-native-reanimated (Babel plugin in babel.config.js)
- **Screen keep-awake:** Game screens use `expo-keep-awake` during play
- **Player saves:** Done sequentially (not Promise.all) to avoid AsyncStorage race conditions
