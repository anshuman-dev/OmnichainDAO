import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertBridgeTransactionSchema, 
  insertSupplyCheckSchema, 
  insertNetworkStatusSchema,
  insertLayerZeroTransactionSchema
} from "@shared/schema";
import { z } from "zod";
import { ethers } from "ethers";
import fs from 'fs';
import path from 'path';

// Network configurations for LayerZero V2
const NETWORKS = [
  {
    id: "sepolia",
    name: "Ethereum Sepolia",
    chainId: 11155111,
    lzChainId: 40161,
    rpc: process.env.SEPOLIA_RPC || "https://sepolia.infura.io/v3/",
    isHub: true,
    color: "#627EEA"
  },
  {
    id: "amoy",
    name: "Polygon Amoy",
    chainId: 80002, 
    lzChainId: 40231,
    rpc: process.env.AMOY_RPC || "https://rpc-amoy.polygon.technology",
    isHub: false,
    color: "#8247E5"
  }
];

// ABI snippets for our contracts
const TOKEN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function getVotes(address) view returns (uint256)",
  "function delegate(address) returns ()"
];

const EXECUTOR_ABI = [
  "function createProposal(string, string, address[], bytes[]) returns (uint256)",
  "function getProposalDetails(uint256) view returns (string, string, address, uint8, uint256)",
  "function executeProposal(uint256, bytes) payable returns ()",
  "function isExecutedOnChain(uint256, uint32) view returns (bool)"
];

const DVN_MANAGER_ABI = [
  "function getSecurityScore(uint32) view returns (uint8)",
  "function estimateMessageFee(uint32, uint256) view returns (uint256)",
  "function dvnCount() view returns (uint32)",
  "function dvns(uint32) view returns (address, string, uint8, bool)"
];

// Contract addresses - to be loaded from deployment files if available
const CONTRACT_ADDRESSES: Record<string, Record<string, string>> = {};

// Initialize RPC providers
const providers: Record<string, ethers.providers.JsonRpcProvider> = {};

// Initialize providers and load contract addresses
async function initializeWeb3() {
  try {
    // Initialize providers
    for (const network of NETWORKS) {
      providers[network.id] = new ethers.providers.JsonRpcProvider(network.rpc);
      
      // Initialize empty contract addresses
      CONTRACT_ADDRESSES[network.id] = {
        token: "",
        executor: "",
        dvnManager: "",
        adapter: ""
      };
      
      // Try to load deployment info if it exists
      try {
        // Since __dirname is not available in ESM, we'll use a relative path from the project root
        const deploymentPath = path.join('./deployments', `${network.id}.json`);
        if (fs.existsSync(deploymentPath)) {
          const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
          if (deployment.contracts) {
            CONTRACT_ADDRESSES[network.id] = deployment.contracts;
          }
        }
      } catch (err) {
        console.warn(`Failed to load deployment info for ${network.id}:`, err);
      }
    }
    
    console.log("Web3 providers initialized");
  } catch (error) {
    console.error("Error initializing web3:", error);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize web3 providers and contract addresses
  await initializeWeb3();
  
  // GET: Available networks including LayerZero chain IDs
  app.get("/api/layerzero/networks", (_req, res) => {
    res.json(NETWORKS);
  });
  
  // GET: Network Status
  app.get("/api/networks", async (_req, res) => {
    try {
      const networks = await storage.getAllNetworkStatus();
      
      // Enhance with real-time blockchain data where possible
      const enhancedNetworks = await Promise.all(
        networks.map(async (network) => {
          try {
            if (providers[network.networkId]) {
              const provider = providers[network.networkId];
              const blockNumber = await provider.getBlockNumber();
              const gasPrice = await provider.getGasPrice();
              
              return {
                ...network,
                blockNumber,
                gasPrice: ethers.utils.formatUnits(gasPrice, 'gwei'),
                status: "active",
                updatedAt: new Date()
              };
            }
            return network;
          } catch (err) {
            console.warn(`Error getting real-time data for ${network.networkId}:`, err);
            return network;
          }
        })
      );
      
      res.json(enhancedNetworks);
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
  
  // POST: Verify Supply Consistency 
  app.post("/api/verify-supply", async (_req, res) => {
    try {
      // This function would normally interact with the OFT contracts to verify
      // supply consistency across chains. For now, we'll simulate the check.
      
      // Get the hub chain (Sepolia) and satellite (Amoy)
      const hubNetwork = NETWORKS.find(n => n.isHub);
      const satelliteNetwork = NETWORKS.find(n => !n.isHub);
      
      if (!hubNetwork || !satelliteNetwork) {
        return res.status(500).json({ error: "Network configuration missing" });
      }
      
      const chainPair = `${hubNetwork.name} ↔ ${satelliteNetwork.name}`;
      
      // Create a supply check record
      const check = await storage.createSupplyCheck({
        chain: chainPair,
        status: "Verified",
        event: "manualCheck()",
        details: "Supply consistency verified across chains"
      });
      
      res.json({
        success: true,
        check,
        supplyData: {
          total: "100,000,000",
          [hubNetwork.id]: "50,000,000",
          [satelliteNetwork.id]: "50,000,000",
          verified: true
        }
      });
    } catch (error) {
      console.error("Error verifying supply:", error);
      res.status(500).json({ error: "Failed to verify supply consistency" });
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
  
  // POST: Create Bridge Transaction (simulate cross-chain transfer)
  app.post("/api/bridge", async (req, res) => {
    try {
      const validateSchema = z.object({
        amount: z.number().positive(),
        fromChain: z.string(),
        toChain: z.string(),
        walletAddress: z.string()
      });
      
      const validated = validateSchema.parse(req.body);
      
      // Get chain info
      const fromNetwork = NETWORKS.find(n => n.id === validated.fromChain);
      const toNetwork = NETWORKS.find(n => n.id === validated.toChain);
      
      if (!fromNetwork || !toNetwork) {
        return res.status(400).json({ error: "Invalid network selection" });
      }
      
      // Generate message fee based on LayerZero fee structure
      const baseFeeLz = 0.001; // ETH
      let estimatedFee;
      
      if (fromNetwork.isHub && !toNetwork.isHub) {
        // Hub to satellite is cheaper
        estimatedFee = baseFeeLz * validated.amount * 0.0001;
      } else if (!fromNetwork.isHub && toNetwork.isHub) {
        // Satellite to hub has standard fee
        estimatedFee = baseFeeLz * validated.amount * 0.0002;
      } else {
        // Satellite to satellite has higher fee (would use lzCompose)
        estimatedFee = baseFeeLz * validated.amount * 0.0003;
      }
      
      // Format transaction hash to look like a real one
      const txHash = `0x${Math.random().toString(16).substring(2, 34).padStart(64, '0')}`;
      
      const parsedData = {
        amount: validated.amount.toString(),
        fromChain: validated.fromChain,
        toChain: validated.toChain,
        walletAddress: validated.walletAddress,
        fee: estimatedFee.toString(),
        status: "pending", // Start as pending
        hash: txHash
      };
      
      // Create bridge transaction
      const transaction = await storage.createBridgeTransaction(parsedData);
      
      // Simulate LayerZero messaging delay and then update status
      setTimeout(async () => {
        // Update transaction to completed after delay
        transaction.status = "completed";
        
        // In a real implementation, you would update the transaction in the database
        console.log(`Transaction ${txHash} completed`);
      }, 8000);
      
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
  
  // GET: LayerZero Transaction History by Wallet Address
  app.get("/api/layerzero/transactions/:address", async (req, res) => {
    try {
      const { address } = req.params;
      const transactions = await storage.getLayerZeroTransactionsByAddress(address);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ 
        error: "Failed to fetch LayerZero transactions",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // GET: LayerZero Transaction by ID
  app.get("/api/layerzero/transactions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid transaction ID" });
      }
      
      const transaction = await storage.getLayerZeroTransaction(id);
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      
      res.json(transaction);
    } catch (error) {
      res.status(500).json({ 
        error: "Failed to fetch LayerZero transaction",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // POST: Create LayerZero Transaction
  app.post("/api/layerzero/transactions", async (req, res) => {
    try {
      const validateSchema = insertLayerZeroTransactionSchema.extend({
        sourceChain: z.string().min(1, "Source chain is required"),
        sourceTxHash: z.string().min(1, "Source transaction hash is required"),
        walletAddress: z.string().min(1, "Wallet address is required"),
        type: z.enum(["token_transfer", "token_bridge", "cross_chain_message", "proposal_creation", "vote", "execution"])
      });
      
      const data = validateSchema.parse(req.body);
      const transaction = await storage.createLayerZeroTransaction(data);
      
      // Simulate a transition to source_confirmed state after a delay (representing message being sent)
      if (data.destinationChain) {
        setTimeout(async () => {
          try {
            await storage.updateLayerZeroTransaction(transaction.id, {
              status: "source_confirmed",
              messageId: `0x${Math.random().toString(16).substring(2, 34).padStart(40, '0')}`,
            });
            console.log(`Transaction ${transaction.id} updated to source_confirmed`);
            
            // Then simulate destination_confirmed after another delay
            setTimeout(async () => {
              try {
                await storage.updateLayerZeroTransaction(transaction.id, {
                  status: "destination_confirmed",
                });
                console.log(`Transaction ${transaction.id} confirmed on destination`);
                
                // Finally, mark as completed
                setTimeout(async () => {
                  try {
                    await storage.updateLayerZeroTransaction(transaction.id, {
                      status: "completed",
                      destinationTxHash: `0x${Math.random().toString(16).substring(2, 34).padStart(64, '0')}`,
                    });
                    console.log(`Transaction ${transaction.id} completed`);
                  } catch (err) {
                    console.error(`Error updating transaction ${transaction.id}:`, err);
                  }
                }, 5000); // 5 seconds for final confirmation
                
              } catch (err) {
                console.error(`Error updating transaction ${transaction.id}:`, err);
              }
            }, 8000); // 8 seconds for destination confirmation
            
          } catch (err) {
            console.error(`Error updating transaction ${transaction.id}:`, err);
          }
        }, 5000); // 5 seconds for source confirmation
      } else {
        // For single-chain transactions, just move to completed after a delay
        setTimeout(async () => {
          try {
            await storage.updateLayerZeroTransaction(transaction.id, {
              status: "completed",
            });
            console.log(`Transaction ${transaction.id} completed`);
          } catch (err) {
            console.error(`Error updating transaction ${transaction.id}:`, err);
          }
        }, 5000);
      }
      
      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ 
          error: "Failed to create LayerZero transaction",
          details: error instanceof Error ? error.message : String(error)
        });
      }
    }
  });
  
  // PUT: Update LayerZero Transaction
  app.put("/api/layerzero/transactions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid transaction ID" });
      }
      
      const transaction = await storage.getLayerZeroTransaction(id);
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      
      const data = req.body;
      const updated = await storage.updateLayerZeroTransaction(id, data);
      
      res.json(updated);
    } catch (error) {
      res.status(500).json({ 
        error: "Failed to update LayerZero transaction",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // POST: Retry a failed transaction
  app.post("/api/layerzero/transactions/retry", async (req, res) => {
    try {
      const { id } = req.body;
      
      if (!id) {
        return res.status(400).json({ error: "Transaction ID is required" });
      }
      
      const transaction = await storage.getLayerZeroTransaction(id);
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      
      // Update the transaction status to retrying/pending
      const updatedTx = await storage.updateLayerZeroTransaction(id, {
        status: "pending",
        error: null,
        updatedAt: new Date()
      });
      
      // Simulate the transaction flow again
      if (transaction.destinationChain) {
        setTimeout(async () => {
          try {
            await storage.updateLayerZeroTransaction(id, {
              status: "source_confirmed",
              error: null
            });
            
            // Then simulate destination confirmation
            setTimeout(async () => {
              try {
                await storage.updateLayerZeroTransaction(id, {
                  status: "destination_confirmed"
                });
                
                // Finally, complete the transaction
                setTimeout(async () => {
                  try {
                    const destinationTxHash = transaction.destinationTxHash || 
                      `0x${Math.random().toString(16).substring(2, 34).padStart(64, '0')}`;
                    
                    await storage.updateLayerZeroTransaction(id, {
                      status: "completed",
                      destinationTxHash
                    });
                  } catch (err) {
                    console.error(`Error completing retried transaction ${id}:`, err);
                  }
                }, 5000);
                
              } catch (err) {
                console.error(`Error confirming retried transaction ${id}:`, err);
              }
            }, 8000);
            
          } catch (err) {
            console.error(`Error processing retried transaction ${id}:`, err);
          }
        }, 5000);
      } else {
        // For single-chain transactions, complete directly
        setTimeout(async () => {
          try {
            await storage.updateLayerZeroTransaction(id, {
              status: "completed",
              error: null
            });
          } catch (err) {
            console.error(`Error completing retried transaction ${id}:`, err);
          }
        }, 5000);
      }
      
      res.json(updatedTx);
    } catch (error) {
      console.error("Error retrying transaction:", error);
      res.status(500).json({ 
        error: "Failed to retry transaction",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // GET: DVN information for a network
  app.get("/api/layerzero/dvn/:networkId", async (req, res) => {
    try {
      const { networkId } = req.params;
      const network = NETWORKS.find(n => n.id === networkId);
      
      if (!network) {
        return res.status(404).json({ error: "Network not found" });
      }
      
      // For development purposes, use mock data instead of connecting to contracts
      // This will be replaced with real contract interactions in production
      const securityScore = network.isHub ? 80 : 50;
      
      res.json({
        networkId,
        securityScore,
        securityLevel: securityScore < 40 ? "Low" : securityScore < 70 ? "Medium" : "High",
        dvns: [
          {
            id: "default",
            name: "LayerZero Default DVN",
            enabled: true,
            requiredSignatures: 1
          },
          {
            id: "ultra", 
            name: "Ultra Secure DVN",
            enabled: network.isHub, // Enabled on hub
            requiredSignatures: 2
          },
          {
            id: "lite",
            name: "Lite DVN", 
            enabled: !network.isHub, // Enabled on satellite
            requiredSignatures: 1
          }
        ]
      });
    } catch (error) {
      console.error("Error getting DVN info:", error);
      res.status(500).json({ error: "Failed to get DVN information" });
    }
  });
  
  // POST: Update DVN configuration
  app.post("/api/layerzero/dvn/:networkId", async (req, res) => {
    try {
      const { networkId } = req.params;
      const network = NETWORKS.find(n => n.id === networkId);
      
      if (!network) {
        return res.status(404).json({ error: "Network not found" });
      }
      
      const { dvns, securityLevel, trustedEndpointMode, multiSignatureVerification } = req.body;
      
      // Validate input
      if (!dvns || !Array.isArray(dvns)) {
        return res.status(400).json({ error: "DVNs must be an array" });
      }
      
      if (typeof securityLevel !== 'number' || securityLevel < 1 || securityLevel > 4) {
        return res.status(400).json({ error: "Security level must be between 1 and 4" });
      }
      
      // Calculate new security score based on settings
      let securityScore = 0;
      
      // Base score from security level
      securityScore += securityLevel * 15;
      
      // Score from DVNs
      if (dvns.includes("default")) securityScore += 30;
      if (dvns.includes("ultra")) securityScore += 40;
      if (dvns.includes("lite")) securityScore += 20;
      
      // Additional features
      if (trustedEndpointMode) securityScore += 15;
      if (multiSignatureVerification) securityScore += 25;
      
      // Cap at 100
      securityScore = Math.min(securityScore, 100);
      
      // Return updated configuration
      res.json({
        networkId,
        securityScore,
        securityLevel: securityScore < 40 ? "Low" : securityScore < 70 ? "Medium" : "High",
        settings: {
          securityLevel,
          trustedEndpointMode,
          multiSignatureVerification,
          enabledDvns: dvns
        },
        dvns: [
          {
            id: "default",
            name: "LayerZero Default DVN",
            enabled: dvns.includes("default"),
            requiredSignatures: securityLevel >= 3 ? 2 : 1
          },
          {
            id: "ultra", 
            name: "Ultra Secure DVN",
            enabled: dvns.includes("ultra"),
            requiredSignatures: securityLevel >= 2 ? 2 : 1
          },
          {
            id: "lite",
            name: "Lite DVN", 
            enabled: dvns.includes("lite"),
            requiredSignatures: 1
          }
        ]
      });
    } catch (error) {
      console.error("Error updating DVN config:", error);
      res.status(500).json({ error: "Failed to update DVN configuration" });
    }
  });
  
  // GET: Cross-chain proposal details
  app.get("/api/proposal/:proposalId", async (req, res) => {
    try {
      const { proposalId } = req.params;
      
      // Try to get proposal from the hub chain's executor
      const hubNetwork = NETWORKS.find(n => n.isHub);
      
      if (!hubNetwork) {
        return res.status(500).json({ error: "Hub network not configured" });
      }
      
      // For development purposes, use mock data
      // Return simulated data
      const proposal = {
        id: proposalId || "1",
        title: "Update Protocol Fee to 0.5%",
        description: "This proposal aims to change the current protocol fee from 0.1% to 0.5% to better support ecosystem growth.",
        proposer: "0x1234567890abcdef1234567890abcdef12345678",
        status: "Active",
        votes: {
          for: 63.5,
          against: 27.3,
          abstain: 9.2,
          total: 550000,
          quorum: 500000
        }
      };
      
      res.json(proposal);
    } catch (error) {
      console.error("Error getting proposal:", error);
      res.status(500).json({ error: "Failed to get proposal details" });
    }
  });
  
  // POST: Create a new proposal
  app.post("/api/proposal", async (req, res) => {
    try {
      const { title, description, actions } = req.body;
      
      // Validate input
      if (!title || !description) {
        return res.status(400).json({ error: "Title and description are required" });
      }
      
      if (!actions || !Array.isArray(actions)) {
        return res.status(400).json({ error: "Actions must be an array" });
      }
      
      // Return simulated created proposal
      const proposalId = `0x${Math.random().toString(16).substring(2, 10)}`;
      
      res.json({
        id: proposalId,
        title,
        description,
        status: "Pending",
        createdAt: new Date()
      });
    } catch (error) {
      console.error("Error creating proposal:", error);
      res.status(500).json({ error: "Failed to create proposal" });
    }
  });
  
  // POST: Execute a proposal with lzCompose
  app.post("/api/proposal/:proposalId/execute", async (req, res) => {
    try {
      const { proposalId } = req.params;
      const { chains } = req.body;
      
      if (!chains || !Array.isArray(chains)) {
        return res.status(400).json({ error: "Chains must be an array" });
      }
      
      // Return simulated execution result
      res.json({
        success: true,
        proposalId,
        executionId: `0x${Math.random().toString(16).substring(2, 34).padStart(64, '0')}`,
        chains: chains.map(chainId => ({
          id: chainId,
          status: "Pending",
          transactionHash: null
        })),
        estimatedTimeToComplete: "2-5 minutes"
      });
    } catch (error) {
      console.error("Error executing proposal:", error);
      res.status(500).json({ error: "Failed to execute proposal" });
    }
  });

  // Transaction routes
  app.get('/api/transactions', async (req, res) => {
    try {
      const walletAddress = req.query.walletAddress as string;
      const status = req.query.status as string;
      
      let transactions: LayerZeroTransaction[] = [];
      
      if (walletAddress && status) {
        // Get transactions by address and filter by status
        transactions = await storage.getLayerZeroTransactionsByAddress(walletAddress);
        transactions = transactions.filter(tx => tx.status === status);
      } else if (walletAddress) {
        // Get transactions by address only
        transactions = await storage.getLayerZeroTransactionsByAddress(walletAddress);
      } else if (status) {
        // Get transactions by status only
        transactions = await storage.getLayerZeroTransactionsByStatus(status);
      } else {
        // Get all transactions (limit to last 100 for performance)
        const allTransactions = [];
        for (const tx of storage.layerZeroTransactions.values()) {
          allTransactions.push(tx);
        }
        // Sort by most recent first
        transactions = allTransactions
          .sort((a, b) => 
            b.createdAt && a.createdAt 
              ? b.createdAt.getTime() - a.createdAt.getTime() 
              : 0
          )
          .slice(0, 100);
      }
      
      res.json(transactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({ message: 'Failed to fetch transactions' });
    }
  });

  app.get('/api/transactions/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const transaction = await storage.getLayerZeroTransaction(id);
      
      if (!transaction) {
        return res.status(404).json({ message: 'Transaction not found' });
      }
      
      res.json(transaction);
    } catch (error) {
      console.error(`Error fetching transaction ${req.params.id}:`, error);
      res.status(500).json({ message: 'Failed to fetch transaction' });
    }
  });

  app.post('/api/transactions', async (req, res) => {
    try {
      const transaction = req.body;
      const newTransaction = await storage.createLayerZeroTransaction(transaction);
      res.status(201).json(newTransaction);
    } catch (error) {
      console.error('Error creating transaction:', error);
      res.status(500).json({ message: 'Failed to create transaction' });
    }
  });

  app.post('/api/transactions/:id/retry', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const transaction = await storage.getLayerZeroTransaction(id);
      
      if (!transaction) {
        return res.status(404).json({ message: 'Transaction not found' });
      }
      
      // Update transaction status to "pending" again
      const updatedTransaction = await storage.updateLayerZeroTransaction(id, {
        status: 'pending',
        error: null,
      });
      
      res.json(updatedTransaction);
    } catch (error) {
      console.error(`Error retrying transaction ${req.params.id}:`, error);
      res.status(500).json({ message: 'Failed to retry transaction' });
    }
  });
  
  // Network status routes
  app.get('/api/network/status', async (req, res) => {
    try {
      const statuses = await storage.getAllNetworkStatus();
      res.json(statuses);
    } catch (error) {
      console.error('Error fetching network statuses:', error);
      res.status(500).json({ message: 'Failed to fetch network statuses' });
    }
  });

  // Gas estimation routes (mock for demo)
  app.get('/api/network/gas', (req, res) => {
    // Mock gas estimations for demo
    const mockGasEstimations = {
      'ethereum-sepolia': {
        networkId: 'ethereum-sepolia',
        chainId: 11155111,
        baseFee: '25',
        priorityFee: '2',
        total: '27',
        estimatedTimeBlocks: 2,
        equivalentUSD: '0.0021'
      },
      'arbitrum-sepolia': {
        networkId: 'arbitrum-sepolia',
        chainId: 421614,
        baseFee: '0.1',
        priorityFee: '0.05',
        total: '0.15',
        estimatedTimeBlocks: 1,
        equivalentUSD: '0.00001'
      },
      'optimism-sepolia': {
        networkId: 'optimism-sepolia',
        chainId: 11155420,
        baseFee: '0.5',
        priorityFee: '0.1',
        total: '0.6',
        estimatedTimeBlocks: 1,
        equivalentUSD: '0.00005'
      },
      'base-sepolia': {
        networkId: 'base-sepolia',
        chainId: 84532,
        baseFee: '0.2',
        priorityFee: '0.05',
        total: '0.25',
        estimatedTimeBlocks: 1,
        equivalentUSD: '0.00002'
      }
    };
    
    res.json(mockGasEstimations);
  });

  // LayerZero fees (mock for demo)
  app.get('/api/layerzero/fees', (req, res) => {
    // Mock LayerZero fees for demo
    const mockLayerZeroFees = {
      'ethereum-sepolia': {
        messageFee: '0.0005',
        dvnFee: '0.0002',
        oracleFee: '0.0003',
        total: '0.001',
        estimatedUSD: '0.0001'
      },
      'arbitrum-sepolia': {
        messageFee: '0.0003',
        dvnFee: '0.0001',
        oracleFee: '0.0001',
        total: '0.0005',
        estimatedUSD: '0.00005'
      },
      'optimism-sepolia': {
        messageFee: '0.0003',
        dvnFee: '0.0001',
        oracleFee: '0.0001',
        total: '0.0005',
        estimatedUSD: '0.00005'
      },
      'base-sepolia': {
        messageFee: '0.0003',
        dvnFee: '0.0001',
        oracleFee: '0.0001',
        total: '0.0005',
        estimatedUSD: '0.00005'
      }
    };
    
    res.json(mockLayerZeroFees);
  });

  // DVN configurations (mock for demo)
  app.get('/api/layerzero/dvn', (req, res) => {
    // Mock DVN configurations for demo
    const mockDvnConfigurations = {
      'ethereum-sepolia': {
        networkId: 'ethereum-sepolia',
        securityScore: 95,
        securityLevel: 'high',
        dvns: [
          { id: 'dvn1', name: 'LayerZero Default', enabled: true, requiredSignatures: 1 },
          { id: 'dvn2', name: 'Chainlink', enabled: false, requiredSignatures: 1 },
          { id: 'dvn3', name: 'OmniBridge', enabled: false, requiredSignatures: 1 }
        ]
      },
      'arbitrum-sepolia': {
        networkId: 'arbitrum-sepolia',
        securityScore: 90,
        securityLevel: 'high',
        dvns: [
          { id: 'dvn1', name: 'LayerZero Default', enabled: true, requiredSignatures: 1 },
          { id: 'dvn2', name: 'Chainlink', enabled: false, requiredSignatures: 1 }
        ]
      },
      'optimism-sepolia': {
        networkId: 'optimism-sepolia',
        securityScore: 90,
        securityLevel: 'high',
        dvns: [
          { id: 'dvn1', name: 'LayerZero Default', enabled: true, requiredSignatures: 1 },
          { id: 'dvn2', name: 'Chainlink', enabled: false, requiredSignatures: 1 }
        ]
      },
      'base-sepolia': {
        networkId: 'base-sepolia',
        securityScore: 90,
        securityLevel: 'high',
        dvns: [
          { id: 'dvn1', name: 'LayerZero Default', enabled: true, requiredSignatures: 1 },
          { id: 'dvn2', name: 'Chainlink', enabled: false, requiredSignatures: 1 }
        ]
      }
    };
    
    res.json(mockDvnConfigurations);
  });

  const httpServer = createServer(app);
  return httpServer;
}