import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBridgeTransactionSchema, insertSupplyCheckSchema, insertNetworkStatusSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // GET: Network Status
  app.get("/api/networks", async (_req, res) => {
    try {
      const networks = await storage.getAllNetworkStatus();
      res.json(networks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch network status" });
    }
  });
  
  // GET: Supply Checks
  app.get("/api/supply-checks", async (_req, res) => {
    try {
      const checks = await storage.getAllSupplyChecks();
      res.json(checks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch supply checks" });
    }
  });
  
  // GET: Bridge Transactions for a wallet
  app.get("/api/bridge-transactions/:address", async (req, res) => {
    try {
      const address = req.params.address;
      const transactions = await storage.getBridgeTransactionsByAddress(address);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bridge transactions" });
    }
  });
  
  // POST: Create Bridge Transaction
  app.post("/api/bridge", async (req, res) => {
    try {
      const validateSchema = z.object({
        amount: z.number().positive(),
        fromChain: z.string(),
        toChain: z.string(),
        walletAddress: z.string()
      });
      
      const validated = validateSchema.parse(req.body);
      
      const parsedData = {
        amount: validated.amount.toString(),
        fromChain: validated.fromChain,
        toChain: validated.toChain,
        walletAddress: validated.walletAddress,
        status: "completed", // For this demo, assume all transactions complete successfully
        hash: `0x${Math.random().toString(16).substring(2, 34)}` // Generate a fake transaction hash
      };
      
      const transaction = await storage.createBridgeTransaction(parsedData);
      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create bridge transaction" });
      }
    }
  });
  
  // POST: Create Supply Check
  app.post("/api/supply-check", async (req, res) => {
    try {
      const data = insertSupplyCheckSchema.parse(req.body);
      const check = await storage.createSupplyCheck(data);
      res.status(201).json(check);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create supply check" });
      }
    }
  });
  
  // POST: Update Network Status
  app.post("/api/network-status", async (req, res) => {
    try {
      const data = insertNetworkStatusSchema.parse(req.body);
      const network = await storage.upsertNetworkStatus(data);
      res.status(201).json(network);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update network status" });
      }
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
