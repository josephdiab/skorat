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
- `docs/` - Detailed game rules and business logic documentation

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

## Documentation / Business Logic

> **CRITICAL:** Complex game logic is documented in external files. You MUST read the relevant file before modifying scoring algorithms.

- **400 Rules:** See `docs/rules_400.md` for bidding logic and winning conditions.
- **Tarneeb Rules:** See `docs/rules_tarneeb.md` for team scoring and betting.
- **Leekha Rules:** See `docs/rules_leekha.md` for card point values and penalty logic.

## Coding Standards

- **Styling:** NEVER hardcode hex values. Always import colors from `constants/theme.ts`.
- **Imports:** Use absolute paths (e.g., import { Text } from `components/Themed`) to avoid `../../` hell.
- **Components:** Use functional components with typed props interfaces.
- **Performance:** Use `useCallback` for functions passed to children to prevent unnecessary re-renders.
- **Error Handling:** Logic errors -> console.error. User-facing errors -> Alert.alert or Toast notification.

## Common Pitfalls & Constraints

- **Navigation:** We use Expo Router. Do not try to use `React Navigation` prop drilling. Use `router.push('/games/400')`.
- **Navigation:** `AsyncStorage` is string-only. Always `JSON.stringify` before saving and `JSON.parse` with validation after loading.
- **Safe Area:** All screens must be wrapped in `<SafeAreaView>` or handle insets manually via `useSafeAreaInsets`.
- **Dates:** Store dates as ISO strings in the database, parse to Date objects only for display.

## Development Notes

- **Debug flags** in `constants/config.ts`: `ENABLE_LOGS` and `ENABLE_DEV_TOOLS`
- **Dark theme only** - all styling in `constants/theme.ts`
- **Fonts:** Only custom font is `Outfit_700Bold`
- **Animations:** Uses react-native-reanimated (Babel plugin in babel.config.js)
- **Screen keep-awake:** Game screens use `expo-keep-awake` during play
- **Player saves:** Done sequentially (not Promise.all) to avoid AsyncStorage race conditions
