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