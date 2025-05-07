import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowUpRight, RotateCw, ExternalLink, ArrowLeftRight, Layers } from 'lucide-react';
import { useWalletContext } from './WalletProvider';
import TransactionErrorHandler from './TransactionErrorHandler';
import { ErrorType } from './TransactionErrorHandler';
import { Spinner } from '@/components/ui/spinner';
import { formatDistanceToNow } from 'date-fns';
import { LayerZeroTransaction } from '@/types/transaction';

enum FilterStatus {
  ALL = 'all',
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export default function TransactionHistory() {
  const { isConnected, address } = useWalletContext();
  const [filter, setFilter] = useState<FilterStatus>(FilterStatus.ALL);
  const [transactions, setTransactions] = useState<LayerZeroTransaction[]>([]);
  
  // Fetch user transactions
  const { data, isLoading, error, refetch } = useQuery<LayerZeroTransaction[]>({ 
    queryKey: ['/api/layerzero/transactions', address],
    queryFn: () => apiRequest(`/api/layerzero/transactions?address=${address}`),
    enabled: !!address,
  });
  
  useEffect(() => {
    if (data) {
      // Apply filtering
      const filteredTxs = data.filter((tx) => {
        if (filter === FilterStatus.ALL) return true;
        if (filter === FilterStatus.PENDING) return tx.status === 'pending' || tx.status === 'source_confirmed';
        if (filter === FilterStatus.COMPLETED) return tx.status === 'completed';
        if (filter === FilterStatus.FAILED) return tx.status === 'failed';
        return true;
      });
      
      // Sort by created date, newest first
      const sortedTxs = [...filteredTxs].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      
      setTransactions(sortedTxs);
    }
  }, [data, filter]);
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Pending</Badge>;
      case 'source_confirmed':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">In Progress</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Completed</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">Failed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Get the icon for the transaction type
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'token_transfer':
        return <ArrowUpRight className="h-4 w-4 text-blue-500" />;
      case 'token_bridge':
        return <ArrowLeftRight className="h-4 w-4 text-purple-500" />;
      case 'cross_chain_message':
        return <LayerIcon className="h-4 w-4 text-green-500" />;
      default:
        return <ArrowUpRight className="h-4 w-4" />;
    }
  };
  
  // Get human-readable type label
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'token_transfer':
        return 'Token Transfer';
      case 'token_bridge':
        return 'Token Bridge';
      case 'cross_chain_message':
        return 'Cross-Chain Message';
      default:
        return type;
    }
  };
  
  // Format the time for display
  const formatTime = (timestamp: string | Date | null) => {
    if (!timestamp) return 'Unknown';
    
    try {
      const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return 'Invalid date';
    }
  };

  // If not connected, show a notice
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
            ) : transactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No transactions found
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx) => (
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