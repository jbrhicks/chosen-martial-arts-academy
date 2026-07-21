import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { BookOpen, Users, MessageSquare } from "lucide-react";
import TeachingPlaybook from "@/components/teaching/TeachingPlaybook";
import MatIntel from "@/components/teaching/MatIntel";
import ShiftLogbook from "@/components/teaching/ShiftLogbook";

export default function Teaching() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("playbook");

  if (!user?.is_instructor && user?.role !== "admin") {
    return <Navigate to="/portal" replace />;
  }

  const tabs = [
    { id: "playbook", label: "Playbook", icon: BookOpen },
    { id: "mat-intel", label: "Mat Intel", icon: Users },
    { id: "logbook", label: "Logbook", icon: MessageSquare },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs tracking-widest uppercase text-[#C9A84C] mb-2">Instructor Command Center</p>
        <h1 className="text-3xl font-bold">Teaching Dashboard</h1>
        {user?.instructor_tier && <p className="text-sm text-[#A8A9AD] mt-1">{user.instructor_tier}</p>}
      </div>

      <div className="flex gap-1 border-b border-[#A8A9AD]/20">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium tracking-wide transition-colors border-b-2 ${
                activeTab === tab.id ? "border-[#C9A84C] text-[#C9A84C]" : "border-transparent text-[#A8A9AD] hover:text-white"
              }`}
            >
              <Icon size={16} /> {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "playbook" && <TeachingPlaybook />}
      {activeTab === "mat-intel" && <MatIntel />}
      {activeTab === "logbook" && <ShiftLogbook />}
    </div>
  );
}