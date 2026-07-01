import { Gift } from "lucide-react";

const TRIAL_PERKS = [
  "One full week of unlimited training",
  "All belt levels and age groups welcome",
  "No equipment needed — just show up",
  "Personal intro session with an instructor",
];

export default function TrialValueChecklist({ compact = false }) {
  return (
    <div className={`border border-[#C9A84C]/30 bg-[#C9A84C]/5 ${compact ? "p-4" : "p-5"} mb-6`}>
      <div className="flex items-center gap-2 mb-3">
        <Gift size={14} className="text-[#C9A84C]" />
        <span className="text-xs tracking-widest uppercase text-[#C9A84C] font-bold">Your Free Trial Includes</span>
      </div>
      <div className="space-y-2">
        {TRIAL_PERKS.map((perk) => (
          <div key={perk} className="flex items-center gap-2.5">
            <div className="w-4 h-4 border border-[#C9A84C] flex items-center justify-center shrink-0">
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                <path d="M1 4l2 2 4-4" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-xs text-white">{perk}</span>
          </div>
        ))}
      </div>
    </div>
  );
}