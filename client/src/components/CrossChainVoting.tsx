import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"; 
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label"; 
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useGovernance } from "@/hooks/useGovernance";
import { useWallet } from "@/hooks/useWallet";
import { useNetwork } from "@/hooks/useNetwork";
import { AVAILABLE_NETWORKS } from "@/lib/constants";

type VoteType = "for" | "against" | "abstain";

interface ChainVotingStatus {
  chainId: string;
  chainName: string;
  hasVoted: boolean;
  votingPower: string;
  voteType?: VoteType;
}

export default function CrossChainVoting() {
  const { toast } = useToast();
  const { vote, crossChainVote, checkVoted, getVoterPower, getProposal, loading, error } = useGovernance();
  const { isConnected, address, openWalletModal } = useWallet();
  const { currentNetwork, setCurrentNetwork } = useNetwork();
  
  const [proposalId, setProposalId] = useState("1"); // Default proposal ID
  const [proposalDetails, setProposalDetails] = useState<any>(null);
  const [voteType, setVoteType] = useState<VoteType>("for");
  const [voteReason, setVoteReason] = useState("");
  const [selectedChain, setSelectedChain] = useState<string>(AVAILABLE_NETWORKS[0]?.id || "");
  const [chainVotingStatus, setChainVotingStatus] = useState<ChainVotingStatus[]>([]);
  const [votingTab, setVotingTab] = useState<"single" | "multi">("single");
  
  // Calculate aggregated votes
  const totalForVotes = proposalDetails ? parseInt(proposalDetails.forVotes || "0") : 0;
  const totalAgainstVotes = proposalDetails ? parseInt(proposalDetails.againstVotes || "0") : 0;
  const totalAbstainVotes = proposalDetails ? parseInt(proposalDetails.abstainVotes || "0") : 0;
  const totalVotes = totalForVotes + totalAgainstVotes + totalAbstainVotes;
  
  const forPercentage = totalVotes > 0 ? (totalForVotes / totalVotes) * 100 : 0;
  const againstPercentage = totalVotes > 0 ? (totalAgainstVotes / totalVotes) * 100 : 0;
  const abstainPercentage = totalVotes > 0 ? (totalAbstainVotes / totalVotes) * 100 : 0;
  
  // Fetch proposal details and voting status on mount
  useEffect(() => {
    if (isConnected && proposalId) {
      loadProposalDetails();
      checkVotingStatus();
    }
  }, [isConnected, proposalId, address, currentNetwork]);
  
  // Load proposal details
  const loadProposalDetails = async () => {
    try {
      const details = await getProposal(proposalId);
      if (details) {
        setProposalDetails(details);
      }
    } catch (err) {
      console.error("Failed to load proposal details:", err);
    }
  };
  
  // Check voting status across all chains
  const checkVotingStatus = async () => {
    if (!isConnected || !address) return;
    
    const statusPromises = AVAILABLE_NETWORKS.map(async (network) => {
      try {
        // Find the original chain where the proposal was created
        const hasVoted = await checkVoted(proposalId);
        const votingPower = await getVoterPower();
        
        return {
          chainId: network.id,
          chainName: network.name,
          hasVoted,
          votingPower,
        };
      } catch (err) {
        console.error(`Failed to check voting status for ${network.name}:`, err);
        return {
          chainId: network.id,
          chainName: network.name,
          hasVoted: false,
          votingPower: "0",
        };
      }
    });
    
    const statuses = await Promise.all(statusPromises);
    setChainVotingStatus(statuses);
  };
  
  // Handle vote submission for a single chain
  const handleSingleChainVote = async () => {
    if (!isConnected) {
      openWalletModal();
      return;
    }
    
    try {
      const support = voteType === "for" ? 1 : voteType === "against" ? 0 : 2;
      
      // Call the governance hook to cast the vote
      await vote(proposalId, support, voteReason);
      
      toast({
        title: "Vote Submitted",
        description: `Your ${voteType} vote has been cast successfully on ${currentNetwork?.name}`
      });
      
      // Refresh voting status
      checkVotingStatus();
      loadProposalDetails();
      
      // Reset form after successful submission
      setVoteReason("");
    } catch (err: any) {
      toast({
        title: "Error Submitting Vote",
        description: err.message || "Failed to submit vote",
        variant: "destructive"
      });
    }
  };
  
  // Handle multi-chain vote submission
  const handleMultiChainVote = async () => {
    if (!isConnected) {
      openWalletModal();
      return;
    }
    
    try {
      const support = voteType === "for" ? 1 : voteType === "against" ? 0 : 2;
      
      // Get selected networks to vote on
      const selectedNetworks = AVAILABLE_NETWORKS.filter(
        (network) => network.id !== currentNetwork?.id
      );
      
      if (selectedNetworks.length === 0) {
        toast({
          title: "No Chains Selected",
          description: "Please select at least one chain to send your vote to",
          variant: "destructive"
        });
        return;
      }
      
      toast({
        title: "Sending Cross-Chain Votes",
        description: `Submitting votes to ${selectedNetworks.length} chains...`
      });
      
      // First, vote on the current chain
      await vote(proposalId, support, voteReason);
      
      // Then send votes to other chains via LayerZero
      for (const network of selectedNetworks) {
        try {
          // In real implementation, we would use the user's voting power
          // This is a simplified version
          await crossChainVote(proposalId, support, network.chainId, "1");
          
          toast({
            title: "Cross-Chain Vote Sent",
            description: `Vote sent to ${network.name}`
          });
        } catch (err: any) {
          toast({
            title: `Failed to Vote on ${network.name}`,
            description: err.message || "Error sending cross-chain vote",
            variant: "destructive"
          });
        }
      }
      
      // Refresh voting status
      checkVotingStatus();
      loadProposalDetails();
      
      // Reset form after successful submission
      setVoteReason("");
    } catch (err: any) {
      toast({
        title: "Error Submitting Votes",
        description: err.message || "Failed to submit cross-chain votes",
        variant: "destructive"
      });
    }
  };
  
  // If not connected, show connect wallet prompt
  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cross-Chain Voting</CardTitle>
          <CardDescription>
            Connect your wallet to vote on governance proposals across multiple chains
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            You need to connect your wallet to vote
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={openWalletModal}>Connect Wallet</Button>
        </CardFooter>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Proposal #{proposalId}</CardTitle>
              <CardDescription>
                {proposalDetails?.title || "Loading proposal details..."}
              </CardDescription>
            </div>
            <Badge variant={
              proposalDetails?.status === "Active" ? "default" :
              proposalDetails?.status === "Succeeded" ? "success" :
              proposalDetails?.status === "Defeated" ? "destructive" :
              "secondary"
            }>
              {proposalDetails?.status || "Unknown"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Aggregated Votes</h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">For</span>
                  <span className="text-sm">{forPercentage.toFixed(2)}% ({totalForVotes.toLocaleString()})</span>
                </div>
                <Progress value={forPercentage} className="h-2 bg-gray-200" indicatorClassName="bg-green-500" />
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Against</span>
                  <span className="text-sm">{againstPercentage.toFixed(2)}% ({totalAgainstVotes.toLocaleString()})</span>
                </div>
                <Progress value={againstPercentage} className="h-2 bg-gray-200" indicatorClassName="bg-red-500" />
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Abstain</span>
                  <span className="text-sm">{abstainPercentage.toFixed(2)}% ({totalAbstainVotes.toLocaleString()})</span>
                </div>
                <Progress value={abstainPercentage} className="h-2 bg-gray-200" indicatorClassName="bg-gray-500" />
              </div>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <h3 className="text-lg font-medium mb-4">Vote Across Chains</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {chainVotingStatus.map((status) => (
                <div 
                  key={status.chainId} 
                  className={`p-3 rounded-lg border ${status.hasVoted ? 'bg-gray-50 border-gray-300' : 'border-dashed border-gray-300'}`}
                >
                  <div className="text-sm font-medium">{status.chainName}</div>
                  <div className="text-xs text-gray-500">
                    {status.hasVoted ? (
                      <span className="text-green-600">Voted</span>
                    ) : (
                      <span>Not voted</span>
                    )}
                  </div>
                  <div className="text-xs mt-1">
                    Power: {parseInt(status.votingPower).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Cast Your Vote</CardTitle>
          <CardDescription>
            Vote on this proposal from multiple chains
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs value={votingTab} onValueChange={(value) => setVotingTab(value as "single" | "multi")}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="single">Single Chain Vote</TabsTrigger>
              <TabsTrigger value="multi">Multi-Chain Vote</TabsTrigger>
            </TabsList>
            
            <TabsContent value="single">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Chain</Label>
                  <Select 
                    value={selectedChain} 
                    onValueChange={setSelectedChain}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a chain" />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_NETWORKS.map((network) => (
                        <SelectItem key={network.id} value={network.id}>
                          {network.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Your Vote</Label>
                  <RadioGroup 
                    value={voteType} 
                    onValueChange={(value) => setVoteType(value as VoteType)}
                    className="grid grid-cols-3 gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="for" id="vote-single-for" />
                      <Label htmlFor="vote-single-for" className="cursor-pointer">For</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="against" id="vote-single-against" />
                      <Label htmlFor="vote-single-against" className="cursor-pointer">Against</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="abstain" id="vote-single-abstain" />
                      <Label htmlFor="vote-single-abstain" className="cursor-pointer">Abstain</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <div className="space-y-2">
                  <Label>Reason (Optional)</Label>
                  <Textarea 
                    placeholder="Why are you voting this way? (Optional)"
                    value={voteReason}
                    onChange={(e) => setVoteReason(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>
                
                <Button 
                  onClick={handleSingleChainVote} 
                  disabled={loading || !selectedChain}
                  className="w-full"
                >
                  {loading ? "Submitting..." : "Cast Vote"}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="multi">
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 text-sm">
                  <p className="font-medium text-blue-800 mb-1">Cross-Chain Voting</p>
                  <p className="text-blue-700">
                    Your vote will be applied on the current chain and propagated to all selected chains using LayerZero.
                    This ensures your voting power is counted across the entire protocol.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>Your Vote (All Chains)</Label>
                  <RadioGroup 
                    value={voteType} 
                    onValueChange={(value) => setVoteType(value as VoteType)}
                    className="grid grid-cols-3 gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="for" id="vote-multi-for" />
                      <Label htmlFor="vote-multi-for" className="cursor-pointer">For</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="against" id="vote-multi-against" />
                      <Label htmlFor="vote-multi-against" className="cursor-pointer">Against</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="abstain" id="vote-multi-abstain" />
                      <Label htmlFor="vote-multi-abstain" className="cursor-pointer">Abstain</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <div className="space-y-2">
                  <Label>Reason (Optional)</Label>
                  <Textarea 
                    placeholder="Why are you voting this way? (Optional)"
                    value={voteReason}
                    onChange={(e) => setVoteReason(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>
                
                <Button 
                  onClick={handleMultiChainVote} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? "Submitting..." : "Cast Votes Across All Chains"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}