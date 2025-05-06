import { Button } from "@/components/ui/button";
import { Network } from "@/types/token";
import { useToast } from "@/hooks/use-toast";
import { AVAILABLE_NETWORKS } from "@/lib/constants";

interface NetworkAddButtonProps {
  networkId?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  showLabel?: boolean;
}

export default function NetworkAddButton({ 
  networkId, 
  variant = "outline", 
  size = "default",
  showLabel = true
}: NetworkAddButtonProps) {
  const { toast } = useToast();
  
  // If no network ID is provided, we'll create a dropdown menu
  // For now, we'll keep it simple and just add the first network
  const network = networkId 
    ? AVAILABLE_NETWORKS.find(n => n.id === networkId) 
    : AVAILABLE_NETWORKS[0];
  
  if (!network) {
    return null;
  }
  
  // Function to add network to MetaMask
  const addNetworkToWallet = async () => {
    try {
      if (!window.ethereum) {
        toast({
          title: "Wallet Not Found",
          description: "Please install MetaMask or another compatible wallet to add networks.",
          variant: "destructive",
        });
        return;
      }
      
      // Add the network to wallet
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: `0x${network.chainId.toString(16)}`,
            chainName: network.name,
            nativeCurrency: {
              name: network.id === 'sepolia' ? 'Sepolia Ether' : 'Amoy MATIC',
              symbol: network.id === 'sepolia' ? 'ETH' : 'MATIC',
              decimals: 18,
            },
            rpcUrls: [
              network.id === 'sepolia' 
                ? 'https://rpc.sepolia.org' 
                : 'https://rpc-amoy.polygon.technology'
            ],
            blockExplorerUrls: [
              network.id === 'sepolia'
                ? 'https://sepolia.etherscan.io/'
                : 'https://www.oklink.com/amoy'
            ],
          },
        ],
      });
      
      toast({
        title: "Network Added",
        description: `${network.name} has been added to your wallet.`,
      });
      
      // Switch to the network
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${network.chainId.toString(16)}` }],
      });
      
    } catch (error: any) {
      console.error('Error adding network to wallet:', error);
      toast({
        title: "Failed to Add Network",
        description: error.message || "Failed to add network to wallet. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Button 
      variant={variant} 
      size={size} 
      onClick={addNetworkToWallet}
      className="flex items-center gap-2"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M8 4V12M4 8H12"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {showLabel && `Add ${network.name}`}
    </Button>
  );
}