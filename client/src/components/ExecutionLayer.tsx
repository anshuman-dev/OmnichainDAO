import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, AlertTriangle, Clock, ArrowRight, Terminal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGovernance } from "@/hooks/useGovernance";
import { useWallet } from "@/hooks/useWallet";
import { useNetwork } from "@/hooks/useNetwork";
import { AVAILABLE_NETWORKS } from "@/lib/constants";

interface ProposalExecutionProps {
  proposalId: string;
  proposalTitle?: string;
}

interface ChainExecution {
  chainId: string;
  chainName: string;
  status: 'pending' | 'queued' | 'executed' | 'failed';
  txHash?: string;
  timestamp?: string;
}

export default function ExecutionLayer({ proposalId, proposalTitle }: ProposalExecutionProps) {
  const { toast } = useToast();
  const { execute, getProposal, loading, error } = useGovernance();
  const { isConnected, openWalletModal } = useWallet();
  const { currentNetwork } = useNetwork();
  
  const [activeTab, setActiveTab] = useState<"status" | "logs" | "compose">("status");
  const [executionDetails, setExecutionDetails] = useState<{
    isQueued: boolean;
    canExecute: boolean;
    eta: string | null;
    chains: ChainExecution[];
  }>({
    isQueued: true,
    canExecute: true,
    eta: "May 5, 2025 12:00:00 UTC",
    chains: AVAILABLE_NETWORKS.map(network => ({
      chainId: network.id,
      chainName: network.name,
      status: Math.random() > 0.7 ? 'executed' : Math.random() > 0.5 ? 'queued' : 'pending' // Random status for demo
    }))
  });
  
  // Execute a proposal
  const handleExecuteProposal = async () => {
    if (!isConnected) {
      openWalletModal();
      return;
    }
    
    try {
      toast({
        title: "Executing Proposal",
        description: "Preparing cross-chain execution via LayerZero..."
      });
      
      // In a real implementation, we would fetch these values from the contract
      const targets = ["0x1234567890123456789012345678901234567890"];
      const values = ["0"];
      const calldatas = ["0x"];
      const descriptionHash = "0x123abc";
      
      // Execute the proposal
      await execute(proposalId, targets, values, calldatas, descriptionHash);
      
      // Update the execution status
      setExecutionDetails(prev => ({
        ...prev,
        canExecute: false,
        chains: prev.chains.map(chain => ({
          ...chain,
          status: 'executed',
          txHash: `0x${Math.random().toString(16).slice(2)}`,
          timestamp: new Date().toISOString()
        }))
      }));
      
      toast({
        title: "Execution Successful",
        description: "The proposal has been executed successfully across all chains"
      });
    } catch (err: any) {
      toast({
        title: "Execution Failed",
        description: err.message || "Failed to execute the proposal",
        variant: "destructive"
      });
    }
  };
  
  // Queue a proposal for execution
  const handleQueueProposal = async () => {
    if (!isConnected) {
      openWalletModal();
      return;
    }
    
    try {
      toast({
        title: "Queueing Proposal",
        description: "Preparing proposal for execution..."
      });
      
      // In a real implementation, we would call the queue function on the contract
      
      // Update the execution status after a delay to simulate contract interaction
      setTimeout(() => {
        setExecutionDetails(prev => ({
          ...prev,
          isQueued: true,
          eta: new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleString(), // 24 hours from now
          chains: prev.chains.map(chain => ({
            ...chain,
            status: 'queued',
            txHash: `0x${Math.random().toString(16).slice(2)}`,
            timestamp: new Date().toISOString()
          }))
        }));
        
        toast({
          title: "Proposal Queued",
          description: "The proposal has been queued for execution across all chains"
        });
      }, 2000);
    } catch (err: any) {
      toast({
        title: "Queue Failed",
        description: err.message || "Failed to queue the proposal",
        variant: "destructive"
      });
    }
  };
  
  // If not connected, show connect wallet prompt
  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Execution Layer</CardTitle>
          <CardDescription>
            Connect your wallet to execute governance proposals
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            You need to connect your wallet to execute proposals
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={openWalletModal}>Connect Wallet</Button>
        </CardFooter>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Execution Layer</CardTitle>
            <CardDescription>
              Execute Proposal #{proposalId}{proposalTitle ? `: ${proposalTitle}` : ''}
            </CardDescription>
          </div>
          <Badge variant={
            executionDetails.chains.every(c => c.status === 'executed') ? "success" :
            executionDetails.chains.some(c => c.status === 'failed') ? "destructive" :
            executionDetails.chains.some(c => c.status === 'queued') ? "warning" :
            "default"
          }>
            {executionDetails.chains.every(c => c.status === 'executed') ? "Executed" :
             executionDetails.chains.some(c => c.status === 'failed') ? "Failed" :
             executionDetails.chains.some(c => c.status === 'queued') ? "Queued" :
             "Pending"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "status" | "logs" | "compose")}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="status">Execution Status</TabsTrigger>
            <TabsTrigger value="logs">Execution Logs</TabsTrigger>
            <TabsTrigger value="compose">lzCompose</TabsTrigger>
          </TabsList>
          
          <TabsContent value="status">
            <div className="space-y-4">
              {executionDetails.isQueued && executionDetails.eta && (
                <Alert variant="warning">
                  <Clock className="h-4 w-4" />
                  <AlertTitle>Timelock Active</AlertTitle>
                  <AlertDescription>
                    This proposal is currently in the timelock waiting period and can be executed after {executionDetails.eta}.
                  </AlertDescription>
                </Alert>
              )}
              
              {!executionDetails.isQueued && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Proposal Not Queued</AlertTitle>
                  <AlertDescription>
                    This proposal needs to be queued before it can be executed.
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Execution Status by Chain</h3>
                <div className="space-y-3">
                  {executionDetails.chains.map((chain) => (
                    <div key={chain.chainId} className="flex items-center space-x-2 border rounded-md p-3">
                      {chain.status === 'executed' && <Check className="h-5 w-5 text-green-500" />}
                      {chain.status === 'queued' && <Clock className="h-5 w-5 text-amber-500" />}
                      {chain.status === 'pending' && <div className="h-5 w-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />}
                      {chain.status === 'failed' && <AlertTriangle className="h-5 w-5 text-red-500" />}
                      
                      <div className="flex-1">
                        <div className="font-medium">{chain.chainName}</div>
                        <div className="text-xs text-gray-500">
                          {chain.status === 'executed' && 'Executed successfully'}
                          {chain.status === 'queued' && 'Queued for execution'}
                          {chain.status === 'pending' && 'Pending execution'}
                          {chain.status === 'failed' && 'Execution failed'}
                        </div>
                      </div>
                      
                      {chain.txHash && (
                        <a 
                          href={`https://etherscan.io/tx/${chain.txHash}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-xs text-blue-500 hover:text-blue-700"
                        >
                          View Transaction
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="logs">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Execution Logs</h3>
              <div className="bg-gray-900 rounded-md p-4 text-gray-200 font-mono text-sm overflow-auto max-h-80">
                <div className="grid gap-2">
                  <p className="text-green-400">
                    [LayerZero] <span className="text-gray-400">Initializing cross-chain execution for proposal #{proposalId}</span>
                  </p>
                  {executionDetails.chains.filter(c => c.status !== 'pending').map((chain, index) => (
                    <div key={chain.chainId} className="text-gray-200">
                      <p className="text-blue-400">
                        [Chain: {chain.chainName}] <span className="text-gray-400">Execution {chain.status === 'executed' ? 'completed' : chain.status === 'queued' ? 'queued' : 'failed'}</span>
                      </p>
                      {chain.txHash && (
                        <p className="text-xs text-gray-400 ml-6">
                          Transaction: {chain.txHash}
                        </p>
                      )}
                      {chain.timestamp && (
                        <p className="text-xs text-gray-400 ml-6">
                          Timestamp: {chain.timestamp}
                        </p>
                      )}
                      {chain.status === 'executed' && (
                        <p className="text-xs text-green-400 ml-6">
                          Result: Success - proposal actions executed
                        </p>
                      )}
                    </div>
                  ))}
                  <p className="text-yellow-400">
                    [LayerZero] <span className="text-gray-400">Cross-chain execution {executionDetails.chains.every(c => c.status === 'executed') ? 'completed' : 'in progress'}</span>
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="compose">
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 text-sm">
                <h4 className="font-medium text-blue-800 mb-1">lzCompose Atomic Execution</h4>
                <p className="text-blue-700">
                  OmniGovern DAO uses LayerZero's lzCompose to execute proposal actions atomically across 
                  multiple chains. This ensures that governance actions either succeed on all chains or fail safely.
                </p>
              </div>
              
              <h3 className="text-lg font-medium">Execution Flow</h3>
              <div className="relative">
                {AVAILABLE_NETWORKS.map((network, index) => (
                  <div key={network.id} className="flex items-center mb-6">
                    <div className="bg-gray-100 rounded-lg p-3 w-1/3">
                      <div className="font-medium">{network.name}</div>
                      <div className="text-xs text-gray-500">Chain ID: {network.chainId}</div>
                    </div>
                    
                    {index < AVAILABLE_NETWORKS.length - 1 && (
                      <div className="flex-1 flex justify-center">
                        <ArrowRight className="h-5 w-5 text-blue-500" />
                      </div>
                    )}
                    
                    {index < AVAILABLE_NETWORKS.length - 1 && (
                      <div className="bg-gray-100 rounded-lg p-3 w-1/3">
                        <div className="font-medium text-blue-600">lzCompose Message</div>
                        <div className="text-xs text-gray-500">Atomic execution across chains</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="bg-gray-900 rounded-md p-4 text-gray-200 font-mono text-xs overflow-auto max-h-56">
                <p className="text-green-400 mb-2">// Sample lzCompose configuration for cross-chain execution</p>
                <pre>{`{
  "version": "1.0",
  "proposalId": "${proposalId}",
  "actions": [
    {
      "chainId": "${AVAILABLE_NETWORKS[0].chainId}",
      "contract": "0x1234567890abcdef1234567890abcdef12345678",
      "function": "execute(uint256,address[],uint256[],bytes[])",
      "args": ["${proposalId}", ["0xTarget"], ["0"], ["0xCalldata"]]
    },
    {
      "chainId": "${AVAILABLE_NETWORKS[1].chainId}",
      "contract": "0xabcdef1234567890abcdef1234567890abcdef12",
      "function": "execute(uint256,address[],uint256[],bytes[])",
      "args": ["${proposalId}", ["0xTarget"], ["0"], ["0xCalldata"]]
    }
  ],
  "options": {
    "atomicExecution": true,
    "gasLimit": 3000000,
    "retryCount": 3
  }
}`}</pre>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between space-x-4">
        {!executionDetails.isQueued && (
          <Button 
            className="flex-1" 
            onClick={handleQueueProposal} 
            disabled={loading}
          >
            Queue Proposal
          </Button>
        )}
        
        <Button 
          className="flex-1" 
          variant={executionDetails.canExecute ? "default" : "outline"}
          onClick={handleExecuteProposal} 
          disabled={loading || !executionDetails.isQueued || !executionDetails.canExecute}
        >
          {loading ? "Processing..." : "Execute Proposal"}
        </Button>
      </CardFooter>
    </Card>
  );
}