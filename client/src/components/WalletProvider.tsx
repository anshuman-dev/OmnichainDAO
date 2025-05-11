import { createContext, useContext, ReactNode } from 'react';
import { useWallet } from '@/hooks/useWallet';
import WalletConnectModal from '@/components/WalletConnectModal';

// Create a wallet context
export const WalletContext = createContext<ReturnType<typeof useWallet> | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

export default function WalletProvider({ children }: WalletProviderProps) {
  const wallet = useWallet();

  useEffect(() => {
    // Check connection status on mount and when window.ethereum changes
    const checkConnection = async () => {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts && accounts.length > 0) {
          wallet.connectWallet('metamask');
        }
      }
    };

    checkConnection();
    
    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          wallet.disconnectWallet();
        } else {
          wallet.connectWallet('metamask');
        }
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', () => {});
      }
    };
  }, []);
  
  return (
    <WalletContext.Provider value={wallet}>
      {children}
      <WalletConnectModal 
        isOpen={wallet.showWalletModal} 
        onClose={wallet.closeWalletModal} 
        onConnect={wallet.connectWallet}
      />
    </WalletContext.Provider>
  );
}

// Custom hook to use the wallet context
export function useWalletContext() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWalletContext must be used within a WalletProvider');
  }
  return context;
}