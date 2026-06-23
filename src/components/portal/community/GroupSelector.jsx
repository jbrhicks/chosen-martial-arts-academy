import { Users, Globe } from "lucide-react";

export default function GroupSelector({ groups, selectedGroup, onSelectGroup }) {
  if (!groups || groups.length === 0) return null;

  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
      <button
        onClick={() => onSelectGroup(null)}
        className={`flex items-center gap-2 px-4 py-2 text-xs tracking-widest uppercase whitespace-nowrap transition-colors shrink-0 ${
          selectedGroup === null ? "bg-[#C9A84C] text-black font-bold" : "border border-[#A8A9AD]/20 text-[#A8A9AD] hover:text-white"
        }`}
      >
        <Globe size={14} /> Main Feed
      </button>
      {groups.map(g => (
        <button
          key={g.group_id}
          onClick={() => onSelectGroup(g.group_id)}
          className={`flex items-center gap-2 px-4 py-2 text-xs tracking-widest uppercase whitespace-nowrap transition-colors shrink-0 ${
            selectedGroup === g.group_id ? "bg-[#C9A84C] text-black font-bold" : "border border-[#A8A9AD]/20 text-[#A8A9AD] hover:text-white"
          }`}
        >
          <Users size={14} /> {g.group_name}
        </button>
      ))}
    </div>
  );
}