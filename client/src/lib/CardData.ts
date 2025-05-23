// Card data and generation system for the game

// Card type definitions
export type CardType = 'spell' | 'creature' | 'artifact';
export type CardRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type CreatureType = 'dragon' | 'elemental' | 'beast' | 'undead' | 'golem';

// Card generation source - where the card comes from
export type CardSource = 'starter' | 'pack' | 'enemy' | 'reward';

// Card special effects
export type CardEffect = 
  | 'none' 
  | 'stun'           // Skip opponent's next turn
  | 'heal'           // Restore health
  | 'shield'         // Reduce next attack damage
  | 'burn'           // Deal damage over time
  | 'leech'          // Steal health from opponent
  | 'boost'          // Increase power
  | 'weaken'         // Decrease opponent's power
  | 'double_attack'  // Attack twice in one turn
  | 'reflect'        // Reflect portion of damage back
  | 'freeze';        // Opponent can't use special abilities

// Card interface
export interface Card {
  id: string;
  name: string;
  description: string;
  type: CardType;
  rarity: CardRarity;
  power: number;
  cost: number;
  creatureType: CreatureType;
  color: string;
  effect?: CardEffect;     // Special effect this card applies
  effectPower?: number;    // How strong the effect is
  effectDuration?: number; // How many turns the effect lasts
  unlockLevel?: number;    // Level required to unlock this card (for progression)
}

// Card name components for procedural generation
const namePrefix = [
  'Arcane', 'Mystic', 'Enchanted', 'Feral', 'Ancient', 
  'Shadow', 'Crystal', 'Blazing', 'Frost', 'Emerald',
  'Ethereal', 'Vengeful', 'Cursed', 'Sacred', 'Corrupted',
  'Celestial', 'Void', 'Runic', 'Divine', 'Primal'
];

const nameCore = [
  'Dragon', 'Elemental', 'Beast', 'Guardian', 'Mage',
  'Warrior', 'Sprite', 'Spirit', 'Golem', 'Knight',
  'Sorcerer', 'Wyrm', 'Demon', 'Angel', 'Scout',
  'Titan', 'Phoenix', 'Specter', 'Djinn', 'Druid'
];

const nameSuffix = [
  'of Power', 'of Wisdom', 'of Protection', 'of Destruction', 'of Time',
  'of Eternity', 'of the Sky', 'of the Deep', 'of Flames', 'of Frost',
  'of Legends', 'of Shadows', 'of Light', 'of Doom', 'of Fortune',
  'of Fate', 'of the Void', 'of the Ancients', 'of Mystery', 'of Vengeance'
];

// Card description templates
const descriptionTemplates = [
  'A powerful card that deals {power} damage to enemies.',
  'Summons a {creatureType} with {power} attack power.',
  'An ancient artifact that grants {power} power to its wielder.',
  'Conjures a magical {creatureType} to fight for you.',
  'An enchanted being with {power} strength.',
  'A mystical {creatureType} from the realm of shadows.',
  'Unleashes {power} points of elemental energy.',
  'A rare {creatureType} known for its {power} attack damage.',
  'Channels the power of {power} magical spirits.',
  'A legendary creature with devastating {power} attack.'
];

// Card colors by rarity
const rarityColors: Record<CardRarity, string[]> = {
  common: ['#78909c', '#90a4ae', '#b0bec5'],
  uncommon: ['#4caf50', '#66bb6a', '#81c784'],
  rare: ['#2196f3', '#42a5f5', '#64b5f6'],
  epic: ['#9c27b0', '#ab47bc', '#ba68c8'],
  legendary: ['#ff9800', '#ffa726', '#ffb74d']
};

// Generate a unique ID for cards
const generateCardId = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

// Generate a random card name
const generateCardName = (): string => {
  const prefix = namePrefix[Math.floor(Math.random() * namePrefix.length)];
  const core = nameCore[Math.floor(Math.random() * nameCore.length)];
  
  // 50% chance to add a suffix
  if (Math.random() > 0.5) {
    const suffix = nameSuffix[Math.floor(Math.random() * nameSuffix.length)];
    return `${prefix} ${core} ${suffix}`;
  }
  
  return `${prefix} ${core}`;
};

// Generate a card description
const generateCardDescription = (power: number, creatureType: CreatureType): string => {
  const template = descriptionTemplates[Math.floor(Math.random() * descriptionTemplates.length)];
  return template
    .replace('{power}', power.toString())
    .replace('{creatureType}', creatureType);
};

// Generate a random card color based on rarity
const getCardColor = (rarity: CardRarity): string => {
  const colors = rarityColors[rarity];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Calculate card power based on rarity and level
const calculateCardPower = (rarity: CardRarity, level: number = 1): number => {
  const baseValues: Record<CardRarity, number> = {
    common: 5,
    uncommon: 10,
    rare: 15,
    epic: 20,
    legendary: 30
  };
  
  const baseValue = baseValues[rarity];
  // Add randomness and level scaling
  const levelBonus = (level - 1) * 3;
  const randomFactor = Math.floor(Math.random() * 6) - 2; // -2 to +3
  
  return baseValue + levelBonus + randomFactor;
};

// Determine card rarity based on source and luck
const determineRarity = (source: CardSource, level: number = 1): CardRarity => {
  // Base chance values
  let legendaryChance = 0.01;
  let epicChance = 0.05;
  let rareChance = 0.15;
  let uncommonChance = 0.35;
  
  // Adjust chances based on source
  switch (source) {
    case 'starter':
      // Starter cards are always common
      return 'common';
      
    case 'enemy':
      // Enemy drops get better with level
      legendaryChance += level * 0.01;
      epicChance += level * 0.02;
      rareChance += level * 0.03;
      break;
      
    case 'reward':
      // Rewards are generally better
      legendaryChance += 0.05;
      epicChance += 0.10;
      rareChance += 0.15;
      break;
      
    case 'pack':
      // Packs have standard chances but scale with luck
      legendaryChance += Math.random() * 0.05;
      epicChance += Math.random() * 0.10;
      rareChance += Math.random() * 0.15;
      break;
  }
  
  // Roll for rarity
  const roll = Math.random();
  if (roll < legendaryChance) return 'legendary';
  if (roll < legendaryChance + epicChance) return 'epic';
  if (roll < legendaryChance + epicChance + rareChance) return 'rare';
  if (roll < legendaryChance + epicChance + rareChance + uncommonChance) return 'uncommon';
  return 'common';
};

// Get a random creature type
const getRandomCreatureType = (): CreatureType => {
  const types: CreatureType[] = ['dragon', 'elemental', 'beast', 'undead', 'golem'];
  return types[Math.floor(Math.random() * types.length)];
};

// Helper function to get effect description
const getEffectDescription = (effect: CardEffect, power: number, duration: number): string => {
  switch (effect) {
    case 'stun': return `Stuns opponent for ${duration} turn${duration > 1 ? 's' : ''}.`;
    case 'heal': return `Heals ${power} health.`;
    case 'shield': return `Blocks ${power} damage for ${duration} turn${duration > 1 ? 's' : ''}.`;
    case 'burn': return `Deals ${power} damage over ${duration} turn${duration > 1 ? 's' : ''}.`;
    case 'leech': return `Steals ${power} health from opponent.`;
    case 'boost': return `Increases power by ${power} for ${duration} turn${duration > 1 ? 's' : ''}.`;
    case 'weaken': return `Reduces opponent's power by ${power} for ${duration} turn${duration > 1 ? 's' : ''}.`;
    case 'double_attack': return `Attacks twice in one turn.`;
    case 'reflect': return `Reflects ${power}% of damage back to attacker.`;
    case 'freeze': return `Prevents opponent from using effects for ${duration} turn${duration > 1 ? 's' : ''}.`;
    default: return '';
  }
};

// Generate a complete card
export const generateCard = (source: CardSource = 'pack', level: number = 1): Card => {
  // Determine card properties based on source and level
  const rarity = determineRarity(source, level);
  const power = calculateCardPower(rarity, level);
  const creatureType = getRandomCreatureType();
  const color = getCardColor(rarity);
  
  // Random card type with higher chance for creatures
  const typeRoll = Math.random();
  let type: CardType;
  if (typeRoll < 0.6) {
    type = 'creature';
  } else if (typeRoll < 0.85) {
    type = 'spell';
  } else {
    type = 'artifact';
  }
  
  // Add special effects based on rarity and level
  let effect: CardEffect = 'none';
  let effectPower = 0;
  let effectDuration = 0;
  let unlockLevel = 1;
  
  // Higher rarity cards have better chances for special effects
  const effectChance = {
    common: 0.1,
    uncommon: 0.3,
    rare: 0.6,
    epic: 0.8,
    legendary: 1.0
  };
  
  // Only add effects to higher rarity cards and based on chance
  if (Math.random() < effectChance[rarity]) {
    // Choose an appropriate effect based on card type
    if (type === 'creature') {
      // Creature effects
      const creatureEffects: CardEffect[] = ['leech', 'double_attack', 'shield', 'boost'];
      effect = creatureEffects[Math.floor(Math.random() * creatureEffects.length)];
      unlockLevel = effect === 'double_attack' ? 5 : (effect === 'leech' ? 3 : 1);
    } else if (type === 'spell') {
      // Spell effects
      const spellEffects: CardEffect[] = ['stun', 'burn', 'freeze', 'weaken', 'heal'];
      effect = spellEffects[Math.floor(Math.random() * spellEffects.length)];
      unlockLevel = effect === 'freeze' ? 8 : (effect === 'stun' ? 6 : (effect === 'burn' ? 4 : 2));
    } else {
      // Artifact effects
      const artifactEffects: CardEffect[] = ['shield', 'reflect', 'boost'];
      effect = artifactEffects[Math.floor(Math.random() * artifactEffects.length)];
      unlockLevel = effect === 'reflect' ? 7 : (effect === 'boost' ? 4 : 1);
    }
    
    // Effect power scales with rarity
    effectPower = Math.floor(power * 0.3) + Math.floor(Math.random() * 5);
    
    // Effect duration 1-3 turns
    effectDuration = rarity === 'legendary' ? 3 : (rarity === 'epic' || rarity === 'rare' ? 2 : 1);
  }
  
  // Generate name
  const name = generateCardName();
  
  // Generate description with effects
  let description = generateCardDescription(power, creatureType);
  if (effect !== 'none') {
    description += ` ${getEffectDescription(effect, effectPower, effectDuration)}`;
  }
  
  return {
    id: generateCardId(),
    name,
    description,
    type,
    rarity,
    power,
    cost: Math.ceil(power / 3), // Cost scales with power
    creatureType,
    color,
    effect,
    effectPower,
    effectDuration,
    unlockLevel
  };
};

// Get color based on rarity name (for UI display)
export const getRarityColor = (rarity: CardRarity): string => {
  const colors = rarityColors[rarity];
  return colors[0]; // Return the primary color for this rarity
};

// Get a display name for rarity
export const getRarityDisplayName = (rarity: CardRarity): string => {
  return rarity.charAt(0).toUpperCase() + rarity.slice(1);
};
