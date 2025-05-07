import React, { useEffect, useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { ArrowRight, ExternalLink, RotateCw, CheckCircle, XCircle, Clock, Activity } from "lucide-react";
import { LayerZeroTransaction, TransactionStatus } from "@/types/transaction";
import { useWalletContext } from './WalletProvider';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ErrorType } from '@/types/error';

interface TransactionHistoryProps {
  limit?: number;
  showTitle?: boolean;
  className?: string;
}

export default function TransactionHistory({ 
  limit = 5, 
  showTitle = true,
  className
}: TransactionHistoryProps) {
  const { address, isConnected } = useWalletContext();
  const queryClient = useQueryClient();
  const [filteredStatus, setFilteredStatus] = useState<string | null>(null);
  
  // Query transactions
  const { 
    data: transactions, 
    isLoading, 
    error,
    refetch
  } = useQuery<LayerZeroTransaction[]>({
    queryKey: ['/api/transactions', address, filteredStatus],
    queryFn: async () => {
      let url = '/api/transactions';
      const params = new URLSearchParams();
      
      if (address) {
        params.append('walletAddress', address);
      }
      
      if (filteredStatus) {
        params.append('status', filteredStatus);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      return response.json();
    },
    enabled: isConnected,
    refetchInterval: 10000, // Refetch every 10 seconds
  });
  
  // Function to display a friendly status badge
  const getStatusBadge = (status: TransactionStatus) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="flex items-center gap-1">
          <Clock className="h-3 w-3" /> Pending
        </Badge>;
      case 'source_confirmed':
        return <Badge variant="secondary" className="flex items-center gap-1">
          <Activity className="h-3 w-3" /> In Progress
        </Badge>;
      case 'destination_confirmed':
        return <Badge variant="secondary" className="flex items-center gap-1">
          <Activity className="h-3 w-3" /> Almost Done
        </Badge>;
      case 'completed':
        return <Badge variant="secondary" className="flex items-center gap-1 bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3" /> Completed
        </Badge>;
      case 'failed':
        return <Badge variant="destructive" className="flex items-center gap-1">
          <XCircle className="h-3 w-3" /> Failed
        </Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Function to get a formatted short address
  const formatShortAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };
  
  // Function to retry a failed transaction
  const retryTransaction = async (id: number) => {
    try {
      const response = await fetch(`/api/transactions/${id}/retry`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to retry transaction');
      }
      
      // Invalidate the transaction list to refresh
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
    } catch (error) {
      console.error('Error retrying transaction:', error);
    }
  };
  
  if (isLoading) {
    return (
      <Card className={className}>
        {showTitle && (
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>Recent cross-chain transactions</CardDescription>
          </CardHeader>
        )}
        <CardContent className="flex justify-center py-8">
          <Spinner size="lg" />
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className={className}>
        {showTitle && (
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>Recent cross-chain transactions</CardDescription>
          </CardHeader>
        )}
        <CardContent>
          <div className="bg-red-50 p-4 rounded-md text-red-700">
            <p className="font-medium">Failed to load transactions</p>
            <p className="text-sm mt-1">{error.message}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="mt-2"
            >
              <RotateCw className="h-4 w-4 mr-1" /> Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!transactions || transactions.length === 0) {
    return (
      <Card className={className}>
        {showTitle && (
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>Recent cross-chain transactions</CardDescription>
          </CardHeader>
        )}
        <CardContent>
          <div className="text-center p-6 text-gray-500">
            <p>No transactions found</p>
            {address && (
              <p className="text-sm mt-1">
                Start a cross-chain transaction to see it here
              </p>
            )}
            {!address && (
              <p className="text-sm mt-1">
                Connect your wallet to view your transactions
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={className}>
      {showTitle && (
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Recent cross-chain transactions</CardDescription>
        </CardHeader>
      )}
      <CardContent>
        <div className="mb-4 flex flex-wrap gap-2">
          <Button 
            variant={filteredStatus === null ? "default" : "outline"} 
            size="sm"
            onClick={() => setFilteredStatus(null)}
          >
            All
          </Button>
          <Button 
            variant={filteredStatus === 'pending' ? "default" : "outline"} 
            size="sm"
            onClick={() => setFilteredStatus('pending')}
          >
            Pending
          </Button>
          <Button 
            variant={filteredStatus === 'completed' ? "default" : "outline"} 
            size="sm"
            onClick={() => setFilteredStatus('completed')}
          >
            Completed
          </Button>
          <Button 
            variant={filteredStatus === 'failed' ? "default" : "outline"} 
            size="sm"
            onClick={() => setFilteredStatus('failed')}
          >
            Failed
          </Button>
        </div>
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>From → To</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.slice(0, limit).map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="font-medium">
                    {tx.type === 'token_bridge' ? 'Bridge' : 
                     tx.type === 'token_transfer' ? 'Transfer' : 
                     tx.type === 'proposal_creation' ? 'Proposal' :
                     tx.type === 'vote' ? 'Vote' :
                     tx.type === 'execution' ? 'Execute' : 
                     tx.type}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <span>{tx.sourceChain}</span>
                      {tx.destinationChain && (
                        <>
                          <ArrowRight className="mx-1 h-4 w-4 text-gray-400" />
                          <span>{tx.destinationChain}</span>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(tx.status as TransactionStatus)}</TableCell>
                  <TableCell>{tx.createdAt ? new Date(tx.createdAt).toLocaleString() : '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {tx.sourceTxHash && (
                        <Button variant="ghost" size="icon" asChild>
                          <a 
                            href={`https://sepolia.etherscan.io/tx/${tx.sourceTxHash}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            title="View on Explorer"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      
                      {tx.status === 'failed' && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => retryTransaction(tx.id)}
                          title="Retry Transaction"
                        >
                          <RotateCw className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {transactions.length > limit && (
          <div className="mt-4 flex justify-center">
            <Button variant="outline" size="sm">
              View All Transactions
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}