import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NetworkTabs from "@/components/NetworkTabs";
import TokenOverview from "@/components/TokenOverview";
import TokenActions from "@/components/TokenActions";
import ContractDetails from "@/components/ContractDetails";
import NetworkStatus from "@/components/NetworkStatus";
import GovernanceOverview from "@/components/GovernanceOverview";
import WalletConnectModal from "@/components/WalletConnectModal";
import { useWallet } from "@/hooks/useWallet";

type Tab = "overview" | "token-management" | "bridge" | "governance" | "proposals" | "voting";

export default function Home() {
  const { 
    isConnected, 
    connectWallet, 
    showWalletModal,
    openWalletModal, 
    closeWalletModal 
  } = useWallet();
  
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        isConnected={isConnected} 
        openWalletModal={openWalletModal} 
      />
      
      <main className="container mx-auto px-4 py-8 flex-grow">
        <NetworkTabs 
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <TokenOverview />
            <TokenActions openWalletModal={openWalletModal} />
          </div>
        )}
        
        {activeTab === "governance" && (
          <div className="mt-4">
            <GovernanceOverview />
          </div>
        )}
        
        <div className="mt-8">
          <NetworkStatus />
        </div>
      </main>
      
      <Footer />
      
      <WalletConnectModal 
        isOpen={showWalletModal}
        onClose={closeWalletModal}
        onConnect={connectWallet}
      />
    </div>
  );
}
