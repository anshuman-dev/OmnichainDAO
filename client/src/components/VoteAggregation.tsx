import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useGovernance } from "@/hooks/useGovernance";
import { useWallet } from "@/hooks/useWallet";
import { useNetwork } from "@/hooks/useNetwork";
import { AVAILABLE_NETWORKS } from "@/lib/constants";

interface ChainVotes {
  chainId: string;
  chainName: string;
  forVotes: string;
  againstVotes: string;
  abstainVotes: string;
  totalVotes: string;
  percentage: number;
}

interface AggregatedVotes {
  forVotes: number;
  againstVotes: number;
  abstainVotes: number;
  totalVotes: number;
}

export default function VoteAggregation() {
  const { toast } = useToast();
  const { getProposal, loading, error } = useGovernance();
  const { isConnected, openWalletModal } = useWallet();
  const { currentNetwork } = useNetwork();
  
  const [proposalId, setProposalId] = useState("1"); // Default proposal ID
  const [proposalDetails, setProposalDetails] = useState<any>(null);
  const [chainVotes, setChainVotes] = useState<ChainVotes[]>([]);
  const [aggregatedVotes, setAggregatedVotes] = useState<AggregatedVotes>({
    forVotes: 0,
    againstVotes: 0,
    abstainVotes: 0,
    totalVotes: 0
  });
  
  // Load proposal details and vote data
  useEffect(() => {
    if (isConnected && proposalId) {
      loadProposalDetails();
      loadChainVotes();
    }
  }, [isConnected, proposalId, currentNetwork]);
  
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
  
  // Load vote data from all chains
  const loadChainVotes = async () => {
    // In a real implementation, we would use a contract to fetch vote data from all chains
    // This is a mock version for demo purposes
    const mockVotes: ChainVotes[] = AVAILABLE_NETWORKS.map(network => {
      // Generate realistic but random vote numbers
      const forVotes = Math.floor(Math.random() * 50000) + 10000;
      const againstVotes = Math.floor(Math.random() * 30000) + 5000;
      const abstainVotes = Math.floor(Math.random() * 10000) + 1000;
      const totalVotes = forVotes + againstVotes + abstainVotes;
      
      return {
        chainId: network.id,
        chainName: network.name,
        forVotes: forVotes.toString(),
        againstVotes: againstVotes.toString(),
        abstainVotes: abstainVotes.toString(),
        totalVotes: totalVotes.toString(),
        percentage: (totalVotes / 500000) * 100 // Scale for visual representation
      };
    });
    
    setChainVotes(mockVotes);
    
    // Calculate aggregated vote totals
    const aggregate = mockVotes.reduce((acc, chain) => {
      acc.forVotes += parseInt(chain.forVotes);
      acc.againstVotes += parseInt(chain.againstVotes);
      acc.abstainVotes += parseInt(chain.abstainVotes);
      acc.totalVotes += parseInt(chain.totalVotes);
      return acc;
    }, {
      forVotes: 0,
      againstVotes: 0,
      abstainVotes: 0,
      totalVotes: 0
    });
    
    setAggregatedVotes(aggregate);
  };
  
  // Force a refresh of vote data
  const refreshVoteData = () => {
    toast({
      title: "Refreshing Vote Data",
      description: "Fetching latest vote data from all chains..."
    });
    
    loadChainVotes();
    
    toast({
      title: "Vote Data Updated",
      description: "The latest vote data has been aggregated from all chains"
    });
  };
  
  // Calculate percentages for aggregated votes
  const forPercentage = aggregatedVotes.totalVotes > 0 
    ? (aggregatedVotes.forVotes / aggregatedVotes.totalVotes) * 100 
    : 0;
  
  const againstPercentage = aggregatedVotes.totalVotes > 0 
    ? (aggregatedVotes.againstVotes / aggregatedVotes.totalVotes) * 100 
    : 0;
  
  const abstainPercentage = aggregatedVotes.totalVotes > 0 
    ? (aggregatedVotes.abstainVotes / aggregatedVotes.totalVotes) * 100 
    : 0;
  
  // Determine if the proposal is passing
  const isPassing = forPercentage > againstPercentage;
  
  // If not connected, show connect wallet prompt
  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vote Aggregation</CardTitle>
          <CardDescription>
            Connect your wallet to view cross-chain vote aggregation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            You need to connect your wallet to view proposal vote data
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
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Cross-Chain Vote Aggregation</CardTitle>
              <CardDescription>
                Live tally of votes from all connected chains for Proposal #{proposalId}
              </CardDescription>
            </div>
            <Select 
              value={proposalId} 
              onValueChange={setProposalId}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select proposal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Proposal #1</SelectItem>
                <SelectItem value="2">Proposal #2</SelectItem>
                <SelectItem value="3">Proposal #3</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Aggregated Results</h3>
            <Badge variant={isPassing ? "success" : "destructive"}>
              {isPassing ? "Passing" : "Failing"}
            </Badge>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">For</span>
                <span className="text-sm">{forPercentage.toFixed(2)}% ({aggregatedVotes.forVotes.toLocaleString()})</span>
              </div>
              <Progress value={forPercentage} className="h-2 bg-gray-200" />
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Against</span>
                <span className="text-sm">{againstPercentage.toFixed(2)}% ({aggregatedVotes.againstVotes.toLocaleString()})</span>
              </div>
              <Progress value={againstPercentage} className="h-2 bg-gray-200" />
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Abstain</span>
                <span className="text-sm">{abstainPercentage.toFixed(2)}% ({aggregatedVotes.abstainVotes.toLocaleString()})</span>
              </div>
              <Progress value={abstainPercentage} className="h-2 bg-gray-200" />
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Chain Distribution</h3>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshVoteData}
              disabled={loading}
            >
              {loading ? "Refreshing..." : "Refresh Data"}
            </Button>
          </div>
          
          <div className="space-y-3">
            {chainVotes.map((chain) => (
              <div key={chain.chainId} className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{chain.chainName}</span>
                  <span className="text-sm">{parseInt(chain.totalVotes).toLocaleString()} votes</span>
                </div>
                <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden flex">
                  <div 
                    className="h-full bg-green-500" 
                    style={{ width: `${parseInt(chain.forVotes) / parseInt(chain.totalVotes) * 100}%` }}
                  />
                  <div 
                    className="h-full bg-red-500" 
                    style={{ width: `${parseInt(chain.againstVotes) / parseInt(chain.totalVotes) * 100}%` }}
                  />
                  <div 
                    className="h-full bg-gray-400" 
                    style={{ width: `${parseInt(chain.abstainVotes) / parseInt(chain.totalVotes) * 100}%` }}
                  />
                </div>
                <div className="flex text-xs text-gray-500 justify-between mt-0.5">
                  <span>For: {parseInt(chain.forVotes).toLocaleString()}</span>
                  <span>Against: {parseInt(chain.againstVotes).toLocaleString()}</span>
                  <span>Abstain: {parseInt(chain.abstainVotes).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-800 mb-1">How Vote Aggregation Works</h4>
            <p className="text-sm text-blue-700">
              OmniGovern DAO's cross-chain governance uses LayerZero messaging to aggregate votes from all chains.
              This ensures consistent decision-making across the entire protocol ecosystem regardless of token 
              distribution across chains.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}