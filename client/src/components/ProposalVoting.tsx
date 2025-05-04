import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"; 
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label"; 
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useGovernance } from "@/hooks/useGovernance";
import { useWallet } from "@/hooks/useWallet";

interface ProposalVotingProps {
  proposalId: string;
  proposalTitle: string;
  proposalDescription: string;
}

type VoteType = "for" | "against" | "abstain";

export default function ProposalVoting({ proposalId, proposalTitle, proposalDescription }: ProposalVotingProps) {
  const { toast } = useToast();
  const { vote: castVote, loading, error } = useGovernance();
  const { isConnected, openWalletModal } = useWallet();
  
  const [voteType, setVoteType] = useState<VoteType>("for");
  const [voteReason, setVoteReason] = useState("");
  
  const handleVoteSubmit = async () => {
    if (!isConnected) {
      openWalletModal();
      return;
    }
    
    try {
      const support = voteType === "for" ? 1 : voteType === "against" ? 0 : 2;
      
      // Call the governance hook to cast the vote
      await castVote(proposalId, support, voteReason);
      
      toast({
        title: "Vote Submitted",
        description: `Your ${voteType} vote has been cast successfully`
      });
      
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
  
  // If not connected, show connect wallet prompt
  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vote on Proposal</CardTitle>
          <CardDescription>
            Connect your wallet to vote on this governance proposal
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            You need to connect your wallet to vote on proposals
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={openWalletModal}>Connect Wallet</Button>
        </CardFooter>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Vote on Proposal #{proposalId}</CardTitle>
        <CardDescription>
          Cast your vote on: {proposalTitle}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-medium">Your Vote</p>
          <RadioGroup 
            value={voteType} 
            onValueChange={(value) => setVoteType(value as VoteType)}
            className="grid grid-cols-3 gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="for" id="vote-for" />
              <Label htmlFor="vote-for" className="cursor-pointer">For</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="against" id="vote-against" />
              <Label htmlFor="vote-against" className="cursor-pointer">Against</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="abstain" id="vote-abstain" />
              <Label htmlFor="vote-abstain" className="cursor-pointer">Abstain</Label>
            </div>
          </RadioGroup>
        </div>
        
        <div className="space-y-2">
          <p className="text-sm font-medium">Reason (Optional)</p>
          <Textarea 
            placeholder="Why are you voting this way? (Optional)"
            value={voteReason}
            onChange={(e) => setVoteReason(e.target.value)}
            className="min-h-[80px]"
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button 
          onClick={handleVoteSubmit} 
          disabled={loading}
        >
          {loading ? "Submitting..." : "Cast Vote"}
        </Button>
      </CardFooter>
    </Card>
  );
}