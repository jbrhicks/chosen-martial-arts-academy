import { useState } from "react";
import { base44 } from "@/api/base44Client";
import RankBuilder from "./RankBuilder";
import { Trash2, ChevronDown, ChevronUp, Pencil } from "lucide-react";

export default function BeltCard({ belt, onBeltUpdate, onBeltDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [editingBelt, setEditingBelt] = useState(false);
  const [beltForm, setBeltForm] = useState({ belt_name: belt.belt_name, rank_order: belt.rank_order, min_classes_required: belt.min_classes_required, min_time_in_grade: belt.min_time_in_grade });

  const handleSaveBelt = async () => {
    try { await base44.entities.RankBelt.update(belt.id, beltForm); onBeltUpdate(); setEditingBelt(false); } catch (e) { alert("Failed to update belt."); }
  };

  const handleDeleteBelt = async () => {
    if (!confirm(`Delete "${belt.belt_name}" and all its categories and items?`)) return;
    try {
      const cats = await base44.entities.CurriculumCategory.filter({ rank_id: belt.id });
      for (const c of cats) { await base44.entities.CurriculumCategory.delete(c.id); }
      const items = await base44.entities.CurriculumCriteria.filter({ rank_id: belt.id });
      for (const c of items) { await base44.entities.CurriculumCriteria.delete(c.id); }
      await base44.entities.RankBelt.delete(belt.id);
      onBeltDelete();
    } catch (e) { alert("Failed to delete belt."); }
  };

  return (
    <div className="border border-[#A8A9AD]/20 bg-black">
      <div className="px-5 py-4 flex items-center gap-3 border-b border-[#A8A9AD]/10">
        <button onClick={() => setExpanded(!expanded)} className="text-[#A8A9AD] hover:text-white">
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        <div className="w-8 h-8 border-2 border-[#C9A84C]/40 flex items-center justify-center text-sm font-bold text-[#C9A84C] shrink-0">{belt.rank_order}</div>
        {editingBelt ? (
          <div className="flex items-center gap-2 flex-1 flex-wrap">
            <input value={beltForm.belt_name} onChange={e => setBeltForm({ ...beltForm, belt_name: e.target.value })} className="bg-transparent border border-[#A8A9AD]/30 px-2 py-1 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
            <input type="number" value={beltForm.rank_order} onChange={e => setBeltForm({ ...beltForm, rank_order: parseInt(e.target.value) || 1 })} className="w-16 bg-transparent border border-[#A8A9AD]/30 px-2 py-1 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
            <input type="number" value={beltForm.min_classes_required} onChange={e => setBeltForm({ ...beltForm, min_classes_required: parseInt(e.target.value) || 0 })} className="w-20 bg-transparent border border-[#A8A9AD]/30 px-2 py-1 text-sm text-white focus:border-[#C9A84C] focus:outline-none" placeholder="Classes" />
            <input type="number" value={beltForm.min_time_in_grade} onChange={e => setBeltForm({ ...beltForm, min_time_in_grade: parseInt(e.target.value) || 0 })} className="w-20 bg-transparent border border-[#A8A9AD]/30 px-2 py-1 text-sm text-white focus:border-[#C9A84C] focus:outline-none" placeholder="Weeks" />
            <button onClick={handleSaveBelt} className="text-xs text-[#C9A84C] tracking-widest uppercase font-medium">Save</button>
          </div>
        ) : (
          <div className="flex-1">
            <h3 className="font-bold text-sm">{belt.belt_name}</h3>
            <p className="text-xs text-[#A8A9AD]">Min {belt.min_classes_required} classes • {belt.min_time_in_grade} weeks in grade</p>
          </div>
        )}
        {!editingBelt && (
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setEditingBelt(true)} className="text-[#A8A9AD] hover:text-white"><Pencil size={14} /></button>
            <button onClick={handleDeleteBelt} className="text-[#A8A9AD] hover:text-red-400"><Trash2 size={14} /></button>
          </div>
        )}
      </div>
      {expanded && <RankBuilder belt={belt} onBeltUpdate={onBeltUpdate} />}
    </div>
  );
}