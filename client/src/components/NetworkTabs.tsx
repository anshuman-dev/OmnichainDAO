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
      <div className="flex space-x-1 border-b border-[#323232]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`uppercase-label py-3 px-4 ${
              activeTab === tab.id
                ? "border-b-2 border-[#F2F2F2] text-[#F2F2F2]"
                : "text-[#797575] hover:text-[#F2F2F2] transition-all"
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
