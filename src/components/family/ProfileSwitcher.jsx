import { useFamily } from "@/lib/FamilyContext";

export default function ProfileSwitcher() {
  const { members, activeProfileId, switchProfile, isGuardian } = useFamily();

  if (!isGuardian || members.length <= 1) return null;

  return (
    <div className="px-4 py-3 border-b border-[#A8A9AD]/20">
      <p className="text-[9px] tracking-widest uppercase text-[#A8A9AD] mb-2">Switch Profile</p>
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {members.map((m) => (
          <button
            key={m.id}
            onClick={() => switchProfile(m.id)}
            className={`flex flex-col items-center gap-1 p-2 min-w-[60px] transition-colors ${
              activeProfileId === m.id ? "bg-[#C9A84C]/10" : "hover:bg-white/5"
            }`}
          >
            <div className={`w-10 h-10 flex items-center justify-center text-sm font-bold border-2 ${
              activeProfileId === m.id
                ? "border-[#C9A84C] bg-[#C9A84C] text-black"
                : "border-[#A8A9AD]/30 text-[#A8A9AD]"
            }`}>
              {m.full_name?.charAt(0) || "?"}
            </div>
            <span className={`text-[10px] truncate max-w-[56px] ${activeProfileId === m.id ? "text-[#C9A84C]" : "text-[#A8A9AD]"}`}>
              {m.full_name?.split(" ")[0] || "User"}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}