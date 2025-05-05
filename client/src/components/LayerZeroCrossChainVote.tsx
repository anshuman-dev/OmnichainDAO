import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import ChainSelector from '@/components/ChainSelector';
import { Network } from '@/types/token';
import { useNetwork } from '@/hooks/useNetwork';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/hooks/use-toast';

// Mock proposal data - in real implementation, this would come from smart contracts
const MOCK_PROPOSAL = {
  id: '1',
  title: 'Update Protocol Fee to 0.5%',
  description: 'This proposal aims to change the current protocol fee from 0.1% to 0.5% to better support ecosystem growth.',
  votesFor: 350000,
  votesAgainst: 150000,
  votesAbstain: 50000,
  totalVotes: 550000,
  quorum: 500000,
  status: 'Active',
  deadline: new Date(Date.now() + 86400000 * 2) // 2 days from now
};

export default function LayerZeroCrossChainVote() {
  const { currentNetwork, networks, isHubNetwork } = useNetwork();
  const { isConnected, address } = useWallet();
  const { toast } = useToast();
  
  const [selectedNetwork, setSelectedNetwork] = useState<Network>(currentNetwork);
  const [hasVoted, setHasVoted] = useState<boolean>(false);
  const [isVoting, setIsVoting] = useState<boolean>(false);
  const [selectedVote, setSelectedVote] = useState<'for' | 'against' | 'abstain' | null>(null);
  
  // Calculate voting stats
  const totalVotes = MOCK_PROPOSAL.votesFor + MOCK_PROPOSAL.votesAgainst + MOCK_PROPOSAL.votesAbstain;
  const forPercentage = (MOCK_PROPOSAL.votesFor / totalVotes) * 100;
  const againstPercentage = (MOCK_PROPOSAL.votesAgainst / totalVotes) * 100;
  const abstainPercentage = (MOCK_PROPOSAL.votesAbstain / totalVotes) * 100;
  const quorumPercentage = (totalVotes / MOCK_PROPOSAL.quorum) * 100;
  
  // Format large numbers for display
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };
  
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
    
    try {
      // In a real implementation, this would call the smart contract to cast a vote
      
      // Simulate network delay for LayerZero message passing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Show appropriate message based on if this is the hub chain or not
      if (isHubNetwork(selectedNetwork)) {
        toast({
          title: "Vote Cast Successfully",
          description: `You voted ${voteType} on proposal #${MOCK_PROPOSAL.id}`,
        });
      } else {
        toast({
          title: "Cross-Chain Vote Initiated",
          description: `Vote sent via LayerZero from ${selectedNetwork.name} to Hub Chain. This can take a few minutes to finalize.`,
        });
      }
      
      setHasVoted(true);
    } catch (error) {
      console.error("Error voting:", error);
      toast({
        title: "Voting Failed",
        description: "There was an error casting your vote. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVoting(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Proposal #{MOCK_PROPOSAL.id}: {MOCK_PROPOSAL.title}</CardTitle>
              <CardDescription>
                Vote on this proposal using LayerZero cross-chain messaging
              </CardDescription>
            </div>
            <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
              {MOCK_PROPOSAL.status}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm">{MOCK_PROPOSAL.description}</p>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Current Votes</span>
              <span>{formatNumber(totalVotes)} / {formatNumber(MOCK_PROPOSAL.quorum)} required</span>
            </div>
            <Progress value={quorumPercentage} className="h-2" />
            
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>For</span>
                  <span>{forPercentage.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-muted rounded overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: `${forPercentage}%` }} />
                </div>
                <span className="text-xs text-muted-foreground">{formatNumber(MOCK_PROPOSAL.votesFor)} votes</span>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Against</span>
                  <span>{againstPercentage.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-muted rounded overflow-hidden">
                  <div className="h-full bg-red-500" style={{ width: `${againstPercentage}%` }} />
                </div>
                <span className="text-xs text-muted-foreground">{formatNumber(MOCK_PROPOSAL.votesAgainst)} votes</span>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Abstain</span>
                  <span>{abstainPercentage.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-muted rounded overflow-hidden">
                  <div className="h-full bg-gray-500" style={{ width: `${abstainPercentage}%` }} />
                </div>
                <span className="text-xs text-muted-foreground">{formatNumber(MOCK_PROPOSAL.votesAbstain)} votes</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col space-y-4">
            <div className="flex justify-between items-center">
              <div className="font-medium">Your Voting Network</div>
              <ChainSelector onChainChange={setSelectedNetwork} />
            </div>
            
            <div className="flex items-center justify-between bg-muted/30 p-3 rounded-md">
              <span className="text-sm">Voting from</span>
              <span className="text-sm font-medium">
                {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}
              </span>
            </div>
            
            <div className="flex items-center justify-between bg-muted/30 p-3 rounded-md">
              <span className="text-sm">Cross-chain messaging via</span>
              <div className="flex items-center">
                <span className="text-sm font-medium mr-2">LayerZero</span>
                <div className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded">V2</div>
              </div>
            </div>
            
            {selectedNetwork && !isHubNetwork(selectedNetwork) && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-md text-sm">
                You are voting from a satellite chain. Your vote will be sent to the Hub chain via LayerZero.
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-6">
          <div className="flex space-x-2">
            <Button 
              variant={selectedVote === 'for' ? "default" : "outline"}
              className={`w-28 ${selectedVote === 'for' ? 'bg-green-600 hover:bg-green-700' : ''}`}
              onClick={() => handleVote('for')}
              disabled={isVoting || hasVoted}
            >
              For
            </Button>
            <Button 
              variant={selectedVote === 'against' ? "default" : "outline"}
              className={`w-28 ${selectedVote === 'against' ? 'bg-red-600 hover:bg-red-700' : ''}`}
              onClick={() => handleVote('against')}
              disabled={isVoting || hasVoted}
            >
              Against
            </Button>
            <Button 
              variant={selectedVote === 'abstain' ? "default" : "outline"}
              className="w-28"
              onClick={() => handleVote('abstain')}
              disabled={isVoting || hasVoted}
            >
              Abstain
            </Button>
          </div>
          
          {hasVoted ? (
            <div className="text-sm text-muted-foreground">
              You have already voted on this proposal
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Voting closes in {Math.ceil((MOCK_PROPOSAL.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days
            </div>
          )}
        </CardFooter>
      </Card>
      
      {/* LayerZero Message Status (would be real in production) */}
      {isVoting && (
        <Card>
          <CardHeader>
            <CardTitle>LayerZero Message Status</CardTitle>
            <CardDescription>
              Tracking cross-chain message delivery
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <div className="h-3 w-3 rounded-full bg-blue-500 animate-pulse"></div>
                </div>
                <div>
                  <div className="font-medium">Sending message...</div>
                  <div className="text-sm text-muted-foreground">
                    From {selectedNetwork.name} to {networks.find(n => n.isHub)?.name || 'Hub Chain'}
                  </div>
                </div>
              </div>
              
              <Progress value={25} className="h-1" />
              
              <div className="grid grid-cols-4 text-center text-xs">
                <div className="space-y-1">
                  <div className="h-2 w-2 rounded-full bg-green-500 mx-auto"></div>
                  <div>Message Sent</div>
                </div>
                <div className="space-y-1">
                  <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse mx-auto"></div>
                  <div>DVN Verification</div>
                </div>
                <div className="space-y-1">
                  <div className="h-2 w-2 rounded-full bg-muted mx-auto"></div>
                  <div>Received by Hub</div>
                </div>
                <div className="space-y-1">
                  <div className="h-2 w-2 rounded-full bg-muted mx-auto"></div>
                  <div>Vote Recorded</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}