import { 
  users, type User, type InsertUser,
  bridgeTransactions, type BridgeTransaction, type InsertBridgeTransaction,
  supplyChecks, type SupplyCheck, type InsertSupplyCheck,
  networkStatus, type NetworkStatus, type InsertNetworkStatus,
  layerZeroTransactions, type LayerZeroTransaction, type InsertLayerZeroTransaction
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Bridge Transactions
  getBridgeTransaction(id: number): Promise<BridgeTransaction | undefined>;
  getBridgeTransactionsByAddress(address: string): Promise<BridgeTransaction[]>;
  createBridgeTransaction(transaction: InsertBridgeTransaction): Promise<BridgeTransaction>;
  
  // Supply Checks
  getSupplyCheck(id: number): Promise<SupplyCheck | undefined>;
  getAllSupplyChecks(): Promise<SupplyCheck[]>;
  createSupplyCheck(check: InsertSupplyCheck): Promise<SupplyCheck>;
  
  // Network Status
  getNetworkStatus(id: string): Promise<NetworkStatus | undefined>;
  getAllNetworkStatus(): Promise<NetworkStatus[]>;
  upsertNetworkStatus(status: InsertNetworkStatus): Promise<NetworkStatus>;
  
  // LayerZero Transactions
  getLayerZeroTransaction(id: number): Promise<LayerZeroTransaction | undefined>;
  getLayerZeroTransactionByHash(hash: string): Promise<LayerZeroTransaction | undefined>;
  getLayerZeroTransactionsByAddress(address: string): Promise<LayerZeroTransaction[]>;
  getLayerZeroTransactionsByStatus(status: string): Promise<LayerZeroTransaction[]>;
  createLayerZeroTransaction(transaction: InsertLayerZeroTransaction): Promise<LayerZeroTransaction>;
  updateLayerZeroTransaction(id: number, updates: Partial<InsertLayerZeroTransaction>): Promise<LayerZeroTransaction>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getBridgeTransaction(id: number): Promise<BridgeTransaction | undefined> {
    const [tx] = await db
      .select()
      .from(bridgeTransactions)
      .where(eq(bridgeTransactions.id, id));
    return tx;
  }

  async getBridgeTransactionsByAddress(address: string): Promise<BridgeTransaction[]> {
    const lowerAddress = address.toLowerCase();
    return db
      .select()
      .from(bridgeTransactions)
      .where(sql`LOWER(${bridgeTransactions.walletAddress}) = ${lowerAddress}`)
      .orderBy(desc(bridgeTransactions.createdAt));
  }

  async createBridgeTransaction(transaction: InsertBridgeTransaction): Promise<BridgeTransaction> {
    const [tx] = await db
      .insert(bridgeTransactions)
      .values(transaction)
      .returning();
    return tx;
  }

  async getSupplyCheck(id: number): Promise<SupplyCheck | undefined> {
    const [check] = await db
      .select()
      .from(supplyChecks)
      .where(eq(supplyChecks.id, id));
    return check;
  }

  async getAllSupplyChecks(): Promise<SupplyCheck[]> {
    return db
      .select()
      .from(supplyChecks)
      .orderBy(desc(supplyChecks.date));
  }

  async createSupplyCheck(check: InsertSupplyCheck): Promise<SupplyCheck> {
    const [newCheck] = await db
      .insert(supplyChecks)
      .values(check)
      .returning();
    return newCheck;
  }

  async getNetworkStatus(id: string): Promise<NetworkStatus | undefined> {
    const [status] = await db
      .select()
      .from(networkStatus)
      .where(eq(networkStatus.networkId, id));
    return status;
  }

  async getAllNetworkStatus(): Promise<NetworkStatus[]> {
    return db.select().from(networkStatus);
  }

  async upsertNetworkStatus(status: InsertNetworkStatus): Promise<NetworkStatus> {
    // Check if exists first
    const [existing] = await db
      .select()
      .from(networkStatus)
      .where(eq(networkStatus.networkId, status.networkId));
    
    if (existing) {
      // Update
      const [updated] = await db
        .update(networkStatus)
        .set({
          ...status,
          updatedAt: new Date()
        })
        .where(eq(networkStatus.networkId, status.networkId))
        .returning();
      return updated;
    } else {
      // Insert
      const [newStatus] = await db
        .insert(networkStatus)
        .values(status)
        .returning();
      return newStatus;
    }
  }

  async getLayerZeroTransaction(id: number): Promise<LayerZeroTransaction | undefined> {
    try {
      const [tx] = await db
        .select()
        .from(layerZeroTransactions)
        .where(eq(layerZeroTransactions.id, id));
      return tx;
    } catch (error) {
      console.error(`Error fetching transaction ${id}:`, error);
      return undefined;
    }
  }

  async getLayerZeroTransactionByHash(hash: string): Promise<LayerZeroTransaction | undefined> {
    try {
      // Try to find by source hash first
      const [sourceTx] = await db
        .select()
        .from(layerZeroTransactions)
        .where(eq(layerZeroTransactions.sourceTxHash, hash));

      if (sourceTx) return sourceTx;

      // If not found, try by destination hash
      const [destTx] = await db
        .select()
        .from(layerZeroTransactions)
        .where(eq(layerZeroTransactions.destinationTxHash, hash));

      return destTx;
    } catch (error) {
      console.error(`Error fetching transaction by hash ${hash}:`, error);
      return undefined;
    }
  }

  async getLayerZeroTransactionsByAddress(address: string): Promise<LayerZeroTransaction[]> {
    try {
      // Convert address to lowercase for case-insensitive comparison
      const lowerAddress = address.toLowerCase();
      
      const results = await db
        .select()
        .from(layerZeroTransactions)
        .where(sql`LOWER(${layerZeroTransactions.walletAddress}) = ${lowerAddress}`)
        .orderBy(desc(layerZeroTransactions.createdAt));
      
      return results;
    } catch (error) {
      console.error(`Error fetching transactions for address ${address}:`, error);
      return [];
    }
  }

  async getLayerZeroTransactionsByStatus(status: string): Promise<LayerZeroTransaction[]> {
    try {
      // If status is "all", return all transactions, otherwise filter by status
      const query = status === "all" 
        ? db.select().from(layerZeroTransactions)
        : db.select().from(layerZeroTransactions).where(eq(layerZeroTransactions.status, status));
      
      const results = await query.orderBy(desc(layerZeroTransactions.createdAt));
      
      return results;
    } catch (error) {
      console.error(`Error fetching transactions with status ${status}:`, error);
      return [];
    }
  }

  async createLayerZeroTransaction(transaction: InsertLayerZeroTransaction): Promise<LayerZeroTransaction> {
    try {
      // Set default values for nullable fields if they're undefined
      const processedTransaction = {
        ...transaction,
        status: transaction.status || 'pending',
        data: transaction.data || null,
        error: transaction.error || null,
        messageId: transaction.messageId || null,
        destinationChain: transaction.destinationChain || null,
        destinationTxHash: transaction.destinationTxHash || null,
      };
      
      const [createdTx] = await db
        .insert(layerZeroTransactions)
        .values(processedTransaction)
        .returning();
      
      return createdTx;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  async updateLayerZeroTransaction(id: number, updates: Partial<InsertLayerZeroTransaction>): Promise<LayerZeroTransaction> {
    try {
      // Check if the transaction exists
      const [existingTx] = await db
        .select()
        .from(layerZeroTransactions)
        .where(eq(layerZeroTransactions.id, id));
      
      if (!existingTx) {
        throw new Error(`LayerZero transaction with ID ${id} not found`);
      }
      
      // Add updatedAt timestamp
      const [updatedTx] = await db
        .update(layerZeroTransactions)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(layerZeroTransactions.id, id))
        .returning();
      
      return updatedTx;
    } catch (error) {
      console.error(`Error updating transaction ${id}:`, error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();