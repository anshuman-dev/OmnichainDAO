import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useWalletContext } from './WalletProvider';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { formatDistanceToNow } from 'date-fns';
import { LayerZeroTransaction } from '@shared/schema';

type TransactionStatusType = 'all' | 'pending' | 'in_progress' | 'completed' | 'failed';

export default function TransactionHistory() {
  const { address, isConnected } = useWalletContext();
  const [filter, setFilter] = useState<TransactionStatusType>('all');

  // Query for LayerZero transactions
  const { data: lzTransactions, isLoading: isLoadingLzTx, error: lzTxError } = useQuery({
    queryKey: ['/api/layerzero/transactions', address],
    queryFn: () => apiRequest<LayerZeroTransaction[]>(`/api/layerzero/transactions/${address}`),
    enabled: !!address && isConnected,
    refetchInterval: 10000, // Refetch every 10 seconds to see updates
  });

  // Filter transactions by status
  const filteredTransactions = lzTransactions?.filter(tx => 
    filter === 'all' || tx.status === filter
  ) || [];

  // Generate status badge with appropriate color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Format the transaction type for display
  const formatTransactionType = (type: string) => {
    switch (type) {
      case 'token_bridge':
        return 'Token Bridge';
      case 'proposal_creation':
        return 'Create Proposal';
      case 'vote':
        return 'Vote';
      case 'execution':
        return 'Execute Proposal';
      default:
        return type;
    }
  };

  // Format date for display
  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return formatDistanceToNow(date, { addSuffix: true });
  };

  if (isLoadingLzTx) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Your recent LayerZero cross-chain operations</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-40">
          <Spinner size="lg" />
        </CardContent>
      </Card>
    );
  }

  if (lzTxError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Your recent LayerZero cross-chain operations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 p-4 rounded-md">
            <p className="text-red-800">Error loading transactions. Please try again later.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Your recent LayerZero cross-chain operations</CardDescription>
        </div>
        <Select
          value={filter}
          onValueChange={(value) => setFilter(value as TransactionStatusType)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Transactions</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            {isConnected 
              ? 'No transactions found. Start by creating a proposal or bridging tokens.'
              : 'Connect your wallet to view transaction history.'}
          </div>
        ) : (
          <Table>
            <TableCaption>A list of your recent LayerZero transactions</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="font-medium">{formatTransactionType(tx.type)}</TableCell>
                  <TableCell>{tx.sourceChain}</TableCell>
                  <TableCell>{tx.destinationChain || '—'}</TableCell>
                  <TableCell>{getStatusBadge(tx.status)}</TableCell>
                  <TableCell>{formatDate(tx.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}