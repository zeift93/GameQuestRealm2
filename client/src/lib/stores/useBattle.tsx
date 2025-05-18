import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { useCards } from "./useCards";
import { generateCard, type Card } from "../CardData";
import { useCharacter } from "./useCharacter";
import { useGame } from "./useGame";
import { toast } from "sonner";

type BattleTurn = 'player' | 'enemy';
type BattleOutcome = 'win' | 'lose' | null;

interface BattleState {
  // Battle state
  active: boolean;
  level: number;
  
  // Health
  playerHealth: number;
  playerMaxHealth: number;
  enemyHealth: number;
  enemyMaxHealth: number;
  
  // Cards
  playerCards: Card[];
  enemyCards: Card[];
  activeCard: Card | null;
  enemyActiveCard: Card | null;
  
  // Turn management
  currentTurn: BattleTurn;
  outcome: BattleOutcome;
  
  // Battle functions
  startBattle: (level?: number) => void;
  startNewBattle: () => void;
  playCard: (cardIndex: number) => void;
  endTurn: () => void;
  endBattle: (outcome: BattleOutcome) => void;
}

export const useBattle = create<BattleState>()(
  subscribeWithSelector((set, get) => ({
    // Initial battle state
    active: false,
    level: 1,
    
    // Health values
    playerHealth: 100,
    playerMaxHealth: 100,
    enemyHealth: 50,
    enemyMaxHealth: 50,
    
    // Cards
    playerCards: [],
    enemyCards: [],
    activeCard: null,
    enemyActiveCard: null,
    
    // Turn management
    currentTurn: 'player',
    outcome: null,
    
    // Start a battle with enemy
    startBattle: (level = 1) => {
      // Get player health from character state
      const { health, maxHealth } = useCharacter.getState();
      
      // Get cards for battle from collection
      const { getBattleCards } = useCards.getState();
      const playerCards = getBattleCards(3);
      
      // Generate enemy cards based on level
      const enemyCards: Card[] = [];
      const enemyCardCount = Math.min(3, level + 1);
      
      for (let i = 0; i < enemyCardCount; i++) {
        enemyCards.push(generateCard('enemy', level));
      }
      
      // Calculate enemy health based on level
      const enemyMaxHealth = 30 + (level * 20);
      
      // Set battle state
      set({
        active: true,
        level,
        playerHealth: health,
        playerMaxHealth: maxHealth,
        enemyHealth: enemyMaxHealth,
        enemyMaxHealth,
        playerCards,
        enemyCards,
        activeCard: null,
        enemyActiveCard: null,
        currentTurn: 'player',
        outcome: null
      });
      
      // Set game view to battle
      useGame.getState().setView('battle');
      
      // Show battle start notification
      toast.info(`Battle started against Level ${level} enemy!`, {
        description: "Choose your cards wisely to defeat your opponent."
      });
    },
    
    // Reset for a new battle
    startNewBattle: () => {
      set({
        active: false,
        activeCard: null,
        enemyActiveCard: null,
        currentTurn: 'player',
        outcome: null
      });
    },
    
    // Play a card
    playCard: (cardIndex) => {
      const { playerCards, currentTurn, outcome } = get();
      
      // Can't play cards if battle is over or not player's turn
      if (outcome || currentTurn !== 'player') {
        return;
      }
      
      // Check if card index is valid
      if (cardIndex < 0 || cardIndex >= playerCards.length) {
        return;
      }
      
      // Set active card
      const card = playerCards[cardIndex];
      set({ activeCard: card });
      
      // Deal damage to enemy
      set(state => {
        const newEnemyHealth = Math.max(0, state.enemyHealth - card.power);
        
        // Check if enemy is defeated
        if (newEnemyHealth <= 0) {
          // End battle with win
          get().endBattle('win');
          
          // Award experience for winning
          const { gainExperience } = useCharacter.getState();
          const expGain = 50 + (state.level * 25);
          gainExperience(expGain);
          
          // Chance to get a new card as reward
          if (Math.random() < 0.7) {
            const { addCard } = useCards.getState();
            const rewardCard = generateCard('reward', state.level);
            addCard(rewardCard);
          }
          
          return { enemyHealth: 0 };
        }
        
        return { enemyHealth: newEnemyHealth };
      });
    },
    
    // End the current turn
    endTurn: () => {
      const { currentTurn, enemyCards, outcome } = get();
      
      // If battle is over, do nothing
      if (outcome) {
        return;
      }
      
      if (currentTurn === 'player') {
        // Switch to enemy turn
        set({ currentTurn: 'enemy', activeCard: null });
        
        // Enemy AI plays a card
        setTimeout(() => {
          if (enemyCards.length > 0) {
            // Choose the strongest card
            const bestCardIndex = enemyCards.reduce(
              (bestIndex, card, currentIndex, cards) => 
                card.power > cards[bestIndex].power ? currentIndex : bestIndex, 
              0
            );
            
            const enemyCard = enemyCards[bestCardIndex];
            set({ enemyActiveCard: enemyCard });
            
            // Deal damage to player
            set(state => {
              const newPlayerHealth = Math.max(0, state.playerHealth - enemyCard.power);
              
              // Check if player is defeated
              if (newPlayerHealth <= 0) {
                // End battle with loss
                get().endBattle('lose');
                return { playerHealth: 0 };
              }
              
              return { playerHealth: newPlayerHealth };
            });
          } else {
            // Enemy has no cards, player wins
            get().endBattle('win');
          }
        }, 1000);
      } else {
        // Switch back to player turn
        set({ currentTurn: 'player', enemyActiveCard: null });
      }
    },
    
    // End the battle with an outcome
    endBattle: (outcome) => {
      set({ outcome });
      
      if (outcome === 'win') {
        toast.success(`Victory! You defeated the level ${get().level} enemy`, {
          description: "You gained experience and might have found a new card!"
        });
      } else {
        toast.error("Defeat! The enemy was too strong", {
          description: "Try collecting more powerful cards or level up more."
        });
      }
    }
  }))
);
