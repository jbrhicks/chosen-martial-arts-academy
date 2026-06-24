import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { BELT_RANKS } from "@/lib/constants";
import { Loader2, Save, X, Settings } from "lucide-react";

export default function RankLevelSettings({ onClose }) {
  const [programs, setPrograms] = useState([]);
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [config, setConfig] = useState({ beginner_min_rank: "", beginner_max_rank: "", intermediate_min_rank: "", intermediate_max_rank: "", advanced_min_rank: "", advanced_max_rank: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    base44.entities.Program.list()
      .then(data => {
        const active = data.filter(p => p.status !== "inactive");
        setPrograms(active);
        if (active.length > 0) setSelectedProgramId(active[0].id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const prog = programs.find(p => p.id === selectedProgramId);
    if (prog) {
      setConfig({
        beginner_min_rank: prog.beginner_min_rank || "",
        beginner_max_rank: prog.beginner_max_rank || "",
        intermediate_min_rank: prog.intermediate_min_rank || "",
        intermediate_max_rank: prog.intermediate_max_rank || "",
        advanced_min_rank: prog.advanced_min_rank || "",
        advanced_max_rank: prog.advanced_max_rank || "",
      });
    }
  }, [selectedProgramId, programs]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.entities.Program.update(selectedProgramId, config);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      setPrograms(prev => prev.map(p => p.id === selectedProgramId ? { ...p, ...config } : p));
    } catch (e) { alert("Failed to save rank levels: " + (e?.message || e)); }
    setSaving(false);
  };

  const selectedProgram = programs.find(p => p.id === selectedProgramId);

  const rangeLabel = (minRank, maxRank) => {
    const minIdx = minRank ? BELT_RANKS.indexOf(minRank) : -1;
    const maxIdx = maxRank ? BELT_RANKS.indexOf(maxRank) : -1;
    if (minIdx === -1 && maxIdx === -1) return "Not set";
    if (minIdx === -1) return `${BELT_RANKS[0]} through ${maxRank}`;
    if (maxIdx === -1) return `${minRank} and above`;
    if (minRank === maxRank) return minRank;
    return `${minRank} through ${maxRank}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="w-full max-w-2xl border border-[#C9A84C]/30 bg-[#0A0A0A] p-8 my-8" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Settings size={20} className="text-[#C9A84C]" />
            <h2 className="text-xl font-bold">Rank Level Settings</h2>
          </div>
          <button onClick={onClose} className="text-[#A8A9AD] hover:text-white"><X size={20} /></button>
        </div>

        <p className="text-sm text-[#A8A9AD] mb-6">Define which belt ranks fall into each difficulty level for each program. These thresholds determine class eligibility for students on their schedule.</p>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-[#C9A84C]" /></div>
        ) : programs.length === 0 ? (
          <p className="text-sm text-[#A8A9AD] text-center py-8">No active programs found.</p>
        ) : (
          <>
            <div className="mb-6">
              <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Select Program</label>
              <select value={selectedProgramId} onChange={e => setSelectedProgramId(e.target.value)} className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-3 text-sm text-white focus:border-[#C9A84C] focus:outline-none">
                {programs.map(p => <option key={p.id} value={p.id}>{p.program_name}</option>)}
              </select>
            </div>

            <div className="space-y-5" key={selectedProgramId}>
              <RankLevelRow
                label="Beginner"
                description="Lowest difficulty — typically new students and early ranks."
                color="#3B7A3B"
                minValue={config.beginner_min_rank}
                onMinChange={v => setConfig({ ...config, beginner_min_rank: v })}
                maxValue={config.beginner_max_rank}
                onMaxChange={v => setConfig({ ...config, beginner_max_rank: v })}
                rangeLabel={rangeLabel}
              />
              <RankLevelRow
                label="Intermediate"
                description="Mid-level — students who have progressed past beginner ranks."
                color="#E8843A"
                minValue={config.intermediate_min_rank}
                onMinChange={v => setConfig({ ...config, intermediate_min_rank: v })}
                maxValue={config.intermediate_max_rank}
                onMaxChange={v => setConfig({ ...config, intermediate_max_rank: v })}
                rangeLabel={rangeLabel}
              />
              <RankLevelRow
                label="Advanced"
                description="High-level — experienced students approaching black belt."
                color="#C53030"
                minValue={config.advanced_min_rank}
                onMinChange={v => setConfig({ ...config, advanced_min_rank: v })}
                maxValue={config.advanced_max_rank}
                onMaxChange={v => setConfig({ ...config, advanced_max_rank: v })}
                rangeLabel={rangeLabel}
              />
            </div>

            <div className="mt-6 border border-[#A8A9AD]/20 p-4">
              <p className="text-xs tracking-widest uppercase text-[#A8A9AD] mb-3">Preview for {selectedProgram?.program_name}</p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2"><span className="w-2 h-2 bg-green-500" /><span className="text-[#A8A9AD]">Beginner:</span> <span className="text-white">{rangeLabel(config.beginner_min_rank, config.beginner_max_rank)}</span></div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 bg-orange-500" /><span className="text-[#A8A9AD]">Intermediate:</span> <span className="text-white">{rangeLabel(config.intermediate_min_rank, config.intermediate_max_rank)}</span></div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 bg-red-500" /><span className="text-[#A8A9AD]">Advanced:</span> <span className="text-white">{rangeLabel(config.advanced_min_rank, config.advanced_max_rank)}</span></div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 bg-[#C9A84C]" /><span className="text-[#A8A9AD]">Black Belt:</span> <span className="text-white">1st Degree Black Belt and above</span></div>
              </div>
            </div>

            <button onClick={handleSave} disabled={saving} className="w-full mt-6 bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase py-3 hover:bg-[#E0C97A] transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
              {saving ? <Loader2 size={18} className="animate-spin" /> : saved ? "Saved!" : <><Save size={16} /> Save Rank Levels</>}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function RankLevelRow({ label, description, color, minValue, onMinChange, maxValue, onMaxChange, rangeLabel }) {
  return (
    <div className="border border-[#A8A9AD]/20 p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-3 h-3" style={{ background: color }} />
        <h3 className="text-sm font-bold tracking-wide">{label}</h3>
      </div>
      <p className="text-xs text-[#A8A9AD] mb-3">{description}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Lowest Rank</label>
          <select value={minValue} onChange={e => onMinChange(e.target.value)} className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none">
            <option value="">Not set</option>
            {BELT_RANKS.map(rank => <option key={rank} value={rank}>{rank}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Highest Rank</label>
          <select value={maxValue} onChange={e => onMaxChange(e.target.value)} className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none">
            <option value="">Not set</option>
            {BELT_RANKS.map(rank => <option key={rank} value={rank}>{rank}</option>)}
          </select>
        </div>
      </div>
      <p className="text-xs text-[#A8A9AD] mt-3">Eligible: <span className="text-white font-medium">{rangeLabel(minValue, maxValue)}</span></p>
    </div>
  );
}