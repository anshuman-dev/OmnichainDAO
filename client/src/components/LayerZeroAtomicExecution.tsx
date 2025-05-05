import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { useNetwork } from '@/hooks/useNetwork';
import { useToast } from '@/hooks/use-toast';
import { LucideAlertCircle, LucideArrowRightLeft, LucideCheckCircle, LucideChevronRight, LucideCircleDot, LucideCircleX, LucideClock, LucideCode, LucideCpu, LucideServer, LucideTerminalSquare, LucideZap } from 'lucide-react';
import { AVAILABLE_NETWORKS } from '@/lib/constants';

// Example proposal actions
const PROPOSAL_ACTIONS = [
  {
    id: 1,
    name: 'Update Protocol Fee',
    description: 'Change the protocol fee from 0.1% to 0.5%',
    chains: ['sepolia', 'optimism-sepolia', 'base-sepolia'],
    calldata: '0xabcdef1234567890'
  },
  {
    id: 2,
    name: 'Add Supported Token',
    description: 'Add USDC as a supported token',
    chains: ['sepolia', 'arbitrum-sepolia'],
    calldata: '0x1234567890abcdef'
  },
  {
    id: 3,
    name: 'Upgrade Contract',
    description: 'Upgrade the OmniGovernToken implementation',
    chains: ['sepolia', 'optimism-sepolia', 'arbitrum-sepolia', 'base-sepolia'],
    calldata: '0x5678901234abcdef'
  }
];

export default function LayerZeroAtomicExecution() {
  const { currentNetwork } = useNetwork();
  const { toast } = useToast();
  
  // State for execution configuration
  const [selectedProposal, setSelectedProposal] = useState<number | null>(null);
  const [selectedChains, setSelectedChains] = useState<string[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [gasOptimization, setGasOptimization] = useState(true);
  const [parallelExecution, setParallelExecution] = useState(false);
  
  // Handle proposal selection
  const handleProposalSelect = (proposalId: number) => {
    const proposal = PROPOSAL_ACTIONS.find(p => p.id === proposalId);
    setSelectedProposal(proposalId);
    // Auto-select all chains for this proposal
    if (proposal) {
      setSelectedChains(proposal.chains);
    }
  };
  
  // Handle chain selection
  const handleChainChange = (chainId: string, checked: boolean) => {
    if (checked) {
      setSelectedChains([...selectedChains, chainId]);
    } else {
      setSelectedChains(selectedChains.filter(id => id !== chainId));
    }
  };
  
  // Get chain name from ID
  const getChainName = (chainId: string) => {
    const network = AVAILABLE_NETWORKS.find(n => n.id === chainId);
    return network?.name || chainId;
  };
  
  // Simulate execution
  const simulateExecution = () => {
    if (!selectedProposal) {
      toast({
        title: "No Proposal Selected",
        description: "Please select a proposal to simulate execution.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    
    if (selectedChains.length === 0) {
      toast({
        title: "No Chains Selected",
        description: "Please select at least one chain for execution.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    
    setIsSimulating(true);
    
    // Simulate API call to get execution preview
    setTimeout(() => {
      const proposal = PROPOSAL_ACTIONS.find(p => p.id === selectedProposal);
      
      // Generate simulated execution result
      const simulationResult = {
        proposalId: selectedProposal,
        proposalName: proposal?.name,
        gasEstimation: Math.round(selectedChains.length * 350000),
        executionTime: selectedChains.length * 30,
        chains: selectedChains.map(chainId => ({
          id: chainId,
          name: getChainName(chainId),
          gasEstimation: Math.round(Math.random() * 100000 + 250000),
          status: 'Ready'
        }))
      };
      
      setExecutionResult(simulationResult);
      setIsSimulating(false);
      
      toast({
        title: "Simulation Complete",
        description: "Execution preview generated successfully.",
        duration: 3000,
      });
    }, 2000);
  };
  
  // Execute proposal
  const executeProposal = () => {
    if (!selectedProposal || !executionResult) {
      toast({
        title: "Simulation Required",
        description: "Please simulate the execution before proceeding.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    
    setIsExecuting(true);
    
    // Simulate API call to execute proposal
    setTimeout(() => {
      // Update execution result with executed status
      const updatedResult = {
        ...executionResult,
        executed: true,
        executionId: `0x${Math.random().toString(16).substring(2, 34)}`,
        chains: executionResult.chains.map((chain: any) => ({
          ...chain,
          status: 'Executed',
          txHash: `0x${Math.random().toString(16).substring(2, 34)}`,
          completedAt: new Date().toISOString()
        }))
      };
      
      setExecutionResult(updatedResult);
      setIsExecuting(false);
      
      toast({
        title: "Execution Complete",
        description: "Proposal executed successfully on all chains.",
        duration: 5000,
      });
    }, 3000);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Left Column - Execution Configuration */}
      <div className="md:col-span-2 space-y-6">
        <Card className="overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <LucideZap className="w-5 h-5 text-primary" />
              <CardTitle>lzCompose Atomic Execution</CardTitle>
            </div>
            <CardDescription>
              Execute governance proposal actions atomically across multiple chains using LayerZero's lzCompose.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pb-6 space-y-6">
            {/* Proposal Selection */}
            <div className="space-y-4">
              <Label>Select Proposal to Execute</Label>
              
              <div className="space-y-3">
                {PROPOSAL_ACTIONS.map((proposal) => (
                  <div 
                    key={proposal.id} 
                    className={`border p-4 rounded-md cursor-pointer hover:border-primary hover:bg-primary/5 transition-all ${
                      selectedProposal === proposal.id ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => handleProposalSelect(proposal.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{proposal.name}</h3>
                      <span className="text-xs bg-muted px-2 py-0.5 rounded">
                        {proposal.chains.length} Chain{proposal.chains.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {proposal.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {proposal.chains.map((chainId) => (
                        <span key={chainId} className="text-xs bg-muted/60 px-1.5 py-0.5 rounded">
                          {getChainName(chainId)}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Chain Selection */}
            {selectedProposal && (
              <div className="space-y-4">
                <Label>Target Chains for Execution</Label>
                
                <div className="grid grid-cols-2 gap-3">
                  {PROPOSAL_ACTIONS.find(p => p.id === selectedProposal)?.chains.map((chainId) => (
                    <div key={chainId} className="flex items-start space-x-3 border p-3 rounded-md">
                      <Checkbox 
                        id={`chain-${chainId}`}
                        checked={selectedChains.includes(chainId)}
                        onCheckedChange={(checked) => handleChainChange(chainId, checked === true)}
                        className="mt-1"
                      />
                      <div>
                        <Label 
                          htmlFor={`chain-${chainId}`}
                          className="font-medium cursor-pointer"
                        >
                          {getChainName(chainId)}
                        </Label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Execution Options */}
            {selectedProposal && (
              <div className="space-y-4">
                <Label>Execution Options</Label>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between border p-3 rounded-md">
                    <div className="space-y-1">
                      <Label htmlFor="gas-optimization" className="font-medium cursor-pointer">
                        Gas Optimization
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Optimize gas usage during cross-chain execution.
                      </p>
                    </div>
                    <Switch 
                      id="gas-optimization"
                      checked={gasOptimization}
                      onCheckedChange={setGasOptimization}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between border p-3 rounded-md">
                    <div className="space-y-1">
                      <Label htmlFor="parallel-execution" className="font-medium cursor-pointer">
                        Parallel Execution
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Execute actions in parallel when possible (may increase gas costs).
                      </p>
                    </div>
                    <Switch 
                      id="parallel-execution"
                      checked={parallelExecution}
                      onCheckedChange={setParallelExecution}
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="justify-end space-x-4 pt-2">
            <Button 
              variant="outline" 
              onClick={simulateExecution}
              disabled={isSimulating || !selectedProposal || selectedChains.length === 0}
            >
              {isSimulating ? "Simulating..." : "Simulate Execution"}
            </Button>
            <Button 
              onClick={executeProposal}
              disabled={isExecuting || !executionResult}
            >
              {isExecuting ? "Executing..." : "Execute Proposal"}
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      {/* Right Column - Execution Status */}
      <div className="space-y-6">
        {executionResult ? (
          <>
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <LucideTerminalSquare className="w-5 h-5 text-primary" />
                  <CardTitle>Execution Preview</CardTitle>
                </div>
                <CardDescription>
                  Details of the proposed cross-chain execution.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Proposal Info */}
                <div className="space-y-2">
                  <Label>Proposal</Label>
                  <div className="text-sm font-medium">{executionResult.proposalName}</div>
                </div>
                
                {/* Gas Estimation */}
                <div className="space-y-2">
                  <Label>Total Gas Estimation</Label>
                  <div className="text-sm font-medium">
                    {executionResult.gasEstimation.toLocaleString()} gas units
                  </div>
                </div>
                
                {/* Estimated Time */}
                <div className="space-y-2">
                  <Label>Estimated Completion Time</Label>
                  <div className="text-sm font-medium flex items-center gap-1">
                    <LucideClock className="w-4 h-4" />
                    <span>~{executionResult.executionTime} seconds</span>
                  </div>
                </div>
                
                {/* Target Chains */}
                <div className="space-y-3">
                  <Label>Target Chains</Label>
                  
                  {executionResult.chains.map((chain: any) => (
                    <div key={chain.id} className="border p-2 rounded-md">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-sm">{chain.name}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          chain.status === 'Executed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {chain.status}
                        </span>
                      </div>
                      {chain.txHash && (
                        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <LucideCheckCircle className="w-3 h-3 text-green-500" />
                          <span className="truncate">{chain.txHash}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {executionResult.executed && (
              <Card className="bg-green-50 border-green-200">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <LucideCheckCircle className="w-5 h-5 text-green-500" />
                    <CardTitle className="text-green-800">Execution Successful</CardTitle>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <p className="text-green-800 text-sm">
                    The proposal was successfully executed on all selected chains atomically.
                    No further action is required.
                  </p>
                  
                  <div className="mt-4 text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-green-800">Execution ID:</span>
                      <span className="font-mono text-green-800">{executionResult.executionId.substring(0, 10)}...</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-800">Chains:</span>
                      <span className="text-green-800">{executionResult.chains.length} chains</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-800">Status:</span>
                      <span className="text-green-800">Complete</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <LucideAlertCircle className="w-5 h-5 text-primary" />
                <CardTitle>Execution Preview</CardTitle>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center">
                <LucideServer className="w-10 h-10 text-muted-foreground" />
                <div>
                  <p className="font-medium">No Simulation Data</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Select a proposal and click "Simulate Execution" to see a preview of the cross-chain execution.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Technical Details */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <LucideCode className="w-5 h-5 text-primary" />
              <CardTitle>How lzCompose Works</CardTitle>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              lzCompose allows atomic cross-chain execution of governance decisions, ensuring that either all actions succeed or all fail together.
            </p>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <LucideCircleDot className="w-4 h-4 min-w-[16px] text-primary" />
                <span>Proposes actions on the hub chain</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <LucideChevronRight className="w-4 h-4 min-w-[16px] ml-4 text-muted-foreground" />
                <span>LayerZero V2 distributes execution messages to all target chains</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <LucideChevronRight className="w-4 h-4 min-w-[16px] ml-4 text-muted-foreground" />
                <span>Each chain executes its part of the proposal</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <LucideArrowRightLeft className="w-4 h-4 min-w-[16px] text-primary" />
                <span>Execution status is reported back to the hub chain</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <LucideCpu className="w-4 h-4 min-w-[16px] text-primary" />
                <span>If any execution fails, all are reverted</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}