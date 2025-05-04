import { 
  users, 
  bridgeTransactions, 
  supplyChecks, 
  networkStatus, 
  type User, 
  type InsertUser,
  type BridgeTransaction,
  type InsertBridgeTransaction,
  type SupplyCheck,
  type InsertSupplyCheck,
  type NetworkStatus,
  type InsertNetworkStatus
} from "@shared/schema";
import { AVAILABLE_NETWORKS } from "../client/src/lib/constants";

// modify the interface with any CRUD methods
// you might need
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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private bridgeTransactions: Map<number, BridgeTransaction>;
  private supplyChecks: Map<number, SupplyCheck>;
  private networkStatus: Map<string, NetworkStatus>;
  
  currentUserId: number;
  currentBridgeTransactionId: number;
  currentSupplyCheckId: number;
  currentNetworkStatusId: number;

  constructor() {
    this.users = new Map();
    this.bridgeTransactions = new Map();
    this.supplyChecks = new Map();
    this.networkStatus = new Map();
    
    this.currentUserId = 1;
    this.currentBridgeTransactionId = 1;
    this.currentSupplyCheckId = 1;
    this.currentNetworkStatusId = 1;
    
    // Initialize with some default data
    this.initializeData();
  }
  
  private initializeData() {
    // Initialize network status
    AVAILABLE_NETWORKS.forEach((network, index) => {
      const networkData: NetworkStatus = {
        id: this.currentNetworkStatusId++,
        networkId: network.id,
        name: network.name,
        chainId: network.chainId,
        status: network.status,
        latency: network.latency,
        gasPrice: network.gasPrice.toString(),
        txCount: network.txCount,
        updatedAt: new Date()
      };
      
      this.networkStatus.set(network.id, networkData);
    });
    
    // Initialize supply checks (these match the data in INITIAL_SUPPLY_CHECKS from constants.ts)
    const supplyCheckData = [
      {
        chain: "Ethereum → Polygon",
        event: "checkSupply()",
        status: "Verified",
        details: "Supply consistency verified across chains"
      },
      {
        chain: "Arbitrum → Base",
        event: "checkSupply()",
        status: "Verified",
        details: "Supply consistency verified across chains"
      },
      {
        chain: "All Chains",
        event: "dailyAudit()",
        status: "Verified",
        details: "Daily audit completed successfully"
      },
      {
        chain: "Polygon → Arbitrum",
        event: "checkSupply()",
        status: "Reconciled",
        details: "Minor discrepancy resolved automatically"
      }
    ];
    
    const dates = [
      new Date("2025-05-04"),
      new Date("2025-05-03"),
      new Date("2025-05-02"),
      new Date("2025-05-01")
    ];
    
    supplyCheckData.forEach((check, index) => {
      const supplyCheck: SupplyCheck = {
        id: this.currentSupplyCheckId++,
        date: dates[index],
        chain: check.chain,
        event: check.event,
        status: check.status,
        details: check.details,
        createdAt: new Date()
      };
      
      this.supplyChecks.set(supplyCheck.id, supplyCheck);
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }
  
  // Bridge Transaction methods
  async getBridgeTransaction(id: number): Promise<BridgeTransaction | undefined> {
    return this.bridgeTransactions.get(id);
  }
  
  async getBridgeTransactionsByAddress(address: string): Promise<BridgeTransaction[]> {
    return Array.from(this.bridgeTransactions.values()).filter(
      (tx) => tx.walletAddress.toLowerCase() === address.toLowerCase()
    );
  }
  
  async createBridgeTransaction(transaction: InsertBridgeTransaction): Promise<BridgeTransaction> {
    const id = this.currentBridgeTransactionId++;
    const tx: BridgeTransaction = { ...transaction, id, createdAt: new Date() };
    this.bridgeTransactions.set(id, tx);
    return tx;
  }
  
  // Supply Check methods
  async getSupplyCheck(id: number): Promise<SupplyCheck | undefined> {
    return this.supplyChecks.get(id);
  }
  
  async getAllSupplyChecks(): Promise<SupplyCheck[]> {
    return Array.from(this.supplyChecks.values())
      .sort((a, b) => b.date.getTime() - a.date.getTime()); // Most recent first
  }
  
  async createSupplyCheck(check: InsertSupplyCheck): Promise<SupplyCheck> {
    const id = this.currentSupplyCheckId++;
    const supplyCheck: SupplyCheck = { 
      ...check, 
      id, 
      date: new Date(), 
      createdAt: new Date() 
    };
    this.supplyChecks.set(id, supplyCheck);
    return supplyCheck;
  }
  
  // Network Status methods
  async getNetworkStatus(id: string): Promise<NetworkStatus | undefined> {
    return this.networkStatus.get(id);
  }
  
  async getAllNetworkStatus(): Promise<NetworkStatus[]> {
    return Array.from(this.networkStatus.values());
  }
  
  async upsertNetworkStatus(status: InsertNetworkStatus): Promise<NetworkStatus> {
    const existing = this.networkStatus.get(status.networkId);
    
    if (existing) {
      // Update existing
      const updated: NetworkStatus = {
        ...existing,
        name: status.name,
        chainId: status.chainId,
        status: status.status,
        latency: status.latency,
        gasPrice: status.gasPrice,
        txCount: status.txCount,
        updatedAt: new Date()
      };
      
      this.networkStatus.set(status.networkId, updated);
      return updated;
    } else {
      // Create new
      const id = this.currentNetworkStatusId++;
      const newStatus: NetworkStatus = {
        ...status,
        id,
        updatedAt: new Date()
      };
      
      this.networkStatus.set(status.networkId, newStatus);
      return newStatus;
    }
  }
}

export const storage = new MemStorage();
