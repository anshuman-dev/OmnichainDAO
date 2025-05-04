import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NetworkTabs from "@/components/NetworkTabs";
import TokenOverview from "@/components/TokenOverview";
import TokenActions from "@/components/TokenActions";
import ContractDetails from "@/components/ContractDetails";
import NetworkStatus from "@/components/NetworkStatus";
import WalletConnectModal from "@/components/WalletConnectModal";
import { useWallet } from "@/hooks/useWallet";

export default function Home() {
  const { isConnected } = useWallet();
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  
  const openWalletModal = () => setIsWalletModalOpen(true);
  const closeWalletModal = () => setIsWalletModalOpen(false);
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        isConnected={isConnected} 
        openWalletModal={openWalletModal} 
      />
      
      <main className="container mx-auto px-4 py-8 flex-grow">
        <NetworkTabs />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <TokenOverview />
          <TokenActions openWalletModal={openWalletModal} />
        </div>
        
        <NetworkStatus />
      </main>
      
      <Footer />
      
      <WalletConnectModal 
        isOpen={isWalletModalOpen}
        onClose={closeWalletModal}
      />
    </div>
  );
}
