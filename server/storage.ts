import { 
  users, 
  playerProgress, 
  cards, 
  gameState, 
  battleHistory,
  type User, 
  type InsertUser,
  type PlayerProgress,
  type InsertPlayerProgress,
  type Card as CardModel,
  type InsertCard,
  type GameState,
  type InsertGameState,
  type BattleHistory,
  type InsertBattleHistory
} from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-serverless";
import { neon, neonConfig } from '@neondatabase/serverless';

// Storage interface
export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateLastLogin(userId: number): Promise<void>;
  
  // Player progress
  getPlayerProgress(userId: number): Promise<PlayerProgress | undefined>;
  createPlayerProgress(progress: InsertPlayerProgress): Promise<PlayerProgress>;
  updatePlayerProgress(userId: number, progress: Partial<InsertPlayerProgress>): Promise<PlayerProgress>;
  
  // Card management
  getPlayerCards(userId: number): Promise<CardModel[]>;
  addCard(card: InsertCard): Promise<CardModel>;
  updateCardDeckStatus(userId: number, cardId: number, inDeck: boolean): Promise<CardModel | undefined>;
  
  // Game state
  saveGameState(state: InsertGameState): Promise<GameState>;
  getGameState(userId: number): Promise<GameState | undefined>;
  
  // Battle history
  recordBattle(battle: InsertBattleHistory): Promise<BattleHistory>;
  getBattleHistory(userId: number): Promise<BattleHistory[]>;
}

// PostgreSQL implementation
export class PostgresStorage implements IStorage {
  private db: ReturnType<typeof drizzle>;
  
  constructor(connectionString: string) {
    // Configure neon for serverless environments
    neonConfig.fetchConnectionCache = true;
    
    // Create SQL connection
    const sql = neon(connectionString);
    
    // Initialize drizzle ORM
    this.db = drizzle(sql);
  }
  
  // === User Management ===
  
  async getUser(id: number): Promise<User | undefined> {
    const results = await this.db.select().from(users).where(eq(users.id, id));
    return results[0];
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const results = await this.db.select().from(users).where(eq(users.username, username));
    return results[0];
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const results = await this.db.insert(users).values(user).returning();
    return results[0];
  }
  
  async updateLastLogin(userId: number): Promise<void> {
    await this.db.update(users)
      .set({ last_login: new Date() })
      .where(eq(users.id, userId));
  }
  
  // === Player Progress ===
  
  async getPlayerProgress(userId: number): Promise<PlayerProgress | undefined> {
    const results = await this.db.select()
      .from(playerProgress)
      .where(eq(playerProgress.user_id, userId));
    return results[0];
  }
  
  async createPlayerProgress(progress: InsertPlayerProgress): Promise<PlayerProgress> {
    const results = await this.db.insert(playerProgress)
      .values(progress)
      .returning();
    return results[0];
  }
  
  async updatePlayerProgress(
    userId: number, 
    progress: Partial<InsertPlayerProgress>
  ): Promise<PlayerProgress> {
    const updateData = {
      ...progress,
      updated_at: new Date()
    };
    
    const results = await this.db.update(playerProgress)
      .set(updateData)
      .where(eq(playerProgress.user_id, userId))
      .returning();
    
    return results[0];
  }
  
  // === Card Management ===
  
  async getPlayerCards(userId: number): Promise<CardModel[]> {
    return await this.db.select()
      .from(cards)
      .where(eq(cards.user_id, userId));
  }
  
  async addCard(card: InsertCard): Promise<CardModel> {
    const results = await this.db.insert(cards)
      .values(card)
      .returning();
    return results[0];
  }
  
  async updateCardDeckStatus(
    userId: number, 
    cardId: number, 
    inDeck: boolean
  ): Promise<CardModel | undefined> {
    // Find the card first to ensure it belongs to the user
    const cardResults = await this.db.select()
      .from(cards)
      .where(and(
        eq(cards.id, cardId),
        eq(cards.user_id, userId)
      ));
    
    if (cardResults.length === 0) {
      return undefined;
    }
    
    // Update the card
    const results = await this.db.update(cards)
      .set({ in_deck: inDeck })
      .where(and(
        eq(cards.id, cardId),
        eq(cards.user_id, userId)
      ))
      .returning();
    
    return results[0];
  }
  
  // === Game State ===
  
  async saveGameState(state: InsertGameState): Promise<GameState> {
    // Check if state already exists for user
    const existingState = await this.db.select()
      .from(gameState)
      .where(eq(gameState.user_id, state.user_id));
    
    if (existingState.length > 0) {
      // Update existing state
      const results = await this.db.update(gameState)
        .set({
          map_state: state.map_state,
          last_saved: new Date()
        })
        .where(eq(gameState.user_id, state.user_id))
        .returning();
      return results[0];
    } else {
      // Create new state
      const results = await this.db.insert(gameState)
        .values(state)
        .returning();
      return results[0];
    }
  }
  
  async getGameState(userId: number): Promise<GameState | undefined> {
    const results = await this.db.select()
      .from(gameState)
      .where(eq(gameState.user_id, userId));
    return results[0];
  }
  
  // === Battle History ===
  
  async recordBattle(battle: InsertBattleHistory): Promise<BattleHistory> {
    const results = await this.db.insert(battleHistory)
      .values(battle)
      .returning();
    return results[0];
  }
  
  async getBattleHistory(userId: number): Promise<BattleHistory[]> {
    return await this.db.select()
      .from(battleHistory)
      .where(eq(battleHistory.user_id, userId))
      .orderBy(desc(battleHistory.battle_time));
  }
}

// Memory storage implementation for development/testing
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private progress: Map<number, PlayerProgress>;
  private userCards: Map<number, CardModel[]>;
  private userGameStates: Map<number, GameState>;
  private userBattles: Map<number, BattleHistory[]>;
  private currentId: number;
  
  constructor() {
    this.users = new Map();
    this.progress = new Map();
    this.userCards = new Map();
    this.userGameStates = new Map();
    this.userBattles = new Map();
    this.currentId = 1;
  }
  
  // === User Management ===
  
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id,
      created_at: now,
      last_login: now
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateLastLogin(userId: number): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.last_login = new Date();
      this.users.set(userId, user);
    }
  }
  
  // === Player Progress ===
  
  async getPlayerProgress(userId: number): Promise<PlayerProgress | undefined> {
    return this.progress.get(userId);
  }
  
  async createPlayerProgress(progress: InsertPlayerProgress): Promise<PlayerProgress> {
    const id = this.currentId++;
    const now = new Date();
    const playerProgress: PlayerProgress = {
      ...progress,
      id,
      created_at: now,
      updated_at: now
    };
    this.progress.set(progress.user_id, playerProgress);
    return playerProgress;
  }
  
  async updatePlayerProgress(
    userId: number, 
    progressUpdate: Partial<InsertPlayerProgress>
  ): Promise<PlayerProgress> {
    const existingProgress = this.progress.get(userId);
    if (!existingProgress) {
      throw new Error("Player progress not found");
    }
    
    const updatedProgress: PlayerProgress = {
      ...existingProgress,
      ...progressUpdate,
      updated_at: new Date()
    };
    
    this.progress.set(userId, updatedProgress);
    return updatedProgress;
  }
  
  // === Card Management ===
  
  async getPlayerCards(userId: number): Promise<CardModel[]> {
    return this.userCards.get(userId) || [];
  }
  
  async addCard(card: InsertCard): Promise<CardModel> {
    const id = this.currentId++;
    const newCard: CardModel = {
      ...card,
      id,
      acquired_at: new Date()
    };
    
    const userCards = this.userCards.get(card.user_id) || [];
    userCards.push(newCard);
    this.userCards.set(card.user_id, userCards);
    
    return newCard;
  }
  
  async updateCardDeckStatus(
    userId: number, 
    cardId: number, 
    inDeck: boolean
  ): Promise<CardModel | undefined> {
    const userCards = this.userCards.get(userId) || [];
    const cardIndex = userCards.findIndex(card => card.id === cardId);
    
    if (cardIndex === -1) {
      return undefined;
    }
    
    userCards[cardIndex].in_deck = inDeck;
    this.userCards.set(userId, userCards);
    
    return userCards[cardIndex];
  }
  
  // === Game State ===
  
  async saveGameState(state: InsertGameState): Promise<GameState> {
    const id = this.currentId++;
    const newState: GameState = {
      ...state,
      id,
      last_saved: new Date()
    };
    
    this.userGameStates.set(state.user_id, newState);
    return newState;
  }
  
  async getGameState(userId: number): Promise<GameState | undefined> {
    return this.userGameStates.get(userId);
  }
  
  // === Battle History ===
  
  async recordBattle(battle: InsertBattleHistory): Promise<BattleHistory> {
    const id = this.currentId++;
    const newBattle: BattleHistory = {
      ...battle,
      id,
      battle_time: new Date()
    };
    
    const userBattles = this.userBattles.get(battle.user_id) || [];
    userBattles.push(newBattle);
    this.userBattles.set(battle.user_id, userBattles);
    
    return newBattle;
  }
  
  async getBattleHistory(userId: number): Promise<BattleHistory[]> {
    return this.userBattles.get(userId) || [];
  }
}

// Determine which storage implementation to use
const usePostgres = process.env.DATABASE_URL && process.env.NODE_ENV === 'production';

export const storage: IStorage = usePostgres 
  ? new PostgresStorage(process.env.DATABASE_URL!)
  : new MemStorage();
