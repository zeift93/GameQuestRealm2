import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { toast } from "sonner";

type InteractableType = 'cardPack' | 'enemy' | null;

interface CharacterState {
  // Character position and rotation
  position: { x: number; z: number };
  rotation: { y: number };
  updatePosition: (x: number, z: number, rotationY?: number) => void;
  
  // Character level and experience
  level: number;
  experience: number;
  nextLevelExperience: number;
  gainExperience: (amount: number) => void;
  
  // Stats
  health: number;
  maxHealth: number;
  
  // Movement state
  isMoving: boolean;
  setIsMoving: (moving: boolean) => void;
  
  // Interaction
  interactableNearby: InteractableType;
  setInteractableNearby: (type: InteractableType) => void;
  interact: () => void;
}

export const useCharacter = create<CharacterState>()(
  subscribeWithSelector((set, get) => ({
    // Starting position
    position: { x: 0, z: 0 },
    rotation: { y: 0 },
    
    // Update position function
    updatePosition: (x, z, rotationY) => {
      set(state => ({
        position: { x, z },
        rotation: { y: rotationY !== undefined ? rotationY : state.rotation.y }
      }));
    },
    
    // Level and experience
    level: 1,
    experience: 0,
    nextLevelExperience: 100,
    
    // Gain experience and level up if needed
    gainExperience: (amount) => {
      set(state => {
        const newExperience = state.experience + amount;
        let newLevel = state.level;
        let newNextLevelExperience = state.nextLevelExperience;
        
        // Check for level up
        if (newExperience >= state.nextLevelExperience) {
          // Level up!
          newLevel += 1;
          
          // Reset experience and increase next level requirement
          const remainingExp = newExperience - state.nextLevelExperience;
          newNextLevelExperience = Math.floor(state.nextLevelExperience * 1.5);
          
          // Increase health on level up
          const newMaxHealth = state.maxHealth + 10;
          
          // Show level up notification
          toast.success(`Level Up! You are now level ${newLevel}`, {
            description: "Your maximum health has increased!"
          });
          
          return {
            level: newLevel,
            experience: remainingExp,
            nextLevelExperience: newNextLevelExperience,
            maxHealth: newMaxHealth,
            health: newMaxHealth
          };
        }
        
        return { experience: newExperience };
      });
    },
    
    // Health stats
    health: 100,
    maxHealth: 100,
    
    // Movement state
    isMoving: false,
    setIsMoving: (moving) => set({ isMoving: moving }),
    
    // Interaction
    interactableNearby: null,
    setInteractableNearby: (type) => set({ interactableNearby: type }),
    interact: () => {
      // This is just a hook for detecting interaction, the actual interaction
      // will be handled by components listening to key presses
      console.log("Interact with", get().interactableNearby);
    }
  }))
);
