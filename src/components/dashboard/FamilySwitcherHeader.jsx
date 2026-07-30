import { useState } from "react";
import { ChevronDown, Check, Users } from "lucide-react";
import { useFamily } from "@/lib/FamilyContext";

export default function FamilySwitcherHeader() {
  const { isGuardian, members, activeProfile, activeProfileId, switchProfile } = useFamily();
  const [open, setOpen] = useState(false);

  // Permission gate: only guardians with more than one linked student see the switcher.
  // Students never see it — prevents access to sibling/parent billing profiles.
  const linkedStudents = members.filter((m) => m.family_role === "student");
  if (!isGuardian || linkedStudents.length <= 1) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 border border-[#C9A84C]/30 bg-[#C9A84C]/5 px-4 py-3 hover:bg-[#C9A84C]/10 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Users size={18} className="text-[#C9A84C]" />
          <div className="text-left">
            <p className="text-[9px] tracking-widest uppercase text-[#A8A9AD]">Household</p>
            <p className="text-sm font-bold text-white">{activeProfile?.full_name || "Select profile"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#A8A9AD] hidden sm:inline">Switch child</span>
          <ChevronDown size={18} className={`text-[#A8A9AD] transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-1 z-50 border border-[#A8A9AD]/20 bg-[#0A0A0A] shadow-xl">
            <p className="px-4 py-2 text-[9px] tracking-widest uppercase text-[#A8A9AD] border-b border-[#A8A9AD]/20">
              Linked Students
            </p>
            {linkedStudents.map((m) => {
              const isActive = m.id === activeProfileId;
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    switchProfile(m.id);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    isActive ? "bg-[#C9A84C]/10" : "hover:bg-white/5"
                  }`}
                >
                  <div
                    className={`w-9 h-9 flex items-center justify-center text-sm font-bold border ${
                      isActive ? "border-[#C9A84C] bg-[#C9A84C] text-black" : "border-[#A8A9AD]/30 text-[#A8A9AD]"
                    }`}
                  >
                    {m.full_name?.charAt(0) || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{m.full_name}</p>
                    {m.belt_rank && <p className="text-xs text-[#A8A9AD]">{m.belt_rank}</p>}
                  </div>
                  {isActive && <Check size={16} className="text-[#C9A84C]" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}