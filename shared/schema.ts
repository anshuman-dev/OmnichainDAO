import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  address: text("wallet_address"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Bridge Transaction schema
export const bridgeTransactions = pgTable("bridge_transactions", {
  id: serial("id").primaryKey(),
  fromChain: text("from_chain").notNull(),
  toChain: text("to_chain").notNull(),
  amount: text("amount").notNull(),
  walletAddress: text("wallet_address").notNull(),
  status: text("status").notNull().default("pending"),
  hash: text("transaction_hash"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Supply Check schema
export const supplyChecks = pgTable("supply_checks", {
  id: serial("id").primaryKey(),
  date: timestamp("date").defaultNow(),
  chain: text("chain").notNull(),
  event: text("event").notNull(),
  status: text("status").notNull(),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Network Status schema
export const networkStatus = pgTable("network_status", {
  id: serial("id").primaryKey(),
  networkId: text("network_id").notNull().unique(),
  name: text("name").notNull(),
  chainId: integer("chain_id").notNull(),
  status: text("status").notNull(),
  latency: integer("latency"),
  gasPrice: text("gas_price"),
  txCount: integer("tx_count"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  address: true,
});

export const insertBridgeTransactionSchema = createInsertSchema(bridgeTransactions).pick({
  fromChain: true,
  toChain: true,
  amount: true,
  walletAddress: true,
  status: true,
  hash: true,
});

export const insertSupplyCheckSchema = createInsertSchema(supplyChecks).pick({
  chain: true,
  event: true,
  status: true,
  details: true,
});

export const insertNetworkStatusSchema = createInsertSchema(networkStatus).pick({
  networkId: true,
  name: true,
  chainId: true,
  status: true,
  latency: true,
  gasPrice: true,
  txCount: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertBridgeTransaction = z.infer<typeof insertBridgeTransactionSchema>;
export type BridgeTransaction = typeof bridgeTransactions.$inferSelect;

export type InsertSupplyCheck = z.infer<typeof insertSupplyCheckSchema>;
export type SupplyCheck = typeof supplyChecks.$inferSelect;

export type InsertNetworkStatus = z.infer<typeof insertNetworkStatusSchema>;
export type NetworkStatus = typeof networkStatus.$inferSelect;
