import { Loader2, Users } from "lucide-react";

export default function LiveMatGrid({ students, readinessMap, onSelect, loading }) {
  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-[#C9A84C]" /></div>;
  }

  if (students.length === 0) {
    return (
      <div className="border border-[#A8A9AD]/20 bg-black p-12 text-center">
        <Users size={32} className="text-[#A8A9AD] mx-auto mb-3" />
        <p className="text-[#A8A9AD]">No students checked in yet. Use the search bar above to look up a student manually.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <Users size={18} className="text-[#C9A84C]" />
        <h2 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C]">Live Mat</h2>
        <span className="text-xs text-[#A8A9AD]">{students.length} checked in</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {students.map(s => {
          const ready = readinessMap[s.id]?.ready;
          return (
            <button
              key={s.id}
              onClick={() => onSelect(s)}
              className={`relative border p-4 flex flex-col items-center gap-3 transition-all hover:bg-white/5 ${ready ? "border-[#C9A84C] shadow-[0_0_12px_rgba(201,168,76,0.3)]" : "border-[#A8A9AD]/20"}`}
            >
              {ready && (
                <span className="absolute top-2 right-2 text-[9px] tracking-widest uppercase text-[#C9A84C] font-bold bg-[#C9A84C]/10 px-2 py-0.5">Ready</span>
              )}
              <div className={`w-16 h-16 flex items-center justify-center ${ready ? "bg-[#C9A84C]/20 border-2 border-[#C9A84C]" : "bg-[#C9A84C]/10 border border-[#C9A84C]/30"}`}>
                <span className="text-[#C9A84C] font-bold text-2xl">{s.full_name?.charAt(0) || "?"}</span>
              </div>
              <div className="text-center w-full">
                <p className="text-sm font-medium truncate">{s.full_name}</p>
                <p className="text-xs text-[#A8A9AD] truncate">{s.belt_rank || "No belt"}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}