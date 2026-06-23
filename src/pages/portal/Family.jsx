import { useState } from "react";
import { useFamily } from "@/lib/FamilyContext";
import FamilyOverview from "@/components/family/FamilyOverview";
import CommunicationSettings from "@/components/family/CommunicationSettings";
import FamilyBilling from "@/components/family/FamilyBilling";
import DocumentHub from "@/components/family/DocumentHub";
import FamilyInvite from "@/components/family/FamilyInvite";
import { Users, Mail, CreditCard, FileText, UserPlus } from "lucide-react";

export default function Family() {
  const { isPrimaryGuardian, isGuardian } = useFamily();
  const [tab, setTab] = useState("overview");

  if (!isGuardian) {
    return (
      <div className="text-center py-20">
        <p className="text-[#A8A9AD]">Family management is available for guardians only.</p>
      </div>
    );
  }

  const tabs = isPrimaryGuardian
    ? [
        { id: "overview", label: "Overview", icon: Users },
        { id: "communications", label: "Communications", icon: Mail },
        { id: "billing", label: "Billing", icon: CreditCard },
        { id: "documents", label: "Documents", icon: FileText },
        { id: "invite", label: "Invite", icon: UserPlus },
      ]
    : [
        { id: "overview", label: "Overview", icon: Users },
        { id: "billing", label: "Billing", icon: CreditCard },
        { id: "documents", label: "Documents", icon: FileText },
      ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs tracking-widest uppercase text-[#C9A84C] mb-2">Family Account</p>
        <h1 className="text-3xl font-bold">Family Management</h1>
      </div>

      <div className="flex gap-1 border border-[#A8A9AD]/20 p-1 overflow-x-auto scrollbar-hide w-full sm:w-fit">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium tracking-wide whitespace-nowrap transition-colors ${
                tab === t.id ? "bg-[#C9A84C] text-black" : "text-[#A8A9AD] hover:text-white"
              }`}
            >
              <Icon size={16} /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === "overview" && <FamilyOverview onTabChange={setTab} />}
      {tab === "communications" && <CommunicationSettings />}
      {tab === "billing" && <FamilyBilling />}
      {tab === "documents" && <DocumentHub />}
      {tab === "invite" && <FamilyInvite />}
    </div>
  );
}