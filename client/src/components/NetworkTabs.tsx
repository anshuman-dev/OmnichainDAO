import { useState } from "react";

type Tab = "overview" | "token-management" | "bridge" | "proposals" | "voting";

export default function NetworkTabs() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  
  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "token-management", label: "Token Management" },
    { id: "bridge", label: "Bridge" },
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
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
