import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { BELT_RANKS } from "@/lib/constants";
import { Loader2, Save, X, Settings, Check } from "lucide-react";

const EMPTY_CONFIG = {
  beginner_min_rank: "", beginner_max_rank: "",
  intermediate_min_rank: "", intermediate_max_rank: "",
  advanced_min_rank: "", advanced_max_rank: "",
};

export default function RankLevelSettings({ onClose }) {
  const [programs, setPrograms] = useState([]);
  const [configs, setConfigs] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [savedId, setSavedId] = useState(null);

  useEffect(() => {
    base44.entities.Program.list()
      .then(data => {
        const active = data.filter(p => p.status !== "inactive");
        setPrograms(active);
        const initialConfigs = {};
        active.forEach(p => {
          initialConfigs[p.id] = {
            beginner_min_rank: p.beginner_min_rank || "",
            beginner_max_rank: p.beginner_max_rank || "",
            intermediate_min_rank: p.intermediate_min_rank || "",
            intermediate_max_rank: p.intermediate_max_rank || "",
            advanced_min_rank: p.advanced_min_rank || "",
            advanced_max_rank: p.advanced_max_rank || "",
          };
        });
        setConfigs(initialConfigs);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (programId) => {
    setSavingId(programId);
    try {
      await base44.entities.Program.update(programId, configs[programId]);
      setSavedId(programId);
      setTimeout(() => setSavedId(null), 2000);
    } catch (e) {
      alert("Failed to save rank levels: " + (e?.message || e));
    }
    setSavingId(null);
  };

  const updateConfig = (programId, field, value) => {
    setConfigs(prev => ({
      ...prev,
      [programId]: { ...(prev[programId] || EMPTY_CONFIG), [field]: value },
    }));
  };

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
      <div className="w-full max-w-4xl border border-[#C9A84C]/30 bg-[#0A0A0A] p-8 my-8" onClick={e => e.stopPropagation()}>
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
          <div className="space-y-6">
            {programs.map((program) => {
              const config = configs[program.id] || EMPTY_CONFIG;
              const isSaving = savingId === program.id;
              const isSaved = savedId === program.id;
              return (
                <div key={program.id} className="border border-[#A8A9AD]/20 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-bold tracking-wide text-white">{program.program_name}</h3>
                      <p className="text-xs text-[#A8A9AD]">{program.age_group}</p>
                    </div>
                    <button
                      onClick={() => handleSave(program.id)}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-4 py-2 bg-[#C9A84C] text-black font-bold text-xs tracking-widest uppercase hover:bg-[#E0C97A] transition-colors disabled:opacity-50"
                    >
                      {isSaving ? <Loader2 size={14} className="animate-spin" /> : isSaved ? <><Check size={14} /> Saved</> : <><Save size={14} /> Save</>}
                    </button>
                  </div>
                  <div className="space-y-3">
                    <RankLevelRow
                      label="Beginner"
                      color="#3B7A3B"
                      minValue={config.beginner_min_rank}
                      onMinChange={v => updateConfig(program.id, "beginner_min_rank", v)}
                      maxValue={config.beginner_max_rank}
                      onMaxChange={v => updateConfig(program.id, "beginner_max_rank", v)}
                      rangeLabel={rangeLabel}
                    />
                    <RankLevelRow
                      label="Intermediate"
                      color="#E8843A"
                      minValue={config.intermediate_min_rank}
                      onMinChange={v => updateConfig(program.id, "intermediate_min_rank", v)}
                      maxValue={config.intermediate_max_rank}
                      onMaxChange={v => updateConfig(program.id, "intermediate_max_rank", v)}
                      rangeLabel={rangeLabel}
                    />
                    <RankLevelRow
                      label="Advanced"
                      color="#C53030"
                      minValue={config.advanced_min_rank}
                      onMinChange={v => updateConfig(program.id, "advanced_min_rank", v)}
                      maxValue={config.advanced_max_rank}
                      onMaxChange={v => updateConfig(program.id, "advanced_max_rank", v)}
                      rangeLabel={rangeLabel}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function RankLevelRow({ label, color, minValue, onMinChange, maxValue, onMaxChange, rangeLabel }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 pl-3 border-l-2" style={{ borderColor: color }}>
      <div className="sm:w-32 shrink-0">
        <span className="text-xs font-bold tracking-wide text-white">{label}</span>
        <p className="text-xs text-[#A8A9AD] mt-0.5">{rangeLabel(minValue, maxValue)}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 flex-1">
        <div>
          <label className="block text-[10px] tracking-widest uppercase text-[#A8A9AD] mb-1">Lowest</label>
          <select value={minValue || ""} onChange={e => onMinChange(e.target.value)} className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-3 py-2 text-xs text-white focus:border-[#C9A84C] focus:outline-none">
            <option value="">Not set</option>
            {BELT_RANKS.map(rank => <option key={rank} value={rank}>{rank}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] tracking-widest uppercase text-[#A8A9AD] mb-1">Highest</label>
          <select value={maxValue || ""} onChange={e => onMaxChange(e.target.value)} className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-3 py-2 text-xs text-white focus:border-[#C9A84C] focus:outline-none">
            <option value="">Not set</option>
            {BELT_RANKS.map(rank => <option key={rank} value={rank}>{rank}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}