import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useNetwork } from '@/hooks/useNetwork';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/hooks/use-toast';

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
  const executeWithLzCompose = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to use this feature",
        variant: "destructive",
      });
      return;
    }
    
    if (chainsToExecute.length < 2) {
      toast({
        title: "Select multiple chains",
        description: "Please select at least two chains for atomic execution",
        variant: "destructive",
      });
      return;
    }
    
    setIsExecuting(true);
    setExecutionProgress(0);
    
    try {
      // 1. Preparation phase
      setExecutionProgress(5);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast({
        title: "Preparing lzCompose Transaction",
        description: "Generating multi-chain transaction bundle",
      });
      
      // Gradually move to 25%
      for (let i = 5; i <= 25; i += 5) {
        setExecutionProgress(i);
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      // 2. Compose message and send to LayerZero
      toast({
        title: "lzCompose Initiated",
        description: `Sending atomic execution message to ${chainsToExecute.length} chains via LayerZero`,
      });
      
      for (let i = 25; i <= 50; i += 5) {
        setExecutionProgress(i);
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      // 3. DVN verification
      toast({
        title: "DVN Verification",
        description: "LayerZero validators are verifying the transaction bundle",
      });
      
      for (let i = 50; i <= 75; i += 5) {
        setExecutionProgress(i);
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      // 4. Execution on destination chains
      for (let i = 0; i < chainsToExecute.length; i++) {
        const chain = chainsToExecute[i];
        toast({
          title: `Executing on ${chain.name}`,
          description: "The transaction is being executed atomically",
        });
        
        const progressStep = 25 / chainsToExecute.length;
        const startProgress = 75 + (i * progressStep);
        const endProgress = startProgress + progressStep;
        
        for (let j = startProgress; j <= endProgress; j += 5) {
          setExecutionProgress(Math.min(j, 100));
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
      
      // Complete
      setExecutionProgress(100);
      toast({
        title: "Atomic Execution Complete",
        description: `All transactions were executed atomically across ${chainsToExecute.length} chains`,
      });
      
      // Keep the execution state visible for a while
      setTimeout(() => {
        setIsExecuting(false);
        setExecutionProgress(0);
      }, 5000);
      
    } catch (error) {
      console.error("Error during lzCompose execution:", error);
      toast({
        title: "Execution Failed",
        description: "There was an error during atomic execution. All changes were reverted.",
        variant: "destructive",
      });
      setIsExecuting(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <Card className="w-full bg-gray-900 border border-gray-800">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg">Atomic Multi-Chain Execution</CardTitle>
              <CardDescription className="text-gray-400">
                Execute transactions atomically across multiple chains using lzCompose
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <p className="text-sm text-gray-300">
              lzCompose is LayerZero's feature for executing transactions atomically across multiple blockchains. 
              This means that either all transactions succeed on all selected chains, or all fail and revert together. 
              This demonstration shows how this works in practice.
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-200 mb-3">Select Chains for Atomic Execution</h3>
            <p className="text-xs text-gray-400 mb-4">
              Select multiple chains to see how lzCompose executes transactions atomically across all of them
            </p>
            <div className="space-y-3 bg-gray-800 p-4 rounded-lg">
              {networks.map(network => (
                <div className="flex items-center space-x-2" key={network.id}>
                  <Checkbox 
                    id={`chain-${network.id}`}
                    checked={selectedChains[network.id]}
                    onCheckedChange={() => toggleChain(network.id)}
                    className="border-gray-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                  <Label 
                    htmlFor={`chain-${network.id}`}
                    className="flex items-center cursor-pointer text-gray-200"
                  >
                    <span 
                      className="inline-block w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: network.color || '#888' }}
                    ></span>
                    {network.name}
                    {network.isHub && (
                      <Badge className="ml-2 text-xs bg-blue-900/50 text-blue-400 hover:bg-blue-900/50">Hub</Badge>
                    )}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 p-4 rounded-lg border border-blue-900/50">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-900/30 rounded-full flex items-center justify-center mr-3 mt-1">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13 16H12V12H11M12 8H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" 
                    stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-blue-400">How lzCompose Works</h4>
                <p className="text-sm text-gray-300 mt-1">
                  lzCompose bundles multiple transactions targeting different chains into a single atomic unit. 
                  It leverages LayerZero's cross-chain messaging infrastructure to ensure that either all 
                  transactions succeed or all fail together, maintaining consistency across the blockchain 
                  ecosystem.
                </p>
                <div className="mt-3 space-y-1">
                  <div className="flex items-center text-xs text-gray-300">
                    <div className="w-4 h-4 rounded-full bg-gray-700 text-white flex items-center justify-center mr-1.5 text-[10px]">1</div>
                    <span>Transactions are bundled into a composition</span>
                  </div>
                  <div className="flex items-center text-xs text-gray-300">
                    <div className="w-4 h-4 rounded-full bg-gray-700 text-white flex items-center justify-center mr-1.5 text-[10px]">2</div>
                    <span>LayerZero broadcasts to all target chains simultaneously</span>
                  </div>
                  <div className="flex items-center text-xs text-gray-300">
                    <div className="w-4 h-4 rounded-full bg-gray-700 text-white flex items-center justify-center mr-1.5 text-[10px]">3</div>
                    <span>DVNs validate all transactions across all chains</span>
                  </div>
                  <div className="flex items-center text-xs text-gray-300">
                    <div className="w-4 h-4 rounded-full bg-gray-700 text-white flex items-center justify-center mr-1.5 text-[10px]">4</div>
                    <span>All transactions are executed or all are rolled back</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {isExecuting && (
            <div className="space-y-4 bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Execution Progress</span>
                  <span className="text-gray-300">{executionProgress}%</span>
                </div>
                <Progress value={executionProgress} className="h-2 bg-gray-700" />
              </div>
              
              <div className="grid grid-cols-4 text-center text-xs text-gray-400">
                <div className="space-y-1">
                  <div className={`h-2 w-2 rounded-full mx-auto ${executionProgress >= 25 ? 'bg-green-500' : executionProgress > 0 ? 'bg-blue-500 animate-pulse' : 'bg-gray-700'}`}></div>
                  <div>Preparation</div>
                </div>
                <div className="space-y-1">
                  <div className={`h-2 w-2 rounded-full mx-auto ${executionProgress >= 50 ? 'bg-green-500' : executionProgress > 25 ? 'bg-blue-500 animate-pulse' : 'bg-gray-700'}`}></div>
                  <div>lzCompose</div>
                </div>
                <div className="space-y-1">
                  <div className={`h-2 w-2 rounded-full mx-auto ${executionProgress >= 75 ? 'bg-green-500' : executionProgress > 50 ? 'bg-blue-500 animate-pulse' : 'bg-gray-700'}`}></div>
                  <div>Verification</div>
                </div>
                <div className="space-y-1">
                  <div className={`h-2 w-2 rounded-full mx-auto ${executionProgress >= 100 ? 'bg-green-500' : executionProgress > 75 ? 'bg-blue-500 animate-pulse' : 'bg-gray-700'}`}></div>
                  <div>Execution</div>
                </div>
              </div>
              
              <div className="relative mt-4">
                <div className="absolute inset-0 grid grid-cols-4">
                  {chainsToExecute.map((chain, index) => {
                    const position = index / (chainsToExecute.length - 1) * 100;
                    const isActive = executionProgress > 75 && executionProgress - 75 >= (index / chainsToExecute.length) * 25;
                    
                    return (
                      <div 
                        key={chain.id}
                        className={`absolute top-1/2 transform -translate-y-1/2 rounded-full p-1 border ${isActive ? 'border-green-500 compose-pulse' : 'border-gray-700'}`}
                        style={{ 
                          left: `${position}%`, 
                          backgroundColor: chain.color || '#888',
                          width: '14px',
                          height: '14px'
                        }}
                      ></div>
                    );
                  })}
                  <div className="col-span-4 h-0.5 bg-gray-700 self-center"></div>
                </div>
                <div className="h-8"></div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between border-t border-gray-800 pt-6">
          <div className="text-xs text-gray-400 italic">
            Note: This is a technology demo. No actual transactions are executed.
          </div>
          
          <Button 
            onClick={executeWithLzCompose}
            disabled={isExecuting || chainsToExecute.length < 2}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isExecuting ? 'Executing...' : 'Execute with lzCompose'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}