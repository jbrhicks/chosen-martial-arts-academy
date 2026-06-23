import { useState } from "react";
import { CheckCircle, Lock, ChevronDown, ChevronUp, Award } from "lucide-react";

export default function JourneyMap({ belts, criteriaMap, progress, currentBeltId, stripesMap }) {
  const [expandedBelt, setExpandedBelt] = useState(currentBeltId);

  const currentIndex = belts.findIndex(b => b.id === currentBeltId);
  const getStatus = (criteriaId) => progress.find(p => p.criteria_id === criteriaId)?.status || "not_started";

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold mb-1">Your Journey</h2>
        <p className="text-sm text-[#A8A9AD]">Track your progress through the belt ranks. Review past material and preview what's next.</p>
      </div>

      <div className="relative">
        {belts.map((belt, index) => {
          const isPast = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isNext = index === currentIndex + 1;
          const isLocked = index > currentIndex + 1;
          const beltCriteria = criteriaMap[belt.id] || [];
          const masteredCount = isPast ? beltCriteria.length : beltCriteria.filter(c => getStatus(c.id) === "mastered").length;
          const progressPct = beltCriteria.length > 0 ? Math.round((masteredCount / beltCriteria.length) * 100) : 0;
          const beltStripes = stripesMap[belt.id] || [];
          const isExpanded = expandedBelt === belt.id;

          return (
            <div key={belt.id} className="relative pl-8 pb-4">
              {/* Timeline line */}
              {index < belts.length - 1 && <div className="absolute left-3 top-8 bottom-0 w-px bg-[#A8A9AD]/20" />}

              {/* Timeline dot */}
              <div className={`absolute left-0 top-1 w-6 h-6 flex items-center justify-center shrink-0 ${
                isCurrent ? "bg-[#C9A84C]" : isPast ? "bg-green-400" : isLocked ? "bg-[#1a1a1a] border border-[#A8A9AD]/20" : "bg-[#1a1a1a] border border-[#A8A9AD]/40"
              }`}>
                {isPast ? <CheckCircle size={14} className="text-black" /> : isLocked ? <Lock size={12} className="text-[#A8A9AD]/40" /> : <span className="text-xs font-bold text-[#A8A9AD]">{belt.rank_order}</span>}
              </div>

              {/* Belt card */}
              <div className={`border p-4 ${isCurrent ? "border-[#C9A84C]/40 bg-[#C9A84C]/5" : isPast ? "border-green-400/20 bg-black" : isLocked ? "border-[#A8A9AD]/10 bg-black opacity-50" : "border-[#A8A9AD]/20 bg-black"}`}>
                <button
                  onClick={() => !isLocked && setExpandedBelt(isExpanded ? null : belt.id)}
                  disabled={isLocked}
                  className="w-full flex items-center justify-between gap-3 text-left"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className={`font-bold text-sm ${isCurrent ? "text-[#C9A84C]" : isLocked ? "text-[#A8A9AD]/50" : "text-white"}`}>{belt.belt_name}</h3>
                      {isCurrent && <span className="text-[9px] tracking-widest uppercase text-[#C9A84C] border border-[#C9A84C]/40 px-2 py-0.5">Current</span>}
                      {beltStripes.length > 0 && (
                        <div className="flex items-center gap-0.5">
                          <Award size={12} className="text-[#C9A84C]" />
                          <span className="text-xs text-[#C9A84C]">{beltStripes.length}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-[#A8A9AD] mt-0.5">
                      {isLocked ? "Locked" : `${masteredCount}/${beltCriteria.length} criteria${isPast ? " — Completed" : ""}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {!isLocked && beltCriteria.length > 0 && (
                      <div className="w-20 h-1.5 bg-white/10 overflow-hidden">
                        <div className={`h-full ${isPast ? "bg-green-400" : "bg-[#C9A84C]"}`} style={{ width: `${progressPct}%` }} />
                      </div>
                    )}
                    {!isLocked && beltCriteria.length > 0 && (isExpanded ? <ChevronUp size={16} className="text-[#A8A9AD]" /> : <ChevronDown size={16} className="text-[#A8A9AD]" />)}
                  </div>
                </button>

                {isExpanded && !isLocked && beltCriteria.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[#A8A9AD]/10 space-y-1.5">
                    {beltCriteria.map(c => {
                      const status = getStatus(c.id);
                      return (
                        <div key={c.id} className="flex items-center gap-2 text-xs">
                          {isPast ? <CheckCircle size={12} className="text-green-400 shrink-0" /> : status === "mastered" ? <CheckCircle size={12} className="text-[#C9A84C] shrink-0" /> : <div className="w-3 h-3 border border-[#A8A9AD]/30 shrink-0" />}
                          <span className={isPast || status === "mastered" ? "text-white" : "text-[#A8A9AD]"}>{c.title}</span>
                          {isNext && <span className="text-[9px] tracking-widest uppercase text-[#A8A9AD]/50 ml-auto">Preview</span>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}