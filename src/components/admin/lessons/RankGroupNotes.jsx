const rankGroups = [
  { key: "beginner", label: "Beginner", color: "text-green-400" },
  { key: "intermediate", label: "Intermediate", color: "text-blue-400" },
  { key: "advanced", label: "Advanced", color: "text-[#C9A84C]" },
];

export default function RankGroupNotes({ notes, onChange }) {
  const handleChange = (group, value) => {
    onChange({ ...notes, [group]: value });
  };

  return (
    <div>
      <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-1">Rank Group Notes</label>
      <p className="text-xs text-[#A8A9AD] mb-3">Add specific guidance for each skill level within this class.</p>
      <div className="space-y-3">
        {rankGroups.map((g) => (
          <div key={g.key} className="border border-[#A8A9AD]/20 bg-black p-3">
            <label className={`text-xs tracking-widest uppercase ${g.color} mb-1.5 block`}>{g.label}</label>
            <textarea
              value={notes[g.key] || ""}
              onChange={(e) => handleChange(g.key, e.target.value)}
              rows={2}
              placeholder={`${g.label} notes...`}
              className="w-full bg-transparent text-sm text-white focus:outline-none resize-none"
            />
          </div>
        ))}
      </div>
    </div>
  );
}