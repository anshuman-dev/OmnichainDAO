export type Tab = "overview" | "token-management" | "bridge" | "governance" | "proposals" | "voting";

interface NetworkTabsProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export default function NetworkTabs({ activeTab, onTabChange }: NetworkTabsProps) {
  
  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "token-management", label: "Token Management" },
    { id: "bridge", label: "Bridge" },
    { id: "governance", label: "Governance" },
    { id: "proposals", label: "Proposals" },
    { id: "voting", label: "Voting" }
  ];
  
  return (
    <div className="mb-8 overflow-x-auto">
      <div className="lz-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`lz-tab ${activeTab === tab.id ? "lz-tab-active" : ""}`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
