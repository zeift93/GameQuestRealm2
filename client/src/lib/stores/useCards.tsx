import { create } from "zustand";
import { generateCard, type Card } from "../CardData";
import { useCharacter } from "./useCharacter";
import { toast } from "sonner";

interface CardsState {
  cards: Card[];
  selectedCardIndex: number | null;
  
  // Card actions
  addCard: (card: Card) => void;
  addCardFromPack: () => Card;
  selectCard: (index: number) => void;
  removeCard: (index: number) => void;
  
  // Deck management
  deck: Card[];
  addToDeck: (cardIndex: number) => void;
  removeFromDeck: (cardIndex: number) => void;
  
  // Battle deck - cards available for the current battle
  getBattleCards: (count: number) => Card[];
}

export const useCards = create<CardsState>((set, get) => ({
  cards: [
    // Give player an initial card
    generateCard('starter')
  ],
  selectedCardIndex: 0,
  
  addCard: (card) => {
    set(state => ({ 
      cards: [...state.cards, card]
    }));
    
    // Notify user
    toast.success("New card acquired!", {
      description: `${card.name} has been added to your collection.`
    });
    
    // Award experience for collecting a card
    const { gainExperience } = useCharacter.getState();
    gainExperience(10);
  },
  
  addCardFromPack: () => {
    const newCard = generateCard();
    set(state => ({ 
      cards: [...state.cards, newCard]
    }));
    
    // Award experience for collecting a card
    const { gainExperience } = useCharacter.getState();
    gainExperience(25);
    
    return newCard;
  },
  
  selectCard: (index) => {
    if (index >= 0 && index < get().cards.length) {
      set({ selectedCardIndex: index });
    }
  },
  
  removeCard: (index) => {
    if (index >= 0 && index < get().cards.length) {
      const newCards = [...get().cards];
      newCards.splice(index, 1);
      
      // Update selected card index
      let newSelectedIndex = get().selectedCardIndex;
      if (newCards.length === 0) {
        newSelectedIndex = null;
      } else if (newSelectedIndex !== null && newSelectedIndex >= newCards.length) {
        newSelectedIndex = newCards.length - 1;
      }
      
      set({ 
        cards: newCards,
        selectedCardIndex: newSelectedIndex
      });
    }
  },
  
  // Deck management
  deck: [],
  
  addToDeck: (cardIndex) => {
    const card = get().cards[cardIndex];
    if (card && get().deck.length < 10) {
      set(state => ({ deck: [...state.deck, card] }));
      
      toast.success("Card added to deck", {
        description: `${card.name} has been added to your active deck.`
      });
    } else if (get().deck.length >= 10) {
      toast.error("Deck is full", {
        description: "You can only have 10 cards in your deck. Remove some first."
      });
    }
  },
  
  removeFromDeck: (cardIndex) => {
    const newDeck = [...get().deck];
    newDeck.splice(cardIndex, 1);
    set({ deck: newDeck });
    
    toast.info("Card removed from deck");
  },
  
  // Get battle cards - if deck is empty, use cards from collection
  getBattleCards: (count) => {
    const { cards, deck } = get();
    const sourceCards = deck.length > 0 ? deck : cards;
    
    // If there are fewer cards than requested, use all available
    if (sourceCards.length <= count) {
      return [...sourceCards];
    }
    
    // Otherwise pick random cards
    const battleCards: Card[] = [];
    const usedIndices = new Set<number>();
    
    while (battleCards.length < count && battleCards.length < sourceCards.length) {
      const randomIndex = Math.floor(Math.random() * sourceCards.length);
      if (!usedIndices.has(randomIndex)) {
        battleCards.push(sourceCards[randomIndex]);
        usedIndices.add(randomIndex);
      }
    }
    
    return battleCards;
  }
}));
