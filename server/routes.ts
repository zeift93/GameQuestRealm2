import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { hash, compare } from "bcrypt";
import * as z from "zod";
import { insertUserSchema, insertCardSchema, insertProgressSchema, insertGameStateSchema } from "@shared/schema";
import { eq } from "drizzle-orm";

// Session data type
interface SessionData {
  userId: number;
}

declare module "express-session" {
  interface SessionData {
    user: SessionData;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);
  
  // === User Authentication Routes ===
  
  // Register a new user
  app.post("/api/auth/register", async (req, res) => {
    try {
      // Validate request body
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already taken" });
      }
      
      // Hash password
      const hashedPassword = await hash(validatedData.password, 10);
      
      // Create user
      const user = await storage.createUser({
        username: validatedData.username,
        password: hashedPassword
      });
      
      // Initialize player progress
      await storage.createPlayerProgress({
        user_id: user.id,
        level: 1,
        experience: 0,
        position_x: 0,
        position_z: 0,
        max_health: 100,
        current_health: 100
      });
      
      // Create initial starter card
      await storage.addCard({
        user_id: user.id,
        card_id: "starter-1",
        name: "Arcane Initiate",
        description: "Your first magical companion.",
        type: "creature",
        rarity: "common",
        power: 5,
        cost: 2,
        creature_type: "elemental",
        color: "#78909c",
        in_deck: true
      });
      
      // Set session
      if (req.session) {
        req.session.user = { userId: user.id };
      }
      
      return res.status(201).json({ message: "Registration successful", userId: user.id });
    } catch (error) {
      console.error("Registration error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      return res.status(500).json({ message: "Registration failed" });
    }
  });
  
  // Login user
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Find user
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Check password
      const passwordMatch = await compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Update last login
      await storage.updateLastLogin(user.id);
      
      // Set session
      if (req.session) {
        req.session.user = { userId: user.id };
      }
      
      return res.status(200).json({ message: "Login successful", userId: user.id });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Login failed" });
    }
  });
  
  // Logout user
  app.post("/api/auth/logout", (req, res) => {
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ message: "Logout failed" });
        }
        res.clearCookie("connect.sid");
        return res.status(200).json({ message: "Logout successful" });
      });
    } else {
      return res.status(200).json({ message: "No active session" });
    }
  });
  
  // Check if user is authenticated
  app.get("/api/auth/check", (req, res) => {
    if (req.session && req.session.user) {
      return res.status(200).json({ authenticated: true, userId: req.session.user.userId });
    }
    return res.status(200).json({ authenticated: false });
  });
  
  // === Game Data Routes ===
  
  // Auth middleware
  const authenticate = (req: any, res: any, next: any) => {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };
  
  // Get player progress
  app.get("/api/game/progress", authenticate, async (req, res) => {
    try {
      const userId = req.session.user.userId;
      const progress = await storage.getPlayerProgress(userId);
      
      if (!progress) {
        return res.status(404).json({ message: "Player progress not found" });
      }
      
      return res.status(200).json(progress);
    } catch (error) {
      console.error("Get progress error:", error);
      return res.status(500).json({ message: "Failed to retrieve player progress" });
    }
  });
  
  // Update player progress
  app.put("/api/game/progress", authenticate, async (req, res) => {
    try {
      const userId = req.session.user.userId;
      const progressData = req.body;
      
      // Validate data
      const validatedData = insertProgressSchema.partial().parse({
        ...progressData,
        user_id: userId
      });
      
      const updatedProgress = await storage.updatePlayerProgress(userId, validatedData);
      
      return res.status(200).json(updatedProgress);
    } catch (error) {
      console.error("Update progress error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      return res.status(500).json({ message: "Failed to update player progress" });
    }
  });
  
  // Get player's cards
  app.get("/api/game/cards", authenticate, async (req, res) => {
    try {
      const userId = req.session.user.userId;
      const cards = await storage.getPlayerCards(userId);
      
      return res.status(200).json(cards);
    } catch (error) {
      console.error("Get cards error:", error);
      return res.status(500).json({ message: "Failed to retrieve player cards" });
    }
  });
  
  // Add a new card
  app.post("/api/game/cards", authenticate, async (req, res) => {
    try {
      const userId = req.session.user.userId;
      const cardData = req.body;
      
      // Validate card data
      const validatedData = insertCardSchema.parse({
        ...cardData,
        user_id: userId
      });
      
      const newCard = await storage.addCard(validatedData);
      
      return res.status(201).json(newCard);
    } catch (error) {
      console.error("Add card error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      return res.status(500).json({ message: "Failed to add card" });
    }
  });
  
  // Update card (for adding to deck)
  app.put("/api/game/cards/:cardId", authenticate, async (req, res) => {
    try {
      const userId = req.session.user.userId;
      const cardId = parseInt(req.params.cardId);
      const { in_deck } = req.body;
      
      const updatedCard = await storage.updateCardDeckStatus(userId, cardId, in_deck);
      
      if (!updatedCard) {
        return res.status(404).json({ message: "Card not found" });
      }
      
      return res.status(200).json(updatedCard);
    } catch (error) {
      console.error("Update card error:", error);
      return res.status(500).json({ message: "Failed to update card" });
    }
  });
  
  // Save game state
  app.post("/api/game/state", authenticate, async (req, res) => {
    try {
      const userId = req.session.user.userId;
      const gameStateData = req.body;
      
      // Validate game state
      const validatedData = insertGameStateSchema.parse({
        ...gameStateData,
        user_id: userId
      });
      
      const savedState = await storage.saveGameState(validatedData);
      
      return res.status(201).json(savedState);
    } catch (error) {
      console.error("Save game state error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      return res.status(500).json({ message: "Failed to save game state" });
    }
  });
  
  // Get game state
  app.get("/api/game/state", authenticate, async (req, res) => {
    try {
      const userId = req.session.user.userId;
      const gameState = await storage.getGameState(userId);
      
      if (!gameState) {
        return res.status(404).json({ message: "Game state not found" });
      }
      
      return res.status(200).json(gameState);
    } catch (error) {
      console.error("Get game state error:", error);
      return res.status(500).json({ message: "Failed to retrieve game state" });
    }
  });
  
  // Record battle history
  app.post("/api/game/battles", authenticate, async (req, res) => {
    try {
      const userId = req.session.user.userId;
      const battleData = req.body;
      
      const battleRecord = await storage.recordBattle({
        ...battleData,
        user_id: userId
      });
      
      return res.status(201).json(battleRecord);
    } catch (error) {
      console.error("Record battle error:", error);
      return res.status(500).json({ message: "Failed to record battle" });
    }
  });
  
  // Get battle history
  app.get("/api/game/battles", authenticate, async (req, res) => {
    try {
      const userId = req.session.user.userId;
      const battleHistory = await storage.getBattleHistory(userId);
      
      return res.status(200).json(battleHistory);
    } catch (error) {
      console.error("Get battle history error:", error);
      return res.status(500).json({ message: "Failed to retrieve battle history" });
    }
  });

  return httpServer;
}
