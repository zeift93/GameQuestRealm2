import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export type GamePhase = "tutorial" | "ready" | "playing" | "ended";
export type GameView = "world" | "battle" | "collection" | "pack_opening";

interface GameState {
  // Game state
  phase: GamePhase;
  view: GameView;
  
  // Actions
  setPhase: (phase: GamePhase) => void;
  setView: (view: GameView) => void;
  startTutorial: () => void;
  startBattle: (level?: number) => void;
}

export const useGame = create<GameState>()(
  subscribeWithSelector((set) => ({
    // Initial state
    phase: "tutorial",
    view: "world",
    
    // Set game phase
    setPhase: (phase) => {
      set({ phase });
    },
    
    // Set current view
    setView: (view) => {
      set({ view });
    },
    
    // Start tutorial
    startTutorial: () => {
      set({ phase: "tutorial" });
    },
    
    // Start a battle
    startBattle: (level = 1) => {
      // Directly set the view to battle
      set({ view: "battle" });
      
      // Import battle store dynamically to avoid circular dependency
      // This needs to be loaded dynamically since useBattle imports useGame
      import("./useBattle").then(({ useBattle }) => {
        const battleStore = useBattle.getState();
        battleStore.startBattle(level);
      });
    }
  }))
);
