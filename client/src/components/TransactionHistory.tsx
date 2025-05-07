import React, { useState } from 'react';
import { 
  Card, CardContent, CardHeader, CardTitle, CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Tabs, TabsContent, TabsList, TabsTrigger 
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { Layers, ArrowUpRight, ExternalLink, RotateCw } from 'lucide-react';
import TransactionErrorHandler, { ErrorType } from './TransactionErrorHandler';
import { Spinner } from '@/components/ui/spinner';
import { useWallet } from '@/hooks/useWallet';
import { LayerZeroTransaction, FilterStatus } from '@/types/transaction';

interface TransactionHistoryProps {
  limit?: number;
}

export default function TransactionHistory({ limit = 5 }: TransactionHistoryProps) {
  const { address, isConnected } = useWallet();
  const [filter, setFilter] = useState<FilterStatus>(FilterStatus.ALL);
  
  const {
    data: transactions = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['layerzero', 'transactions', address],
    queryFn: async (): Promise<LayerZeroTransaction[]> => {
      if (!address) return [];
      
      const response = await fetch(`/api/layerzero/transactions/${address}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch transactions');
      }
      
      const data = await response.json();
      return data;
    },
    enabled: !!address
  });
  
  const filteredTransactions = transactions
    .filter(tx => {
      if (filter === FilterStatus.ALL) return true;
      if (filter === FilterStatus.PENDING) return tx.status === 'pending' || tx.status === 'source_confirmed' || tx.status === 'destination_confirmed';
      if (filter === FilterStatus.COMPLETED) return tx.status === 'completed';
      if (filter === FilterStatus.FAILED) return tx.status === 'failed';
      return true;
    })
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, limit);
  
  const formatTime = (date: Date | null) => {
    if (!date) return 'Unknown';
    
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    
    // Less than a minute
    if (diff < 60000) {
      return 'Just now';
    }
    
    // Less than an hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    }
    
    // Less than a day
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    
    // Format as date
    return new Date(date).toLocaleDateString();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-900/20 text-yellow-500">Pending</Badge>;
      case 'source_confirmed':
        return <Badge variant="outline" className="bg-blue-900/20 text-blue-500">Source Confirmed</Badge>;
      case 'destination_confirmed':
        return <Badge variant="outline" className="bg-purple-900/20 text-purple-500">Destination Confirmed</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-900/20 text-green-500">Completed</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-900/20 text-red-500">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'token_transfer':
        return 'Token Transfer';
      case 'token_bridge':
        return 'Token Bridge';
      case 'cross_chain_message':
        return 'Cross-Chain Message';
      case 'proposal_creation':
        return 'Proposal Creation';
      case 'vote':
        return 'Vote Cast';
      case 'execution':
        return 'Proposal Execution';
      default:
        return type;
    }
  };
  
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'token_transfer':
        return <ArrowUpRight className="h-4 w-4 text-blue-500" />;
      case 'token_bridge':
        return <Layers className="h-4 w-4 text-purple-500" />;
      case 'cross_chain_message':
        return <ArrowUpRight className="h-4 w-4 text-green-500" />;
      case 'proposal_creation':
        return <ArrowUpRight className="h-4 w-4 text-yellow-500" />;
      case 'vote':
        return <ArrowUpRight className="h-4 w-4 text-orange-500" />;
      case 'execution':
        return <ArrowUpRight className="h-4 w-4 text-red-500" />;
      default:
        return <ArrowUpRight className="h-4 w-4" />;
    }
  };
  
  if (!isConnected) {
    return (
      <Card className="w-full border-dashed border-2 border-gray-700">
        <CardContent className="pt-6 flex flex-col items-center justify-center h-40">
          <Layers className="h-10 w-10 text-gray-500 mb-4" />
          <div className="text-center text-gray-500">
            Connect your wallet to view transaction history
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Transaction History</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => refetch()} title="Refresh">
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>Recent LayerZero transactions</CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue={filter} className="w-full" onValueChange={(value) => setFilter(value as FilterStatus)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value={FilterStatus.ALL}>All</TabsTrigger>
            <TabsTrigger value={FilterStatus.PENDING}>Pending</TabsTrigger>
            <TabsTrigger value={FilterStatus.COMPLETED}>Completed</TabsTrigger>
            <TabsTrigger value={FilterStatus.FAILED}>Failed</TabsTrigger>
          </TabsList>
          
          <div className="mt-4">
            {error && (
              <TransactionErrorHandler 
                error={error as Error} 
                errorType={ErrorType.UNKNOWN} 
                onClear={() => refetch()}
              />
            )}
            
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Spinner className="mr-2" />
                <span>Loading transactions...</span>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No transactions found
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTransactions.map((tx) => (
                  <div key={tx.id} className="border rounded-lg p-3 flex flex-col">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center">
                        <div className="mr-2 p-2 bg-gray-800 rounded-md">
                          {getTransactionIcon(tx.type)}
                        </div>
                        <div>
                          <div className="font-medium">{getTypeLabel(tx.type)}</div>
                          <div className="text-xs text-gray-500">
                            {formatTime(tx.createdAt)}
                          </div>
                        </div>
                      </div>
                      <div>
                        {getStatusBadge(tx.status)}
                      </div>
                    </div>
                    
                    <div className="mt-2 text-sm text-gray-400 flex items-center">
                      <span className="font-mono">
                        {tx.sourceTxHash.substring(0, 6)}...{tx.sourceTxHash.substring(tx.sourceTxHash.length - 4)}
                      </span>
                      <a 
                        href={`https://layerzeroscan.com/tx/${tx.sourceTxHash}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="ml-1 inline-flex items-center text-blue-500 hover:text-blue-700"
                      >
                        <ExternalLink size={12} />
                      </a>
                    </div>
                    
                    {tx.destinationChain && (
                      <div className="mt-1 flex items-center text-xs text-gray-500">
                        <div className="font-medium">{tx.sourceChain}</div>
                        <ArrowUpRight size={12} className="mx-1" />
                        <div className="font-medium">{tx.destinationChain}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}