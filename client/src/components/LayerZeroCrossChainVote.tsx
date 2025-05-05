import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { useNetwork } from '@/hooks/useNetwork';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/hooks/use-toast';
import {
  LucideAlertCircle,
  LucideArrowLeft,
  LucideArrowRight,
  LucideCheck,
  LucideCheckCircle,
  LucideClipboard,
  LucideClock,
  LucideMessageSquare,
  LucideShield,
  LucideVote,
  LucideX
} from 'lucide-react';

// Example proposals
const PROPOSALS = [
  {
    id: '1',
    title: 'OGT-1: Update Protocol Fee to 0.5%',
    description: 'This proposal aims to change the current protocol fee from 0.1% to 0.5% to better support ecosystem growth.',
    status: 'Active',
    endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    votesFor: 1250000,
    votesAgainst: 320000,
    votesAbstain: 180000,
    quorum: 1000000
  },
  {
    id: '2',
    title: 'OGT-2: Add USDC as Reserve Asset',
    description: 'Add USDC as a reserve asset to the protocol treasury and allow it to be used for liquidity provision.',
    status: 'Active',
    endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    votesFor: 890000,
    votesAgainst: 450000,
    votesAbstain: 120000,
    quorum: 1000000
  },
  {
    id: '3',
    title: 'OGT-3: Upgrade OmniGovern Implementation',
    description: 'Upgrade the OmniGovernToken implementation to support additional features and improve gas efficiency.',
    status: 'Completed',
    endTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    votesFor: 1750000,
    votesAgainst: 250000,
    votesAbstain: 50000,
    quorum: 1000000,
    result: 'Passed'
  }
];

export default function LayerZeroCrossChainVote() {
  const { currentNetwork } = useNetwork();
  const { isConnected, openWalletModal } = useWallet();
  const { toast } = useToast();
  
  // State for voting
  const [selectedProposal, setSelectedProposal] = useState<string | null>(null);
  const [voteType, setVoteType] = useState<'for' | 'against' | 'abstain'>('for');
  const [isVoting, setIsVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [showVoteSuccess, setShowVoteSuccess] = useState(false);
  const [votingPower, setVotingPower] = useState('25,000');
  
  // Handle proposal selection
  const handleProposalSelect = (proposalId: string) => {
    setSelectedProposal(proposalId);
    setHasVoted(false);
    setShowVoteSuccess(false);
  };
  
  // Get selected proposal
  const getSelectedProposal = () => {
    return PROPOSALS.find(p => p.id === selectedProposal);
  };
  
  // Calculate percentage for votes
  const calculatePercentage = (votes: number, total: number) => {
    return total === 0 ? 0 : Math.round((votes / total) * 100);
  };
  
  // Format number with commas
  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };
  
  // Submit vote
  const submitVote = () => {
    if (!isConnected) {
      openWalletModal();
      return;
    }
    
    if (!selectedProposal) {
      toast({
        title: "No Proposal Selected",
        description: "Please select a proposal to vote on.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    
    setIsVoting(true);
    
    // Simulate API call to submit vote
    setTimeout(() => {
      setIsVoting(false);
      setHasVoted(true);
      setShowVoteSuccess(true);
      
      toast({
        title: "Vote Submitted",
        description: `Your vote has been submitted ${
          currentNetwork?.name !== 'Ethereum Sepolia' 
            ? `from ${currentNetwork?.name} and will be relayed to the hub chain via LayerZero`
            : ''
        }.`,
        duration: 5000,
      });
      
      // Update the proposal votes (in a real app this would come from the backend)
      const proposal = getSelectedProposal();
      if (proposal) {
        if (voteType === 'for') {
          proposal.votesFor += parseInt(votingPower.replace(/,/g, ''));
        } else if (voteType === 'against') {
          proposal.votesAgainst += parseInt(votingPower.replace(/,/g, ''));
        } else {
          proposal.votesAbstain += parseInt(votingPower.replace(/,/g, ''));
        }
      }
    }, 2000);
  };
  
  // Format time remaining
  const formatTimeRemaining = (endTime: Date) => {
    const now = new Date();
    const diff = endTime.getTime() - now.getTime();
    
    if (diff <= 0) {
      return "Voting ended";
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h remaining`;
    } else {
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m remaining`;
    }
  };
  
  // Get proposal status badge
  const getProposalStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return (
          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
            Active
          </span>
        );
      case 'Completed':
        return (
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
            Completed
          </span>
        );
      default:
        return (
          <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Left Column - Proposal List */}
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <LucideClipboard className="w-5 h-5 text-primary" />
              <CardTitle>Governance Proposals</CardTitle>
            </div>
            <CardDescription>
              Active and recent governance proposals.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {PROPOSALS.map((proposal) => (
              <div 
                key={proposal.id} 
                className={`border p-3 rounded-md cursor-pointer hover:border-primary hover:bg-primary/5 transition-all ${
                  selectedProposal === proposal.id ? 'border-primary bg-primary/5' : ''
                }`}
                onClick={() => handleProposalSelect(proposal.id)}
              >
                <div className="flex justify-between mb-1">
                  <h3 className="font-medium text-sm">{proposal.title}</h3>
                  {getProposalStatusBadge(proposal.status)}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <LucideClock className="w-3 h-3" />
                  <span>
                    {proposal.status === 'Active' 
                      ? formatTimeRemaining(proposal.endTime)
                      : proposal.result === 'Passed' 
                        ? 'Passed' 
                        : 'Failed'
                    }
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        
        {/* Cross-Chain Voting Info */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <LucideShield className="w-5 h-5 text-primary" />
              <CardTitle>Cross-Chain Voting</CardTitle>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              OmniGovern DAO allows voting from any chain where governance tokens are held. Votes are securely transmitted via LayerZero V2 to the hub chain.
            </p>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <LucideCheck className="w-4 h-4 min-w-[16px] text-green-500" />
                <span>Vote from any supported chain</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <LucideCheck className="w-4 h-4 min-w-[16px] text-green-500" />
                <span>Secure message verification via DVN</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <LucideCheck className="w-4 h-4 min-w-[16px] text-green-500" />
                <span>Voting power based on token holdings</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <LucideCheck className="w-4 h-4 min-w-[16px] text-green-500" />
                <span>Real-time voting results</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Right Columns - Proposal Details & Voting */}
      <div className="md:col-span-2 space-y-6">
        {selectedProposal && getSelectedProposal() ? (
          <>
            {/* Proposal Details */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <LucideMessageSquare className="w-5 h-5 text-primary" />
                  <CardTitle>Proposal Details</CardTitle>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold">{getSelectedProposal()?.title}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <div>
                      {getProposalStatusBadge(getSelectedProposal()?.status || '')}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {getSelectedProposal()?.status === 'Active' 
                        ? formatTimeRemaining(getSelectedProposal()?.endTime || new Date())
                        : getSelectedProposal()?.result === 'Passed' 
                          ? 'Passed' 
                          : 'Failed'
                      }
                    </span>
                  </div>
                </div>
                
                <p className="text-muted-foreground">
                  {getSelectedProposal()?.description}
                </p>
                
                {/* Voting Results */}
                <div className="space-y-4 pt-2">
                  <h3 className="font-medium">Current Voting Results</h3>
                  
                  <div className="space-y-3">
                    {/* For Votes */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-sm">
                        <span>For</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {formatNumber(getSelectedProposal()?.votesFor || 0)}
                          </span>
                          <span className="text-green-600">
                            ({calculatePercentage(
                              getSelectedProposal()?.votesFor || 0, 
                              (getSelectedProposal()?.votesFor || 0) + 
                              (getSelectedProposal()?.votesAgainst || 0) + 
                              (getSelectedProposal()?.votesAbstain || 0)
                            )}%)
                          </span>
                        </div>
                      </div>
                      <Progress 
                        value={calculatePercentage(
                          getSelectedProposal()?.votesFor || 0, 
                          (getSelectedProposal()?.votesFor || 0) + 
                          (getSelectedProposal()?.votesAgainst || 0) + 
                          (getSelectedProposal()?.votesAbstain || 0)
                        )} 
                        className="bg-muted h-2"
                        indicatorColor="bg-green-500"
                      />
                    </div>
                    
                    {/* Against Votes */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-sm">
                        <span>Against</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {formatNumber(getSelectedProposal()?.votesAgainst || 0)}
                          </span>
                          <span className="text-red-600">
                            ({calculatePercentage(
                              getSelectedProposal()?.votesAgainst || 0, 
                              (getSelectedProposal()?.votesFor || 0) + 
                              (getSelectedProposal()?.votesAgainst || 0) + 
                              (getSelectedProposal()?.votesAbstain || 0)
                            )}%)
                          </span>
                        </div>
                      </div>
                      <Progress 
                        value={calculatePercentage(
                          getSelectedProposal()?.votesAgainst || 0, 
                          (getSelectedProposal()?.votesFor || 0) + 
                          (getSelectedProposal()?.votesAgainst || 0) + 
                          (getSelectedProposal()?.votesAbstain || 0)
                        )} 
                        className="bg-muted h-2"
                        indicatorColor="bg-red-500"
                      />
                    </div>
                    
                    {/* Abstain Votes */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-sm">
                        <span>Abstain</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {formatNumber(getSelectedProposal()?.votesAbstain || 0)}
                          </span>
                          <span className="text-yellow-600">
                            ({calculatePercentage(
                              getSelectedProposal()?.votesAbstain || 0, 
                              (getSelectedProposal()?.votesFor || 0) + 
                              (getSelectedProposal()?.votesAgainst || 0) + 
                              (getSelectedProposal()?.votesAbstain || 0)
                            )}%)
                          </span>
                        </div>
                      </div>
                      <Progress 
                        value={calculatePercentage(
                          getSelectedProposal()?.votesAbstain || 0, 
                          (getSelectedProposal()?.votesFor || 0) + 
                          (getSelectedProposal()?.votesAgainst || 0) + 
                          (getSelectedProposal()?.votesAbstain || 0)
                        )} 
                        className="bg-muted h-2"
                        indicatorColor="bg-yellow-500"
                      />
                    </div>
                  </div>
                  
                  {/* Quorum Progress */}
                  <div className="space-y-1 pt-2">
                    <div className="flex justify-between items-center text-sm">
                      <span>Quorum</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {formatNumber((getSelectedProposal()?.votesFor || 0) + (getSelectedProposal()?.votesAgainst || 0) + (getSelectedProposal()?.votesAbstain || 0))}
                          /{formatNumber(getSelectedProposal()?.quorum || 0)}
                        </span>
                        <span className="text-blue-600">
                          ({calculatePercentage(
                            (getSelectedProposal()?.votesFor || 0) + (getSelectedProposal()?.votesAgainst || 0) + (getSelectedProposal()?.votesAbstain || 0),
                            getSelectedProposal()?.quorum || 1
                          )}%)
                        </span>
                      </div>
                    </div>
                    <Progress 
                      value={calculatePercentage(
                        (getSelectedProposal()?.votesFor || 0) + (getSelectedProposal()?.votesAgainst || 0) + (getSelectedProposal()?.votesAbstain || 0),
                        getSelectedProposal()?.quorum || 1
                      )} 
                      className="bg-muted h-2"
                      indicatorColor="bg-blue-500"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Voting Interface */}
            {getSelectedProposal()?.status === 'Active' && (
              showVoteSuccess ? (
                <Card className="bg-green-50 border-green-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <LucideCheckCircle className="w-5 h-5 text-green-500" />
                      <CardTitle className="text-green-800">Vote Submitted Successfully</CardTitle>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <p className="text-green-800">
                      Your vote has been submitted successfully
                      {currentNetwork?.name !== 'Ethereum Sepolia' && (
                        <> and is being transmitted from <strong>{currentNetwork?.name}</strong> to the hub chain via LayerZero</>
                      )}.
                    </p>
                    
                    <div className="bg-white/60 rounded-md p-4 space-y-2 border border-green-200">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Proposal:</span>
                        <span className="font-medium">{getSelectedProposal()?.title}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Vote:</span>
                        <span className={`font-medium ${
                          voteType === 'for' ? 'text-green-600' : 
                          voteType === 'against' ? 'text-red-600' : 'text-yellow-600'
                        }`}>
                          {voteType === 'for' ? 'For' : voteType === 'against' ? 'Against' : 'Abstain'}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Voting Power:</span>
                        <span className="font-medium">{votingPower} OGT</span>
                      </div>
                      {currentNetwork?.name !== 'Ethereum Sepolia' && (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">From Chain:</span>
                            <span className="font-medium">{currentNetwork?.name}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">To Chain:</span>
                            <span className="font-medium">Ethereum Sepolia (Hub)</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">LayerZero Status:</span>
                            <span className="font-medium text-green-600">Message Delivered</span>
                          </div>
                        </>
                      )}
                    </div>
                    
                    <Button
                      onClick={() => setShowVoteSuccess(false)}
                      variant="outline"
                      className="w-full"
                    >
                      Back to Voting
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <LucideVote className="w-5 h-5 text-primary" />
                      <CardTitle>Cast Your Vote</CardTitle>
                    </div>
                    <CardDescription>
                      {currentNetwork?.isHub 
                        ? 'Vote directly on the hub chain.'
                        : `Vote from ${currentNetwork?.name} will be securely transmitted to the hub chain via LayerZero.`
                      }
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    {/* Voting Power */}
                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
                      <div>
                        <Label>Your Voting Power</Label>
                        <p className="text-sm text-muted-foreground">
                          Based on your OGT holdings on {currentNetwork?.name}
                        </p>
                      </div>
                      <div className="text-2xl font-bold">{votingPower}</div>
                    </div>
                    
                    {/* Vote Type Selection */}
                    <div className="space-y-3">
                      <Label>Vote</Label>
                      <RadioGroup 
                        defaultValue="for" 
                        value={voteType}
                        onValueChange={(value) => setVoteType(value as 'for' | 'against' | 'abstain')}
                        className="flex flex-col space-y-1"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="for" id="vote-for" />
                          <Label htmlFor="vote-for" className="font-normal cursor-pointer">For</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="against" id="vote-against" />
                          <Label htmlFor="vote-against" className="font-normal cursor-pointer">Against</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="abstain" id="vote-abstain" />
                          <Label htmlFor="vote-abstain" className="font-normal cursor-pointer">Abstain</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    
                    {/* Cross-Chain Message Info */}
                    {!currentNetwork?.isHub && (
                      <div className="p-3 border border-blue-200 bg-blue-50 rounded-md space-y-2">
                        <div className="flex items-start gap-2">
                          <LucideAlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-blue-800">Cross-Chain Vote</h4>
                            <p className="text-sm text-blue-600">
                              Your vote will be sent from {currentNetwork?.name} to the hub chain (Ethereum Sepolia) using LayerZero secure messaging.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-center gap-3 pt-1">
                          <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 border border-blue-200">
                              {currentNetwork?.name?.charAt(0) || '?'}
                            </div>
                            <span className="text-xs mt-1">{currentNetwork?.name}</span>
                          </div>
                          <div className="flex items-center text-blue-400">
                            <LucideArrowRight className="w-5 h-5" />
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 border border-blue-200">
                              E
                            </div>
                            <span className="text-xs mt-1">Ethereum Sepolia</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                  
                  <CardFooter>
                    <Button 
                      onClick={submitVote}
                      disabled={isVoting || hasVoted}
                      className="w-full"
                    >
                      {!isConnected 
                        ? "Connect Wallet to Vote"
                        : isVoting 
                          ? "Submitting Vote..." 
                          : hasVoted 
                            ? "Vote Submitted" 
                            : "Submit Vote"
                      }
                    </Button>
                  </CardFooter>
                </Card>
              )
            )}
          </>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
              <LucideMessageSquare className="w-12 h-12 text-muted-foreground" />
              <div>
                <h3 className="text-xl font-medium">Select a Proposal</h3>
                <p className="text-muted-foreground mt-2 max-w-md">
                  Choose a governance proposal from the list to view details and cast your vote.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}