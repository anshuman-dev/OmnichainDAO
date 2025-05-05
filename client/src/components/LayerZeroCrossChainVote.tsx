import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import ChainSelector from '@/components/ChainSelector';
import { Network } from '@/types/token';
import { useNetwork } from '@/hooks/useNetwork';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/hooks/use-toast';

export default function LayerZeroCrossChainVote() {
  const { currentNetwork, networks, isHubNetwork } = useNetwork();
  const { isConnected, address } = useWallet();
  const { toast } = useToast();
  
  const [selectedNetwork, setSelectedNetwork] = useState<Network>(currentNetwork);
  const [hasVoted, setHasVoted] = useState<boolean>(false);
  const [isVoting, setIsVoting] = useState<boolean>(false);
  const [selectedVote, setSelectedVote] = useState<'for' | 'against' | 'abstain' | null>(null);
  const [messageStatus, setMessageStatus] = useState<number>(0);
  
  // Handle voting
  const handleVote = async (voteType: 'for' | 'against' | 'abstain') => {
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to vote",
        variant: "destructive",
      });
      return;
    }
    
    setIsVoting(true);
    setSelectedVote(voteType);
    setMessageStatus(0);
    
    try {
      // In a real implementation, this would call the smart contract to cast a vote
      // using the OFT contract's cross-chain messaging capabilities
      
      // Simulate the LayerZero message passing process
      await simulateCrossChainVote(voteType);
      
      // Final confirmation
      setHasVoted(true);
    } catch (error) {
      console.error("Error voting:", error);
      toast({
        title: "Voting Failed",
        description: "There was an error casting your vote. Please try again.",
        variant: "destructive",
      });
      setIsVoting(false);
    }
  };
  
  // Simulate the progress of a cross-chain vote
  const simulateCrossChainVote = async (voteType: string) => {
    // Step 1: Message sent - This simulates the initial transaction being sent from the source chain
    setMessageStatus(25);
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast({
      title: "Message Sent",
      description: `Vote transaction submitted on ${selectedNetwork.name}`,
    });
    
    // Step 2: DVN verification - This simulates the LayerZero security verification by DVNs
    setMessageStatus(50);
    await new Promise(resolve => setTimeout(resolve, 2000));
    toast({
      title: "DVN Verification",
      description: "LayerZero validators are verifying your vote",
    });
    
    // Step 3: Message received by hub - This simulates the message being received on the destination chain
    setMessageStatus(75);
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast({
      title: "Message Received",
      description: `Vote received on ${networks.find(n => n.isHub)?.name || 'Hub Chain'}`,
    });
    
    // Step 4: Vote recorded - This simulates the vote being finalized
    setMessageStatus(100);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Show appropriate message based on if this is the hub chain or not
    toast({
      title: "Vote Recorded Successfully",
      description: isHubNetwork(selectedNetwork) 
        ? `Your vote has been recorded`
        : `Your cross-chain vote was successfully processed via LayerZero`,
    });
    
    // After a short delay, hide the message status component
    setTimeout(() => {
      setIsVoting(false);
      setMessageStatus(0);
    }, 3000);
  };
  
  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Cross-Chain Voting via LayerZero</CardTitle>
              <CardDescription>
                Cast votes between chains using LayerZero's OFT implementation
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-gray-800 p-4 rounded-lg">
            <p className="text-sm text-gray-200">
              This demonstration shows how governance votes can be cast across different blockchains using LayerZero's 
              messaging protocol. Select your network, choose your vote, and see how the vote is transmitted securely 
              across chains.
            </p>
          </div>
          
          <div className="flex flex-col space-y-4">
            <div className="flex justify-between items-center">
              <div className="font-medium">Your Voting Network</div>
              <ChainSelector onChainChange={setSelectedNetwork} />
            </div>
            
            <div className="flex items-center justify-between bg-gray-800 p-3 rounded-md">
              <span className="text-sm">Voting from</span>
              <span className="text-sm font-medium">
                {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}
              </span>
            </div>
            
            <div className="flex items-center justify-between bg-gray-800 p-3 rounded-md">
              <span className="text-sm">Cross-chain messaging via</span>
              <div className="flex items-center">
                <span className="text-sm font-medium mr-2">LayerZero</span>
                <div className="bg-blue-900/50 text-blue-400 text-xs px-2 py-0.5 rounded">V2</div>
              </div>
            </div>
            
            {selectedNetwork && !isHubNetwork(selectedNetwork) && (
              <div className="bg-blue-900/20 border border-blue-900/30 text-blue-400 p-3 rounded-md text-sm">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-0.5">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="mr-2">
                      <path d="M13 16H12V12H11M12 8H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <p>
                    You are voting from a satellite chain. Your vote will be securely transmitted to the Hub chain via LayerZero's 
                    cross-chain messaging protocol. Watch the message status below after voting to see the journey of your vote.
                  </p>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex flex-col p-4 rounded-lg bg-gradient-to-b from-gray-800 to-gray-900 border border-gray-700">
            <h3 className="text-sm font-medium mb-3">Technical Process</h3>
            <ol className="text-xs text-gray-300 space-y-2">
              <li className="flex items-start">
                <span className="bg-gray-700 text-xs rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5">1</span>
                <span><span className="text-blue-400">OFT Contract</span> receives your vote transaction on the source chain</span>
              </li>
              <li className="flex items-start">
                <span className="bg-gray-700 text-xs rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5">2</span>
                <span><span className="text-blue-400">LayerZero Endpoint</span> encodes the message and prepares for cross-chain delivery</span>
              </li>
              <li className="flex items-start">
                <span className="bg-gray-700 text-xs rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5">3</span>
                <span><span className="text-purple-400">DVN (Data Validation Network)</span> verifies the message with multiple validators</span>
              </li>
              <li className="flex items-start">
                <span className="bg-gray-700 text-xs rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5">4</span>
                <span><span className="text-blue-400">Destination Endpoint</span> receives and verifies the message</span>
              </li>
              <li className="flex items-start">
                <span className="bg-gray-700 text-xs rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5">5</span>
                <span><span className="text-blue-400">Hub OFT Contract</span> records your vote in the governance system</span>
              </li>
            </ol>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t border-gray-800 pt-6">
          <div className="flex space-x-2">
            <Button 
              variant={selectedVote === 'for' ? "default" : "outline"}
              className={`w-28 ${selectedVote === 'for' ? 'bg-green-700 hover:bg-green-800 border-green-600' : 'border-gray-700 hover:border-gray-600 hover:bg-gray-800'}`}
              onClick={() => handleVote('for')}
              disabled={isVoting || hasVoted}
            >
              For
            </Button>
            <Button 
              variant={selectedVote === 'against' ? "default" : "outline"}
              className={`w-28 ${selectedVote === 'against' ? 'bg-red-700 hover:bg-red-800 border-red-600' : 'border-gray-700 hover:border-gray-600 hover:bg-gray-800'}`}
              onClick={() => handleVote('against')}
              disabled={isVoting || hasVoted}
            >
              Against
            </Button>
            <Button 
              variant={selectedVote === 'abstain' ? "default" : "outline"}
              className={`w-28 ${selectedVote === 'abstain' ? 'bg-gray-700 hover:bg-gray-800 border-gray-600' : 'border-gray-700 hover:border-gray-600 hover:bg-gray-800'}`}
              onClick={() => handleVote('abstain')}
              disabled={isVoting || hasVoted}
            >
              Abstain
            </Button>
          </div>
          
          {hasVoted ? (
            <Button 
              variant="outline" 
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
              onClick={() => setHasVoted(false)}
            >
              Vote Again
            </Button>
          ) : (
            <div className="flex items-center text-sm text-gray-400">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="mr-2">
                <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Connect wallet to participate
            </div>
          )}
        </CardFooter>
      </Card>
      
      {/* LayerZero Message Status */}
      {isVoting && (
        <Card className="w-full bg-gray-900 border border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">LayerZero Message Status</CardTitle>
            <CardDescription>
              Tracking your cross-chain message
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Message Progress</span>
                  <span>{messageStatus}%</span>
                </div>
                <Progress value={messageStatus} className="h-1.5 bg-gray-800" />
              </div>
              
              <div className="relative pt-2">
                <div className="absolute top-8 left-0 right-0 h-0.5 bg-gray-800 z-0"></div>
                
                <div className="relative z-10 grid grid-cols-4 text-center text-xs">
                  <div className="flex flex-col items-center">
                    <div className={`h-4 w-4 rounded-full ${messageStatus >= 25 ? 'bg-green-500' : messageStatus > 0 ? 'bg-blue-600 animate-pulse' : 'bg-gray-700'} mb-2`}></div>
                    <div className="text-xs">Message Sent</div>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <div className={`h-4 w-4 rounded-full ${messageStatus >= 50 ? 'bg-green-500' : messageStatus >= 25 ? 'bg-blue-600 animate-pulse' : 'bg-gray-700'} mb-2`}></div>
                    <div className="text-xs">DVN Verification</div>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <div className={`h-4 w-4 rounded-full ${messageStatus >= 75 ? 'bg-green-500' : messageStatus >= 50 ? 'bg-blue-600 animate-pulse' : 'bg-gray-700'} mb-2`}></div>
                    <div className="text-xs">Message Received</div>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <div className={`h-4 w-4 rounded-full ${messageStatus >= 100 ? 'bg-green-500' : messageStatus >= 75 ? 'bg-blue-600 animate-pulse' : 'bg-gray-700'} mb-2`}></div>
                    <div className="text-xs">Vote Recorded</div>
                  </div>
                </div>
              </div>
              
              <div className="pt-2">
                <div className="flex items-center space-x-4 bg-gray-800/50 p-3 rounded-lg">
                  <div className="h-8 w-8 rounded-full bg-blue-900/30 flex items-center justify-center">
                    <div className="h-3 w-3 rounded-full bg-blue-500 animate-pulse"></div>
                  </div>
                  <div>
                    <div className="font-medium">Cross-Chain Message</div>
                    <div className="text-xs text-gray-400">
                      From {selectedNetwork.name} to {networks.find(n => n.isHub)?.name || 'Hub Chain'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}