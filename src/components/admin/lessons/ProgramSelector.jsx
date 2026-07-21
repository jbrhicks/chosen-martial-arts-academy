export default function ProgramSelector({ programs, selectedId, onSelect }) {
  return (
    <div>
      <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-1.5">Program</label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {programs.map((p) => {
          const isSelected = selectedId === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect(p.id)}
              className={`border p-3 text-left transition-all ${
                isSelected
                  ? "border-[#C9A84C] bg-[#C9A84C]/10"
                  : "border-[#A8A9AD]/20 bg-black hover:border-[#C9A84C]/40"
              }`}
            >
              <p className={`text-sm font-medium truncate ${isSelected ? "text-[#C9A84C]" : "text-white"}`}>
                {p.program_name}
              </p>
              <p className="text-xs text-[#A8A9AD] mt-0.5">{p.age_group}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}