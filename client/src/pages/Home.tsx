import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NetworkTabs, { Tab } from "@/components/NetworkTabs";
import TokenOverview from "@/components/TokenOverview";
import TokenActions from "@/components/TokenActions";
import ContractDetails from "@/components/ContractDetails";
import NetworkStatus from "@/components/NetworkStatus";
import GovernanceOverview from "@/components/GovernanceOverview";
import ProposalForm from "@/components/ProposalForm";
import CrossChainProposal from "@/components/CrossChainProposal";
import ProposalVoting from "@/components/ProposalVoting";
import CrossChainVoting from "@/components/CrossChainVoting";
import VoteAggregation from "@/components/VoteAggregation";
import ExecutionLayer from "@/components/ExecutionLayer";
import WalletConnectModal from "@/components/WalletConnectModal";
import { useWallet } from "@/hooks/useWallet";

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
          <div className="mt-4 space-y-6">
            <GovernanceOverview />
            <VoteAggregation />
            <ExecutionLayer proposalId="1" proposalTitle="Protocol Fee Adjustment" />
          </div>
        )}
        
        {activeTab === "proposals" && (
          <div className="mt-4 space-y-6">
            <CrossChainProposal />
            <ProposalForm />
          </div>
        )}
        
        {activeTab === "voting" && (
          <div className="mt-4 space-y-6">
            <CrossChainVoting />
            <ProposalVoting 
              proposalId="1"
              proposalTitle="Protocol Fee Adjustment"
              proposalDescription="Adjust the protocol fee from 0.1% to 0.05% to remain competitive with other cross-chain solutions."
            />
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
