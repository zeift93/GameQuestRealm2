import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Base user table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  last_login: timestamp("last_login"),
});

// Player progress data
export const playerProgress = pgTable("player_progress", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id).notNull(),
  level: integer("level").default(1).notNull(),
  experience: integer("experience").default(0).notNull(),
  position_x: integer("position_x").default(0).notNull(),
  position_z: integer("position_z").default(0).notNull(),
  max_health: integer("max_health").default(100).notNull(),
  current_health: integer("current_health").default(100).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Player's card collection
export const cards = pgTable("cards", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id).notNull(),
  card_id: text("card_id").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(),
  rarity: text("rarity").notNull(),
  power: integer("power").notNull(),
  cost: integer("cost").notNull(),
  creature_type: text("creature_type").notNull(),
  color: text("color").notNull(),
  in_deck: boolean("in_deck").default(false).notNull(),
  acquired_at: timestamp("acquired_at").defaultNow().notNull(),
});

// Game state for resuming sessions
export const gameState = pgTable("game_state", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id).notNull(),
  map_state: jsonb("map_state").notNull(),
  last_saved: timestamp("last_saved").defaultNow().notNull(),
});

// Battle history
export const battleHistory = pgTable("battle_history", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id).notNull(),
  enemy_level: integer("enemy_level").notNull(),
  outcome: text("outcome").notNull(), // 'win', 'lose', 'draw'
  player_cards_used: jsonb("player_cards_used").notNull(),
  enemy_cards_used: jsonb("enemy_cards_used").notNull(),
  battle_time: timestamp("battle_time").defaultNow().notNull(),
});

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertProgressSchema = createInsertSchema(playerProgress);
export const insertCardSchema = createInsertSchema(cards);
export const insertGameStateSchema = createInsertSchema(gameState);
export const insertBattleHistorySchema = createInsertSchema(battleHistory);

// Types for TypeScript
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type PlayerProgress = typeof playerProgress.$inferSelect;
export type InsertPlayerProgress = z.infer<typeof insertProgressSchema>;

export type Card = typeof cards.$inferSelect;
export type InsertCard = z.infer<typeof insertCardSchema>;

export type GameState = typeof gameState.$inferSelect;
export type InsertGameState = z.infer<typeof insertGameStateSchema>;

export type BattleHistory = typeof battleHistory.$inferSelect;
export type InsertBattleHistory = z.infer<typeof insertBattleHistorySchema>;

// Card type definitions for frontend/backend compatibility
export const cardTypeSchema = z.enum(["spell", "creature", "artifact"]);
export const cardRaritySchema = z.enum(["common", "uncommon", "rare", "epic", "legendary"]);
export const creatureTypeSchema = z.enum(["dragon", "elemental", "beast", "undead", "golem"]);

export type CardType = z.infer<typeof cardTypeSchema>;
export type CardRarity = z.infer<typeof cardRaritySchema>;
export type CreatureType = z.infer<typeof creatureTypeSchema>;
