import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import ChainSelector from '@/components/ChainSelector';
import { Network } from '@/types/token';
import { useNetwork } from '@/hooks/useNetwork';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/hooks/use-toast';

// Mock proposal data for execution
const MOCK_PROPOSAL = {
  id: '1',
  title: 'Update Protocol Fee to 0.5%',
  description: 'This proposal aims to change the current protocol fee from 0.1% to 0.5% to better support ecosystem growth.',
  votesFor: 750000,
  votesAgainst: 150000,
  votesAbstain: 50000,
  totalVotes: 950000,
  quorum: 500000,
  status: 'Succeeded', // Changed to Succeeded to allow execution
  deadline: new Date(Date.now() - 86400000) // 1 day ago (voting ended)
};

export default function LayerZeroAtomicExecution() {
  const { networks, currentNetwork } = useNetwork();
  const { isConnected } = useWallet();
  const { toast } = useToast();
  
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionProgress, setExecutionProgress] = useState(0);
  const [selectedChains, setSelectedChains] = useState<{[key: string]: boolean}>({
    'sepolia': true,
    'amoy': true
  });
  
  // Get networks to execute on
  const chainsToExecute = networks.filter(network => selectedChains[network.id]);
  
  // Handle chain selection
  const toggleChain = (networkId: string) => {
    setSelectedChains(prev => ({
      ...prev,
      [networkId]: !prev[networkId]
    }));
  };
  
  // Handle execution
  const executeProposal = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to execute this proposal",
        variant: "destructive",
      });
      return;
    }
    
    if (chainsToExecute.length === 0) {
      toast({
        title: "No chains selected",
        description: "Please select at least one chain for execution",
        variant: "destructive",
      });
      return;
    }
    
    setIsExecuting(true);
    setExecutionProgress(0);
    
    try {
      // Simulate the progress of execution
      const simulateProgress = async () => {
        // 0-25%: Preparing transaction
        for (let i = 0; i <= 25; i += 5) {
          setExecutionProgress(i);
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        // 25-50%: Message sent to LayerZero
        toast({
          title: "lzCompose Initiated",
          description: `Sending atomic execution message to ${chainsToExecute.length} chains via LayerZero`,
        });
        
        for (let i = 25; i <= 50; i += 5) {
          setExecutionProgress(i);
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        // 50-75%: DVN verification
        toast({
          title: "DVN Verification",
          description: "LayerZero validators are verifying the transaction",
        });
        
        for (let i = 50; i <= 75; i += 5) {
          setExecutionProgress(i);
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        // 75-100%: Execution on destination chains
        for (let i = 0; i < chainsToExecute.length; i++) {
          const chain = chainsToExecute[i];
          toast({
            title: `Executing on ${chain.name}`,
            description: "The proposal is being executed atomically across chains",
          });
          
          const progressStep = 25 / chainsToExecute.length;
          const startProgress = 75 + (i * progressStep);
          const endProgress = startProgress + progressStep;
          
          for (let j = startProgress; j <= endProgress; j += 5) {
            setExecutionProgress(Math.min(j, 100));
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }
        
        // Complete
        setExecutionProgress(100);
        toast({
          title: "Execution Complete",
          description: `The proposal has been executed atomically on all ${chainsToExecute.length} chains`,
        });
      };
      
      await simulateProgress();
    } catch (error) {
      console.error("Error executing proposal:", error);
      toast({
        title: "Execution Failed",
        description: "There was an error executing the proposal. Please try again.",
        variant: "destructive",
      });
    } finally {
      // Keep the execution state so the progress is visible
      setTimeout(() => {
        setIsExecuting(false);
        setExecutionProgress(0);
      }, 5000);
    }
  };
  
  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Execute Proposal #{MOCK_PROPOSAL.id}: {MOCK_PROPOSAL.title}</CardTitle>
              <CardDescription>
                Execute this proposal with atomic lzCompose across multiple chains
              </CardDescription>
            </div>
            <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
              {MOCK_PROPOSAL.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm">{MOCK_PROPOSAL.description}</p>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-medium">Voting Results</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-50 p-3 rounded-md text-center">
                <div className="text-green-700 font-medium text-xl">{(MOCK_PROPOSAL.votesFor / MOCK_PROPOSAL.totalVotes * 100).toFixed(1)}%</div>
                <div className="text-sm text-green-600">For</div>
              </div>
              <div className="bg-red-50 p-3 rounded-md text-center">
                <div className="text-red-700 font-medium text-xl">{(MOCK_PROPOSAL.votesAgainst / MOCK_PROPOSAL.totalVotes * 100).toFixed(1)}%</div>
                <div className="text-sm text-red-600">Against</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-md text-center">
                <div className="text-gray-700 font-medium text-xl">{(MOCK_PROPOSAL.votesAbstain / MOCK_PROPOSAL.totalVotes * 100).toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Abstain</div>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-3">Select Chains for Execution</h3>
            <p className="text-sm text-muted-foreground mb-4">
              The proposal will be executed atomically across all selected chains using LayerZero's lzCompose
            </p>
            <div className="space-y-3">
              {networks.map(network => (
                <div className="flex items-center space-x-2" key={network.id}>
                  <Checkbox 
                    id={`chain-${network.id}`}
                    checked={selectedChains[network.id]}
                    onCheckedChange={() => toggleChain(network.id)}
                  />
                  <Label 
                    htmlFor={`chain-${network.id}`}
                    className="flex items-center cursor-pointer"
                  >
                    <span 
                      className="inline-block w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: network.color || '#888' }}
                    ></span>
                    {network.name}
                    {network.isHub && (
                      <Badge variant="outline" className="ml-2 text-xs">Hub</Badge>
                    )}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <div className="flex items-center">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13 16H12V12H11M12 8H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" 
                    stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-blue-800">Using LayerZero lzCompose</h4>
                <p className="text-sm text-blue-600">
                  lzCompose enables atomic execution of the proposal across all chains. Either all succeed or all fail together.
                </p>
              </div>
            </div>
          </div>
          
          {isExecuting && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Execution Progress</span>
                <span>{executionProgress}%</span>
              </div>
              <Progress value={executionProgress} className="h-2" />
              
              <div className="grid grid-cols-4 text-center text-xs mt-2">
                <div className="space-y-1">
                  <div className={`h-2 w-2 rounded-full mx-auto ${executionProgress >= 25 ? 'bg-green-500' : executionProgress > 0 ? 'bg-blue-500 animate-pulse' : 'bg-muted'}`}></div>
                  <div>Preparation</div>
                </div>
                <div className="space-y-1">
                  <div className={`h-2 w-2 rounded-full mx-auto ${executionProgress >= 50 ? 'bg-green-500' : executionProgress > 25 ? 'bg-blue-500 animate-pulse' : 'bg-muted'}`}></div>
                  <div>Message Sent</div>
                </div>
                <div className="space-y-1">
                  <div className={`h-2 w-2 rounded-full mx-auto ${executionProgress >= 75 ? 'bg-green-500' : executionProgress > 50 ? 'bg-blue-500 animate-pulse' : 'bg-muted'}`}></div>
                  <div>DVN Verification</div>
                </div>
                <div className="space-y-1">
                  <div className={`h-2 w-2 rounded-full mx-auto ${executionProgress >= 100 ? 'bg-green-500' : executionProgress > 75 ? 'bg-blue-500 animate-pulse' : 'bg-muted'}`}></div>
                  <div>Execution</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-6">
          <Button 
            variant="outline"
            onClick={() => {}}
          >
            View Details
          </Button>
          
          <Button 
            onClick={executeProposal}
            disabled={isExecuting || chainsToExecute.length === 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isExecuting ? 'Executing...' : 'Execute with lzCompose'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}