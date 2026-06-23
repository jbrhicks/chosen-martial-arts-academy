import { Loader2, Play, Square, Search, Radio } from "lucide-react";

export default function SessionBar({ session, onStart, onEnd, starting, search, onSearchChange, searchResults, onSelectStudent, programs, onProgramSelect, selectedProgramId }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        {session ? (
          <div className="flex items-center gap-3 flex-1">
            <div className="flex items-center gap-2 px-4 py-2.5 border border-[#C9A84C]/40 bg-[#C9A84C]/10">
              <Radio size={16} className="text-[#C9A84C] animate-pulse" />
              <span className="text-sm font-bold text-[#C9A84C] tracking-wide uppercase">Class in Progress</span>
              <span className="text-xs text-[#A8A9AD]">since {new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <button onClick={onEnd} className="flex items-center gap-2 px-4 py-2.5 border border-red-500/40 text-red-400 font-bold text-sm tracking-wide uppercase hover:bg-red-500/10 transition-colors">
              <Square size={16} /> End Class
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 flex-1">
            <select value={selectedProgramId} onChange={e => onProgramSelect(e.target.value)} className="bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none">
              <option value="">Select program (optional)...</option>
              {programs.filter(p => p.status !== "inactive").map(p => <option key={p.id} value={p.id}>{p.program_name}</option>)}
            </select>
            <button onClick={onStart} disabled={starting} className="flex items-center gap-2 px-5 py-2.5 bg-[#C9A84C] text-black font-bold text-sm tracking-wide uppercase hover:bg-[#E0C97A] transition-colors disabled:opacity-50">
              {starting ? <Loader2 size={16} className="animate-spin" /> : <><Play size={16} /> Start Class</>}
            </button>
          </div>
        )}
      </div>

      <div className="relative">
        <div className="flex items-center gap-2 border border-[#A8A9AD]/30 px-4 py-3 bg-black">
          <Search size={18} className="text-[#A8A9AD]" />
          <input value={search} onChange={e => onSearchChange(e.target.value)} placeholder="Search student by name or email for manual lookup..." className="bg-transparent text-sm text-white focus:outline-none flex-1" />
          {search && <button onClick={() => onSearchChange("")} className="text-[#A8A9AD] hover:text-white text-xs">Clear</button>}
        </div>
        {search && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 border border-[#A8A9AD]/30 bg-[#0A0A0A] max-h-64 overflow-y-auto z-50">
            {searchResults.map(s => (
              <button key={s.id} onClick={() => onSelectStudent(s)} className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-[#C9A84C]/10 transition-colors border-b border-[#A8A9AD]/10">
                <div className="w-8 h-8 bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center shrink-0">
                  <span className="text-[#C9A84C] font-bold text-xs">{s.full_name?.charAt(0) || "?"}</span>
                </div>
                <div>
                  <p className="text-sm font-medium">{s.full_name}</p>
                  <p className="text-xs text-[#A8A9AD]">{s.belt_rank || "No belt"}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}