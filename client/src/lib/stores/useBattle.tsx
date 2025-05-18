import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { useCards } from "./useCards";
import { generateCard, type Card, type CardEffect } from "../CardData";
import { useCharacter } from "./useCharacter";
import { useGame } from "./useGame";
import { toast } from "sonner";

type BattleTurn = 'player' | 'enemy';
type BattleOutcome = 'win' | 'lose' | null;

// Status effect tracking for battles
interface StatusEffect {
  effect: CardEffect;
  power: number;
  duration: number;
  sourceCard: Card;
}

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
  
  // Status effects (new)
  playerEffects: StatusEffect[];
  enemyEffects: StatusEffect[];
  
  // Turn management
  currentTurn: BattleTurn;
  outcome: BattleOutcome;
  playerSkipNextTurn: boolean;  // For stun effect
  enemySkipNextTurn: boolean;   // For stun effect
  
  // Battle functions
  startBattle: (level?: number) => void;
  startNewBattle: () => void;
  playCard: (cardIndex: number) => void;
  endTurn: () => void;
  endBattle: (outcome: BattleOutcome) => void;
  
  // Effect management (new)
  applyCardEffect: (card: Card, target: 'player' | 'enemy') => void;
  updateStatusEffects: () => void;
  getEffectMessage: (effect: CardEffect, power: number, target: string) => string;
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
    
    // Status effects
    playerEffects: [],
    enemyEffects: [],
    
    // Turn management
    currentTurn: 'player',
    outcome: null,
    playerSkipNextTurn: false,
    enemySkipNextTurn: false,
    
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
        playerEffects: [],
        enemyEffects: [],
        currentTurn: 'player',
        outcome: null,
        playerSkipNextTurn: false,
        enemySkipNextTurn: false
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
      const { playerCards, currentTurn, outcome, playerSkipNextTurn } = get();
      
      // Can't play cards if battle is over or not player's turn
      if (outcome || currentTurn !== 'player') {
        return;
      }
      
      // If player is stunned, skip this turn
      if (playerSkipNextTurn) {
        toast.error("You are stunned and cannot play a card this turn!");
        set({ playerSkipNextTurn: false });
        get().endTurn();
        return;
      }
      
      // Check if card index is valid
      if (cardIndex < 0 || cardIndex >= playerCards.length) {
        return;
      }
      
      // Set active card
      const card = playerCards[cardIndex];
      set({ activeCard: card });
      
      // Calculate actual damage based on effects
      let actualPower = card.power;
      const playerEffects = get().playerEffects;
      const enemyEffects = get().enemyEffects;
      
      // Apply boost effects to increase player damage
      const boostEffects = playerEffects.filter(effect => effect.effect === 'boost');
      for (const effect of boostEffects) {
        actualPower += effect.power;
        toast.info(`Boost effect adds ${effect.power} power!`);
      }
      
      // Apply weaken effects to reduce player damage
      const weakenEffects = enemyEffects.filter(effect => effect.effect === 'weaken');
      for (const effect of weakenEffects) {
        actualPower = Math.max(1, actualPower - effect.power);
        toast.info(`Weaken effect reduces damage by ${effect.power}!`);
      }
      
      // Deal damage to enemy
      set(state => {
        let newEnemyHealth = state.enemyHealth;
        let newPlayerHealth = state.playerHealth;
        
        // Check for shield effects on enemy
        const shieldEffects = state.enemyEffects.filter(effect => effect.effect === 'shield');
        let blockedDamage = 0;
        
        if (shieldEffects.length > 0) {
          // Calculate total shield amount
          blockedDamage = shieldEffects.reduce((total, effect) => total + effect.power, 0);
          
          // Apply shield protection
          const actualDamage = Math.max(0, actualPower - blockedDamage);
          newEnemyHealth = Math.max(0, newEnemyHealth - actualDamage);
          
          toast.info(`Enemy shield blocked ${blockedDamage} damage!`);
        } else {
          // No shield, apply full damage
          newEnemyHealth = Math.max(0, newEnemyHealth - actualPower);
        }
        
        // Check for reflect effects
        const reflectEffects = state.enemyEffects.filter(effect => effect.effect === 'reflect');
        if (reflectEffects.length > 0) {
          // Calculate reflected damage
          const reflectEffect = reflectEffects[0];
          const reflectAmount = Math.floor(actualPower * (reflectEffect.power / 100));
          
          // Apply reflected damage to player
          newPlayerHealth = Math.max(0, newPlayerHealth - reflectAmount);
          toast.info(`Enemy reflected ${reflectAmount} damage back to you!`);
          
          // Check if player was defeated by reflected damage
          if (newPlayerHealth <= 0) {
            get().endBattle('lose');
            return { playerHealth: 0 };
          }
        }
        
        // Check for leech effect
        if (card.effect === 'leech') {
          const leechAmount = Math.min(actualPower, card.effectPower || 0);
          newPlayerHealth = Math.min(state.playerMaxHealth, newPlayerHealth + leechAmount);
          toast.info(`You leeched ${leechAmount} health from the enemy!`);
        }
        
        // Apply card special effects
        get().applyCardEffect(card, 'enemy');
        
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
            
            // Generate reward card based on player level
            const { level } = useCharacter.getState();
            const rewardCard = generateCard('reward', level);
            
            addCard(rewardCard);
            
            toast.success(`You received a new ${rewardCard.rarity} card: ${rewardCard.name}!`);
          }
          
          return { enemyHealth: 0, playerHealth: newPlayerHealth };
        }
        
        // Handle double attack effect
        if (card.effect === 'double_attack') {
          // Apply a second attack
          newEnemyHealth = Math.max(0, newEnemyHealth - actualPower);
          toast.info('Double attack! Hit enemy a second time!');
          
          // Check if enemy is defeated by second attack
          if (newEnemyHealth <= 0) {
            get().endBattle('win');
            
            // Award experience for winning
            const { gainExperience } = useCharacter.getState();
            const expGain = 50 + (state.level * 25);
            gainExperience(expGain);
            
            return { enemyHealth: 0, playerHealth: newPlayerHealth };
          }
        }
        
        return { 
          enemyHealth: newEnemyHealth,
          playerHealth: newPlayerHealth
        };
      });
    },
    
    // End the current turn
    endTurn: () => {
      const { currentTurn, enemyCards, outcome, enemySkipNextTurn } = get();
      
      // If battle is over, do nothing
      if (outcome) {
        return;
      }
      
      // Process status effects at the end of turn
      get().updateStatusEffects();
      
      if (currentTurn === 'player') {
        // Switch to enemy turn
        set({ currentTurn: 'enemy', activeCard: null });
        
        // Check if enemy is stunned
        if (enemySkipNextTurn) {
          toast.info("Enemy is stunned and skips their turn!");
          set({ enemySkipNextTurn: false });
          
          // Go back to player turn after a delay
          setTimeout(() => {
            set({ currentTurn: 'player', enemyActiveCard: null });
          }, 1500);
          
          return;
        }
        
        // Enemy AI plays a card after a delay
        setTimeout(() => {
          if (enemyCards.length > 0) {
            // Choose strategically based on the situation
            let selectedCardIndex = 0;
            const { playerHealth, playerMaxHealth } = get();
            
            // If player health is low, prioritize high damage cards
            if (playerHealth < playerMaxHealth * 0.3) {
              // Choose the most damaging card
              selectedCardIndex = enemyCards.reduce(
                (bestIndex, card, currentIndex, cards) => 
                  card.power > cards[bestIndex].power ? currentIndex : bestIndex, 
                0
              );
            } 
            // If player health is high, prioritize cards with effects
            else if (playerHealth > playerMaxHealth * 0.7) {
              // Find cards with effects
              const effectCardIndex = enemyCards.findIndex(card => card.effect && card.effect !== 'none');
              if (effectCardIndex >= 0) {
                selectedCardIndex = effectCardIndex;
              } else {
                // No effect cards, use highest power
                selectedCardIndex = enemyCards.reduce(
                  (bestIndex, card, currentIndex, cards) => 
                    card.power > cards[bestIndex].power ? currentIndex : bestIndex, 
                  0
                );
              }
            }
            // Otherwise, just use random selection with some weight to higher power
            else {
              selectedCardIndex = Math.floor(Math.random() * enemyCards.length);
            }
            
            const enemyCard = enemyCards[selectedCardIndex];
            set({ enemyActiveCard: enemyCard });
            
            // Calculate actual damage based on effects
            let actualPower = enemyCard.power;
            const playerEffects = get().playerEffects;
            const enemyEffects = get().enemyEffects;
            
            // Apply boost effects to increase enemy damage
            const boostEffects = enemyEffects.filter(effect => effect.effect === 'boost');
            for (const effect of boostEffects) {
              actualPower += effect.power;
              toast.error(`Enemy's boost effect adds ${effect.power} power!`);
            }
            
            // Apply weaken effects to reduce enemy damage
            const weakenEffects = playerEffects.filter(effect => effect.effect === 'weaken');
            for (const effect of weakenEffects) {
              actualPower = Math.max(1, actualPower - effect.power);
              toast.info(`Your weaken effect reduces enemy's damage by ${effect.power}!`);
            }
            
            // Deal damage to player
            set(state => {
              let newPlayerHealth = state.playerHealth;
              
              // Check for shield effects on player
              const shieldEffects = state.playerEffects.filter(effect => effect.effect === 'shield');
              let blockedDamage = 0;
              
              if (shieldEffects.length > 0) {
                // Calculate total shield amount
                blockedDamage = shieldEffects.reduce((total, effect) => total + effect.power, 0);
                
                // Apply shield protection
                const actualDamage = Math.max(0, actualPower - blockedDamage);
                newPlayerHealth = Math.max(0, newPlayerHealth - actualDamage);
                
                toast.info(`Your shield blocked ${blockedDamage} damage!`);
              } else {
                // No shield, apply full damage
                newPlayerHealth = Math.max(0, newPlayerHealth - actualPower);
              }
              
              // Check for reflect effects on player
              const reflectEffects = state.playerEffects.filter(effect => effect.effect === 'reflect');
              let newEnemyHealth = state.enemyHealth;
              
              if (reflectEffects.length > 0) {
                // Calculate reflected damage
                const reflectEffect = reflectEffects[0];
                const reflectAmount = Math.floor(actualPower * (reflectEffect.power / 100));
                
                // Apply reflected damage to enemy
                newEnemyHealth = Math.max(0, newEnemyHealth - reflectAmount);
                toast.info(`You reflected ${reflectAmount} damage back to the enemy!`);
                
                // Check if enemy was defeated by reflected damage
                if (newEnemyHealth <= 0) {
                  // End battle with win
                  get().endBattle('win');
                  return { enemyHealth: 0 };
                }
              }
              
              // Apply enemy card's special effects
              get().applyCardEffect(enemyCard, 'player');
              
              // Check if player is defeated
              if (newPlayerHealth <= 0) {
                // End battle with loss
                get().endBattle('lose');
                return { playerHealth: 0 };
              }
              
              // Handle enemy double attack effect
              if (enemyCard.effect === 'double_attack') {
                // Apply a second attack
                newPlayerHealth = Math.max(0, newPlayerHealth - actualPower);
                toast.error('Enemy used double attack and hit you a second time!');
                
                // Check if player is defeated by second attack
                if (newPlayerHealth <= 0) {
                  get().endBattle('lose');
                  return { playerHealth: 0 };
                }
              }
              
              return { 
                playerHealth: newPlayerHealth,
                enemyHealth: newEnemyHealth
              };
            });
            
            // Return to player turn after a delay
            setTimeout(() => {
              set({ currentTurn: 'player', enemyActiveCard: null });
            }, 2000);
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
    },
    
    // Apply card effect to target (player or enemy)
    applyCardEffect: (card, target) => {
      if (!card.effect || card.effect === 'none') return;
      
      const effectPower = card.effectPower || 0;
      const effectDuration = card.effectDuration || 1;
      
      // Create the status effect
      const statusEffect: StatusEffect = {
        effect: card.effect,
        power: effectPower,
        duration: effectDuration,
        sourceCard: card
      };
      
      // Apply effect based on target
      if (target === 'enemy') {
        // Apply to enemy
        set(state => {
          // Handle immediate effects
          let newEnemyHealth = state.enemyHealth;
          
          // Handle effects that apply immediately
          switch (card.effect) {
            case 'burn':
              // Deal initial burn damage
              newEnemyHealth = Math.max(0, newEnemyHealth - effectPower);
              toast.info(`Burn effect deals ${effectPower} damage!`);
              break;
              
            case 'stun':
              set({ enemySkipNextTurn: true });
              toast.info('Enemy is stunned and will skip next turn!');
              break;
              
            case 'weaken':
              toast.info(`Enemy creatures weakened by ${effectPower} power!`);
              break;
          }
          
          // Check if enemy defeated by the effect
          if (newEnemyHealth <= 0) {
            get().endBattle('win');
            return { enemyHealth: 0 };
          }
          
          // Add effect to enemy effects list
          return {
            enemyHealth: newEnemyHealth,
            enemyEffects: [...state.enemyEffects, statusEffect]
          };
        });
      } else {
        // Apply to player
        set(state => {
          // Handle immediate effects
          let newPlayerHealth = state.playerHealth;
          
          // Handle effects that apply immediately
          switch (card.effect) {
            case 'heal':
              // Heal player
              newPlayerHealth = Math.min(
                state.playerMaxHealth, 
                newPlayerHealth + effectPower
              );
              toast.info(`Healed ${effectPower} health!`);
              break;
              
            case 'shield':
              toast.info(`Gained shield that blocks ${effectPower} damage!`);
              break;
              
            case 'boost':
              toast.info(`Power boosted by ${effectPower}!`);
              break;
          }
          
          // Add effect to player effects list
          return {
            playerHealth: newPlayerHealth,
            playerEffects: [...state.playerEffects, statusEffect]
          };
        });
      }
    },
    
    // Update status effects at the end of a turn
    updateStatusEffects: () => {
      set(state => {
        const { playerEffects, enemyEffects, currentTurn } = state;
        let newPlayerHealth = state.playerHealth;
        let newEnemyHealth = state.enemyHealth;
        
        // Process effects that happen over time
        const updatedPlayerEffects = playerEffects
          .map(effect => {
            // Apply effect damage/healing
            if (effect.effect === 'burn' && currentTurn === 'player') {
              newPlayerHealth = Math.max(0, newPlayerHealth - effect.power);
              toast.info(`Burn effect deals ${effect.power} damage to you!`);
            }
            
            // Reduce duration by 1 if it's the end of the turn
            return {
              ...effect,
              duration: currentTurn === 'enemy' ? effect.duration - 1 : effect.duration
            };
          })
          .filter(effect => effect.duration > 0); // Remove expired effects
          
        const updatedEnemyEffects = enemyEffects
          .map(effect => {
            // Apply effect damage/healing
            if (effect.effect === 'burn' && currentTurn === 'enemy') {
              newEnemyHealth = Math.max(0, newEnemyHealth - effect.power);
              toast.info(`Burn effect deals ${effect.power} damage to enemy!`);
            }
            
            // Reduce duration by 1 if it's the end of the turn
            return {
              ...effect,
              duration: currentTurn === 'player' ? effect.duration - 1 : effect.duration
            };
          })
          .filter(effect => effect.duration > 0); // Remove expired effects
        
        // Check if player is defeated by status effects
        if (newPlayerHealth <= 0) {
          get().endBattle('lose');
          return { playerHealth: 0 };
        }
        
        // Check if enemy is defeated by status effects
        if (newEnemyHealth <= 0) {
          get().endBattle('win');
          return { enemyHealth: 0 };
        }
        
        return {
          playerHealth: newPlayerHealth,
          enemyHealth: newEnemyHealth,
          playerEffects: updatedPlayerEffects,
          enemyEffects: updatedEnemyEffects
        };
      });
    },
    
    // Get a user-friendly message for effect
    getEffectMessage: (effect, power, target) => {
      switch (effect) {
        case 'stun': return `${target} is stunned and will skip next turn`;
        case 'heal': return `Heals ${power} health`;
        case 'shield': return `Blocks ${power} damage`;
        case 'burn': return `Deals ${power} damage over time`;
        case 'leech': return `Steals ${power} health from ${target}`;
        case 'boost': return `Increases power by ${power}`;
        case 'weaken': return `Reduces ${target}'s power by ${power}`;
        case 'double_attack': return `Attacks twice in one turn`;
        case 'reflect': return `Reflects ${power}% of damage back`;
        case 'freeze': return `${target} can't use special abilities`;
        default: return '';
      }
    }
  }))
);
