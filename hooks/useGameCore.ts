import { useKeepAwake } from 'expo-keep-awake';
import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { GameState, Player, UserProfile } from "../constants/types";
import { GameStorage } from "../services/game_storage";
import { Logger } from "../services/logger";

/**
 * useGameCore
 * * The authoritative engine for all card games.
 * Guarantees that every game has the standard properties (id, status, players, etc.)
 * populated correctly before the UI renders.
 */
export function useGameCore(
  gameType: '400' | 'tarneeb' | 'leekha', 
  defaultTitle: string, 
  defaultScoreLimit: number,
  isTeamDefault: boolean = false
) {
  useKeepAwake();
  const params = useLocalSearchParams();
  const instanceId = (params.instanceId as string) || (params.id as string);
  
  // The Single State Object
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Prevent double-init
  const isFirstLoad = useRef(true);

  // --- 1. INITIALIZATION LOGIC ---
  useEffect(() => {
    const initializeGame = async () => {
      // CASE A: RESUME EXISTING GAME
      if (instanceId) {
        const saved = await GameStorage.get(instanceId);
        if (saved) {
          Logger.info('GAME_LIFECYCLE', `Resuming Game: ${saved.title}`, { id: saved.id });
          setGameState(saved);
          setIsLoaded(true);
          return;
        }
      }

      // CASE B: CREATE NEW GAME (Enforce Schema)
      if (params.playerProfiles) {
        try {
          const profiles: UserProfile[] = JSON.parse(params.playerProfiles as string);
          
          // Map to Standard Player Structure
          const initialPlayers: Player[] = profiles.map((p, i) => ({
            id: (i + 1).toString(),
            profileId: p.id,
            name: p.name,
            totalScore: 0,
            isDanger: false,
            isWinner: false
          }));

          const newId = Date.now().toString();
          const now = new Date().toISOString();

          // THE STRICT SCHEMA YOU REQUESTED
          const newGame: GameState = {
            id: newId,
            instanceId: newId,
            gameType: gameType,
            status: 'active',
            mode: (params.mode as 'solo' | 'teams') || (isTeamDefault ? 'teams' : 'solo'),
            title: (params.gameName as string) || defaultTitle,
            roundLabel: 'Round 1',
            lastPlayed: now,
            players: initialPlayers,
            history: [], // Starts empty
            scoreLimit: params.scoreLimit ? Number(params.scoreLimit) : defaultScoreLimit,
            isTeamScoreboard: isTeamDefault
          };

          Logger.info('GAME_LIFECYCLE', `Initialized New Game: ${newGame.title}`, { type: gameType });
          
          await GameStorage.save(newGame);
          setGameState(newGame);
          setIsLoaded(true);
        } catch (e) {
          Logger.error('GAME_LIFECYCLE', 'Failed to initialize game', e);
        }
      }
    };

    initializeGame();
  }, [instanceId]);

  // --- 2. UPDATE HELPER ---
  // Games use this to update state. It automatically updates 'lastPlayed' and saves to storage.
  const updateState = (updates: Partial<GameState>) => {
    if (!gameState) return;

    setGameState(prev => {
      if (!prev) return null;
      const newState = { 
        ...prev, 
        ...updates,
        lastPlayed: new Date().toISOString() // Always update timestamp
      };
      return newState;
    });
  };

  // --- 3. AUTO-SAVE EFFECT ---
  useEffect(() => {
    if (!isLoaded || !gameState) return;
    
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }

    const performSave = async () => {
      // Log critical status changes
      if (gameState.status === 'completed') {
        Logger.info('GAME_ACTION', 'Game Completed', { winners: gameState.players.filter(p => p.isWinner) });
      }
      
      await GameStorage.save(gameState);
    };

    performSave();
  }, [gameState]);

  return {
    gameState,
    isLoaded,
    updateState,
    // Helper to get raw data if needed immediately
    players: gameState?.players || [],
    history: gameState?.history || []
  };
}