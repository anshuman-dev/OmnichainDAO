import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useWallet } from '@/hooks/useWallet';
import ChainSelector from '@/components/ChainSelector';
import LayerZeroCrossChainVote from '@/components/LayerZeroCrossChainVote';
import LayerZeroAtomicExecution from '@/components/LayerZeroAtomicExecution';
import LayerZeroDVNConfig from '@/components/LayerZeroDVNConfig';
import { Button } from '@/components/ui/button';

export default function LayerZeroDemo() {
  const { isConnected, connectWallet, openWalletModal } = useWallet();
  const [activeTab, setActiveTab] = useState('voting');
  
  const handleConnect = async () => {
    openWalletModal();
  };
  
  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">OmniGovern DAO</h1>
          <p className="text-muted-foreground">
            Cross-chain governance powered by LayerZero V2
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <ChainSelector />
          {!isConnected ? (
            <Button onClick={handleConnect}>
              Connect Wallet
            </Button>
          ) : (
            <Button variant="outline">
              Connected
            </Button>
          )}
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>LayerZero V2 Integration Demo</CardTitle>
          <CardDescription>
            Explore key features of LayerZero V2 for cross-chain governance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="voting" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 w-full max-w-lg mb-6">
              <TabsTrigger value="voting">Cross-Chain Voting</TabsTrigger>
              <TabsTrigger value="execution">lzCompose Execution</TabsTrigger>
              <TabsTrigger value="dvn">DVN Security</TabsTrigger>
            </TabsList>
            
            <div className="mt-4">
              {!isConnected && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-amber-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-amber-800">Connect Your Wallet</h3>
                      <div className="mt-2 text-sm text-amber-700">
                        <p>Please connect your wallet to interact with the LayerZero demo.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <TabsContent value="voting">
                <LayerZeroCrossChainVote />
              </TabsContent>
              
              <TabsContent value="execution">
                <LayerZeroAtomicExecution />
              </TabsContent>
              
              <TabsContent value="dvn">
                <LayerZeroDVNConfig />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>How LayerZero V2 Enhances OmniGovern DAO</CardTitle>
          <CardDescription>
            Key technical benefits of using LayerZero for cross-chain governance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg border border-muted">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2">Enhanced Security</h3>
              <p className="text-muted-foreground">
                LayerZero V2's DVN (Data Validation Network) allows validating messages through multiple independent verifiers, creating a trustless security layer for cross-chain governance.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg border border-muted">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2">Atomic Operations</h3>
              <p className="text-muted-foreground">
                lzCompose enables atomic execution of governance decisions across multiple blockchains, ensuring consistent state changes regardless of network conditions.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg border border-muted">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2">Multi-Chain Consistency</h3>
              <p className="text-muted-foreground">
                OFT (Omnichain Fungible Token) standard ensures token supply consistency across all chains, with built-in validation mechanisms to prevent inconsistencies.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}