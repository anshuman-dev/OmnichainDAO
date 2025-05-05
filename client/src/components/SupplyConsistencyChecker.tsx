import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useNetwork } from '@/hooks/useNetwork';
import { useToast } from '@/hooks/use-toast';

interface SupplyStatus {
  date: string;
  chains: string;
  event: string;
  status: 'Verified' | 'Reconciled' | 'Mismatch';
}

interface ChainSupply {
  name: string;
  amount: string;
  percentage: number;
  color: string;
}

export default function SupplyConsistencyChecker() {
  const { toast } = useToast();
  const { networks } = useNetwork();
  
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState('10 mins ago');
  const [totalSupply] = useState('100,000,000');
  
  // Mock chain distribution data
  const [chainSupplies] = useState<ChainSupply[]>([
    {
      name: "Ethereum Sepolia",
      amount: "50,000,000",
      percentage: 50,
      color: "#627EEA"
    },
    {
      name: "Polygon Amoy",
      amount: "50,000,000",
      percentage: 50,
      color: "#8247E5"
    }
  ]);
  
  // Mock supply check history
  const [supplyChecks] = useState<SupplyStatus[]>([
    {
      date: new Date(Date.now() - 10 * 60 * 1000).toLocaleTimeString(),
      chains: "Sepolia → Amoy",
      event: "checkSupply()",
      status: "Verified"
    },
    {
      date: new Date(Date.now() - 60 * 60 * 1000).toLocaleTimeString(),
      chains: "All Chains",
      event: "dailyAudit()",
      status: "Verified"
    },
    {
      date: new Date(Date.now() - 2 * 60 * 60 * 1000).toLocaleTimeString(),
      chains: "Amoy → Sepolia",
      event: "checkSupply()",
      status: "Reconciled"
    }
  ]);
  
  // Function to verify token supply across chains
  const verifySupply = async () => {
    setIsChecking(true);
    
    try {
      // Simulate network delay for the supply check
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update the last checked time
      setLastChecked('Just now');
      
      // Add a new supply check to the history
      const newCheck: SupplyStatus = {
        date: new Date().toLocaleTimeString(),
        chains: "All Chains",
        event: "manualCheck()",
        status: "Verified"
      };
      
      // In a real implementation, we would call the contract to check supply
      
      toast({
        title: "Supply Verified",
        description: "Token supply is consistent across all chains",
        variant: "default",
      });
    } catch (error) {
      console.error("Error verifying supply:", error);
      toast({
        title: "Verification Failed",
        description: "There was an error checking the token supply",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };
  
  // Format status badge based on status
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Verified':
        return <span className="bg-green-900/20 text-green-500 px-2 py-0.5 text-xs rounded">Verified</span>;
      case 'Reconciled':
        return <span className="bg-amber-900/20 text-amber-500 px-2 py-0.5 text-xs rounded">Reconciled</span>;
      case 'Mismatch':
        return <span className="bg-red-900/20 text-red-500 px-2 py-0.5 text-xs rounded">Mismatch</span>;
      default:
        return <span className="bg-gray-800 text-gray-400 px-2 py-0.5 text-xs rounded">{status}</span>;
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="bg-gray-800 p-4 rounded-lg">
        <div className="flex justify-between text-sm mb-2">
          <span>Total OGT Supply</span>
          <span className="font-medium">{totalSupply} OGT</span>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center mx-auto mb-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="text-xs text-gray-400">Last Audit</div>
            <div className="text-sm font-medium">{lastChecked}</div>
          </div>
          
          <div className="text-center">
            <div className="w-8 h-8 rounded-full bg-green-900/20 text-green-500 flex items-center justify-center mx-auto mb-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="text-xs text-gray-400">Status</div>
            <div className="text-sm font-medium text-green-500">Verified</div>
          </div>
          
          <div className="text-center">
            <div className="w-8 h-8 rounded-full bg-blue-900/20 text-blue-500 flex items-center justify-center mx-auto mb-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2"/>
                <path d="M8 12L11 15L16 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="text-xs text-gray-400">Chains</div>
            <div className="text-sm font-medium">{networks.length} verified</div>
          </div>
        </div>
      </div>
      
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-300">Chain Distribution</h3>
        
        {chainSupplies.map((chain, index) => (
          <div key={index} className="bg-gray-800 p-3 rounded-lg flex items-center">
            <div 
              className="w-3 h-3 rounded-full mr-3"
              style={{ backgroundColor: chain.color }}
            ></div>
            <div className="flex-1">
              <div className="flex justify-between">
                <span className="text-sm">{chain.name}</span>
                <span className="text-sm font-medium">{chain.amount} OGT</span>
              </div>
              <div className="h-1.5 bg-gray-700 rounded-full mt-1.5 overflow-hidden">
                <div 
                  className="h-full"
                  style={{ 
                    width: `${chain.percentage}%`,
                    backgroundColor: chain.color 
                  }}
                ></div>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-gray-400">{chain.percentage}%</span>
                {index === 0 && (
                  <span className="text-xs text-gray-400">Hub Chain</span>
                )}
              </div>
            </div>
          </div>
        ))}

        {isChecking && (
          <div className="mt-4 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span>Checking supply consistency...</span>
              <span>50%</span>
            </div>
            <Progress value={50} className="h-1" />
            
            <div className="relative h-8 mt-4">
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-3 h-3 rounded-full bg-blue-500"></div>
              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 rounded-full bg-purple-500"></div>
              <div className="absolute left-0 right-0 top-1/2 transform -translate-y-1/2 h-0.5 bg-gray-700"></div>
              <div className="absolute left-1/4 top-1/2 transform -translate-y-1/2 -translate-x-1/2 w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center message-travel">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-300">Recent Checks</h3>
        
        <div className="divide-y divide-gray-800">
          {supplyChecks.map((check, index) => (
            <div key={index} className="py-2 flex justify-between">
              <div>
                <div className="text-sm">{check.chains}</div>
                <div className="text-xs text-gray-400">{check.event}</div>
              </div>
              <div className="flex items-center">
                {getStatusBadge(check.status)}
                <div className="text-xs text-gray-400 ml-2">{check.date}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <Button 
        variant="outline" 
        className="w-full mt-2 border-gray-700 text-gray-300 hover:bg-gray-800"
        onClick={verifySupply}
        disabled={isChecking}
      >
        {isChecking ? 'Verifying...' : 'Verify Supply Now'}
      </Button>
      
      <div className="mt-6 p-4 border border-blue-900/30 bg-blue-900/10 rounded-lg">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 bg-blue-900/20 rounded-full flex items-center justify-center flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-400">
              <path d="M13 16H12V12H11M12 8H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" 
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-blue-400 mb-1">How OFT Works</h3>
            <p className="text-xs text-gray-300">
              LayerZero's Omnichain Fungible Token (OFT) maintains supply consistency across all chains by locking tokens
              on the source chain and minting them on the destination chain. This ensures the total token supply remains
              constant across the entire ecosystem. The built-in verification system confirms that tokens are never
              duplicated or lost during cross-chain transfers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}