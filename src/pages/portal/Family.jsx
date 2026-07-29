import { useState } from "react";
import { useFamily } from "@/lib/FamilyContext";
import FamilyOverview from "@/components/family/FamilyOverview";
import FamilyCalendar from "@/components/family/FamilyCalendar";
import MilestonesTimeline from "@/components/family/MilestonesTimeline";
import FamilyCheckInCards from "@/components/family/FamilyCheckInCards";
import InstructorNotesFeed from "@/components/family/InstructorNotesFeed";
import FamilyGoals from "@/components/family/FamilyGoals";
import CommunicationSettings from "@/components/family/CommunicationSettings";
import FamilyBilling from "@/components/family/FamilyBilling";
import DocumentHub from "@/components/family/DocumentHub";
import FamilyInvite from "@/components/family/FamilyInvite";
import AccessControls from "@/components/family/AccessControls";
import { Users, Calendar, Award, QrCode, MessageSquare, Target, Mail, CreditCard, FileText, UserPlus, Shield } from "lucide-react";

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
        { id: "schedule", label: "Schedule", icon: Calendar },
        { id: "milestones", label: "Milestones", icon: Award },
        { id: "checkin", label: "Check-In", icon: QrCode },
        { id: "notes", label: "Instructor Notes", icon: MessageSquare },
        { id: "goals", label: "Goals", icon: Target },
        { id: "access", label: "Access Controls", icon: Shield },
        { id: "communications", label: "Communications", icon: Mail },
        { id: "billing", label: "Billing", icon: CreditCard },
        { id: "documents", label: "Documents", icon: FileText },
        { id: "invite", label: "Invite", icon: UserPlus },
      ]
    : [
        { id: "overview", label: "Overview", icon: Users },
        { id: "schedule", label: "Schedule", icon: Calendar },
        { id: "milestones", label: "Milestones", icon: Award },
        { id: "checkin", label: "Check-In", icon: QrCode },
        { id: "notes", label: "Instructor Notes", icon: MessageSquare },
        { id: "goals", label: "Goals", icon: Target },
        { id: "access", label: "Access Controls", icon: Shield },
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
      {tab === "schedule" && <FamilyCalendar />}
      {tab === "milestones" && <MilestonesTimeline />}
      {tab === "checkin" && <FamilyCheckInCards />}
      {tab === "notes" && <InstructorNotesFeed />}
      {tab === "goals" && <FamilyGoals />}
      {tab === "access" && <AccessControls />}
      {tab === "communications" && <CommunicationSettings />}
      {tab === "billing" && <FamilyBilling />}
      {tab === "documents" && <DocumentHub />}
      {tab === "invite" && <FamilyInvite />}
    </div>
  );
}