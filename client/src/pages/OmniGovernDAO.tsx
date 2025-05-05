import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import ChainSelector from '@/components/ChainSelector';
import LayerZeroCrossChainVote from '@/components/LayerZeroCrossChainVote';
import LayerZeroAtomicExecution from '@/components/LayerZeroAtomicExecution';
import LayerZeroDVNConfig from '@/components/LayerZeroDVNConfig';
import SupplyConsistencyChecker from '@/components/SupplyConsistencyChecker';
import { useWallet } from '@/hooks/useWallet';

export default function OmniGovernDAO() {
  const { isConnected, openWalletModal } = useWallet();
  const [activeTab, setActiveTab] = useState('voting');
  
  const handleConnect = () => {
    openWalletModal();
  };
  
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L20 7V17L12 22L4 17V7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">OmniGovern</h1>
                <p className="text-xs text-gray-400">Powered by LayerZero V2</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden md:block">
                <div className="flex space-x-4 items-center">
                  <div className="text-sm text-gray-400">
                    <span className="uppercase">Gas</span>
                    <div className="font-medium text-white">$0.05</div>
                  </div>
                  
                  <div className="h-6 border-r border-gray-800"></div>
                  
                  <div>
                    <ChainSelector />
                  </div>
                </div>
              </div>
              
              {!isConnected ? (
                <Button onClick={handleConnect} variant="default" className="bg-primary hover:bg-primary/90">
                  Connect Wallet
                </Button>
              ) : (
                <Button variant="outline" className="border-gray-700 text-gray-200">
                  Connected
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>
      
      {/* Navigation */}
      <nav className="border-b border-gray-800 bg-black">
        <div className="container mx-auto px-4">
          <div className="flex overflow-x-auto">
            <div className="flex-1 flex">
              <button className="px-4 py-3 text-sm font-medium border-b-2 border-primary text-primary">
                Overview
              </button>
              <button className="px-4 py-3 text-sm font-medium border-b-2 border-transparent text-gray-400 hover:text-gray-200">
                Token Management
              </button>
              <button className="px-4 py-3 text-sm font-medium border-b-2 border-transparent text-gray-400 hover:text-gray-200">
                Bridge
              </button>
              <button className="px-4 py-3 text-sm font-medium border-b-2 border-transparent text-gray-400 hover:text-gray-200">
                Governance
              </button>
              <button className="px-4 py-3 text-sm font-medium border-b-2 border-transparent text-gray-400 hover:text-gray-200">
                Proposals
              </button>
              <button className="px-4 py-3 text-sm font-medium border-b-2 border-transparent text-gray-400 hover:text-gray-200">
                Voting
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Token Info */}
          <div className="col-span-2">
            <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">OmniChain Governance</h2>
                  <div className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                    PHASE 1
                  </div>
                </div>
                
                <Tabs defaultValue="voting" value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid grid-cols-3 w-full max-w-lg mb-6 bg-gray-800">
                    <TabsTrigger 
                      value="voting"
                      className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                    >
                      Cross-Chain Voting
                    </TabsTrigger>
                    <TabsTrigger 
                      value="execution"
                      className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                    >
                      lzCompose Execution
                    </TabsTrigger>
                    <TabsTrigger 
                      value="dvn"
                      className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                    >
                      DVN Security
                    </TabsTrigger>
                  </TabsList>
                  
                  <div className="mt-4">
                    {!isConnected && (
                      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 mb-6">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-amber-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-amber-400">Connect Your Wallet</h3>
                            <div className="mt-2 text-sm text-gray-300">
                              <p>Please connect your wallet to interact with OmniGovern DAO.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <TabsContent value="voting" className="mt-0">
                      <LayerZeroCrossChainVote />
                    </TabsContent>
                    
                    <TabsContent value="execution" className="mt-0">
                      <LayerZeroAtomicExecution />
                    </TabsContent>
                    
                    <TabsContent value="dvn" className="mt-0">
                      <LayerZeroDVNConfig />
                    </TabsContent>
                  </div>
                </Tabs>
              </div>
            </div>
          </div>
          
          {/* Right Column - Supply Consistency Checker */}
          <div className="col-span-1">
            <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
              <div className="p-6">
                <h2 className="text-lg font-bold mb-4">Supply Consistency</h2>
                <SupplyConsistencyChecker />
              </div>
            </div>
            
            {/* LayerZero Technology Section */}
            <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden mt-6">
              <div className="p-6">
                <h2 className="text-lg font-bold mb-4">LayerZero Technology</h2>
                
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 p-4 rounded-lg border border-blue-900/50">
                    <div className="flex items-start">
                      <div className="w-8 h-8 rounded-full bg-blue-900/30 text-blue-400 flex items-center justify-center mr-3 mt-0.5">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M22 12L3 20L3 4L22 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-blue-400">Ultra-Reliable Messaging</h3>
                        <p className="text-xs text-gray-300 mt-1">
                          LayerZero V2 provides 99.9999% uptime, ensuring your governance proposals and votes are always delivered across chains.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 p-4 rounded-lg border border-purple-900/50">
                    <div className="flex items-start">
                      <div className="w-8 h-8 rounded-full bg-purple-900/30 text-purple-400 flex items-center justify-center mr-3 mt-0.5">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-purple-400">DVN Security</h3>
                        <p className="text-xs text-gray-300 mt-1">
                          Data Validation Networks provide multiple independent verification paths, preventing malicious transactions across chains.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 p-4 rounded-lg border border-green-900/50">
                    <div className="flex items-start">
                      <div className="w-8 h-8 rounded-full bg-green-900/30 text-green-400 flex items-center justify-center mr-3 mt-0.5">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M4 16L8.58579 11.4142C9.36683 10.6332 10.6332 10.6332 11.4142 11.4142L16 16M14 14L15.5858 12.4142C16.3668 11.6332 17.6332 11.6332 18.4142 12.4142L20 14M14 8H14.01M6 20H18C19.1046 20 20 19.1046 20 18V6C20 4.89543 19.1046 4 18 4H6C4.89543 4 4 4.89543 4 6V18C4 19.1046 4.89543 20 6 20Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-green-400">lzCompose</h3>
                        <p className="text-xs text-gray-300 mt-1">
                          Execute atomic transactions across multiple chains simultaneously, ensuring governance decisions are applied consistently.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}