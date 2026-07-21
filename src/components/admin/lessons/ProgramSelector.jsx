import { Check } from "lucide-react";

export default function ProgramSelector({ programs, selectedIds, onToggle }) {
  return (
    <div>
      <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-1">Program(s)</label>
      <p className="text-xs text-[#A8A9AD] mb-2">Select one or more programs for this lesson plan.</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {programs.map((p) => {
          const isSelected = selectedIds.includes(p.id);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onToggle(p.id)}
              className={`border p-3 text-left transition-all relative ${
                isSelected
                  ? "border-[#C9A84C] bg-[#C9A84C]/10"
                  : "border-[#A8A9AD]/20 bg-black hover:border-[#C9A84C]/40"
              }`}
            >
              {isSelected && <Check size={14} className="absolute top-2 right-2 text-[#C9A84C]" />}
              <p className={`text-sm font-medium truncate pr-5 ${isSelected ? "text-[#C9A84C]" : "text-white"}`}>
                {p.program_name}
              </p>
              <p className="text-xs text-[#A8A9AD] mt-0.5">{p.age_group}</p>
            </button>
          );
        })}
      </div>
      {selectedIds.length > 0 && (
        <p className="text-xs text-[#C9A84C] mt-2">{selectedIds.length} program{selectedIds.length !== 1 ? "s" : ""} selected</p>
      )}
    </div>
  );
}