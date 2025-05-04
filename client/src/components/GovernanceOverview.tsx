import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useGovernance } from '@/hooks/useGovernance';
import { useWallet } from '@/hooks/useWallet';
import type { ProposalDetails } from '@/services/governance';

export default function GovernanceOverview() {
  const { toast } = useToast();
  const { isConnected, openWalletModal } = useWallet();
  const { getProposals, loading, error } = useGovernance();
  const [proposals, setProposals] = useState<ProposalDetails[]>([]);

  useEffect(() => {
    async function fetchProposals() {
      try {
        const result = await getProposals();
        setProposals(result);
      } catch (err) {
        console.error('Failed to fetch proposals:', err);
      }
    }

    fetchProposals();
  }, [getProposals]);

  // Function to calculate vote percentages for progress bars
  const calculatePercentages = (proposal: ProposalDetails) => {
    const forVotes = parseFloat(proposal.forVotes);
    const againstVotes = parseFloat(proposal.againstVotes);
    const abstainVotes = parseFloat(proposal.abstainVotes);
    const total = forVotes + againstVotes + abstainVotes;
    
    if (total === 0) return { forPercentage: 0, againstPercentage: 0, abstainPercentage: 0, total: 0 };
    
    return {
      forPercentage: (forVotes / total) * 100,
      againstPercentage: (againstVotes / total) * 100,
      abstainPercentage: (abstainVotes / total) * 100,
      total
    };
  };

  // Convert timestamp to human-readable date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Function to get appropriate badge color based on status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-500 hover:bg-green-600';
      case 'Pending':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'Succeeded':
        return 'bg-purple-500 hover:bg-purple-600';
      case 'Queued':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'Defeated':
      case 'Expired':
        return 'bg-red-500 hover:bg-red-600';
      case 'Executed':
        return 'bg-gray-500 hover:bg-gray-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  // Display loading state
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Governance</CardTitle>
          <CardDescription>Loading proposals...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-700"></div>
        </CardContent>
      </Card>
    );
  }

  // Display error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Governance</CardTitle>
          <CardDescription>Failed to load proposals</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline" 
            className="mt-4"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  // If not connected, show connect wallet prompt
  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cross-Chain Governance</CardTitle>
          <CardDescription>
            Propose, vote, and execute decisions across multiple blockchains
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            Connect your wallet to view and participate in governance
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={openWalletModal}>Connect Wallet</Button>
        </CardFooter>
      </Card>
    );
  }

  // No proposals found
  if (proposals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cross-Chain Governance</CardTitle>
          <CardDescription>No active proposals</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            There are currently no governance proposals to display
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={() => toast({ title: "Create Proposal", description: "Coming soon!" })}>
            Create Proposal
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cross-Chain Governance</CardTitle>
        <CardDescription>
          Propose, vote, and execute decisions across multiple blockchains
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {proposals.map((proposal) => {
          const { forPercentage, againstPercentage, abstainPercentage, total } = calculatePercentages(proposal);
          const quorumPercentage = (total / parseFloat(proposal.quorum)) * 100;
          
          return (
            <div key={proposal.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium">{proposal.description}</h3>
                  <p className="text-sm text-muted-foreground">ID: {proposal.id}</p>
                </div>
                <Badge className={getStatusColor(proposal.status)}>
                  {proposal.status}
                </Badge>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>For</span>
                  <span>{proposal.forVotes} votes ({forPercentage.toFixed(2)}%)</span>
                </div>
                <Progress value={forPercentage} className="h-2 bg-gray-200" indicatorColor="bg-green-500" />
                
                <div className="flex justify-between text-sm mt-2">
                  <span>Against</span>
                  <span>{proposal.againstVotes} votes ({againstPercentage.toFixed(2)}%)</span>
                </div>
                <Progress value={againstPercentage} className="h-2 bg-gray-200" indicatorColor="bg-red-500" />
                
                <div className="flex justify-between text-sm mt-2">
                  <span>Abstain</span>
                  <span>{proposal.abstainVotes} votes ({abstainPercentage.toFixed(2)}%)</span>
                </div>
                <Progress value={abstainPercentage} className="h-2 bg-gray-200" indicatorColor="bg-gray-500" />
              </div>
              
              <Separator className="my-2" />
              
              <div className="flex justify-between text-sm">
                <span>Quorum: {quorumPercentage.toFixed(2)}% reached</span>
                <span>{proposal.quorum} votes required</span>
              </div>
              <Progress 
                value={Math.min(quorumPercentage, 100)} 
                className="h-2 bg-gray-200" 
                indicatorColor="bg-blue-500" 
              />
              
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>Deadline: {formatDate(proposal.deadline)}</span>
                <span>Proposer: {proposal.proposer.slice(0, 6)}...{proposal.proposer.slice(-4)}</span>
              </div>
              
              <div className="flex gap-2 mt-2">
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => toast({ title: "Vote", description: "Voting coming soon!" })}
                >
                  Vote
                </Button>
                {proposal.status === "Succeeded" && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => toast({ title: "Execute", description: "Execution coming soon!" })}
                  >
                    Execute
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => toast({ title: "Details", description: "View details coming soon!" })}
                >
                  View Details
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => toast({ title: "Refresh", description: "Refreshing proposals..." })}>
          Refresh Proposals
        </Button>
        <Button onClick={() => toast({ title: "Create Proposal", description: "Coming soon!" })}>
          Create Proposal
        </Button>
      </CardFooter>
    </Card>
  );
}