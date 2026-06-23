import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import CriteriaForm from "./CriteriaForm";
import { Plus, Trash2, ChevronDown, ChevronUp, Pencil, Loader2, Video } from "lucide-react";

export default function BeltCard({ belt, onBeltUpdate, onBeltDelete }) {
  const [criteria, setCriteria] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCriteria, setEditingCriteria] = useState(null);
  const [editingBelt, setEditingBelt] = useState(false);
  const [beltForm, setBeltForm] = useState({ belt_name: belt.belt_name, rank_order: belt.rank_order, min_classes_required: belt.min_classes_required, min_time_in_grade: belt.min_time_in_grade });

  const load = async () => {
    try {
      const c = await base44.entities.CurriculumCriteria.filter({ rank_id: belt.id });
      c.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
      setCriteria(c);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [belt.id]);

  const handleDeleteCriteria = async (id) => {
    if (!confirm("Delete this criterion?")) return;
    try { await base44.entities.CurriculumCriteria.delete(id); load(); } catch (e) { alert("Failed to delete."); }
  };

  const handleSaveBelt = async () => {
    try { await base44.entities.RankBelt.update(belt.id, beltForm); onBeltUpdate(); setEditingBelt(false); } catch (e) { alert("Failed to update belt."); }
  };

  const handleDeleteBelt = async () => {
    if (!confirm(`Delete "${belt.belt_name}" and all its criteria?`)) return;
    try {
      for (const c of criteria) { await base44.entities.CurriculumCriteria.delete(c.id); }
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
            <p className="text-xs text-[#A8A9AD]">Min {belt.min_classes_required} classes • {belt.min_time_in_grade} weeks in grade • {criteria.length} criteria</p>
          </div>
        )}
        {!editingBelt && (
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setEditingBelt(true)} className="text-[#A8A9AD] hover:text-white"><Pencil size={14} /></button>
            <button onClick={handleDeleteBelt} className="text-[#A8A9AD] hover:text-red-400"><Trash2 size={14} /></button>
          </div>
        )}
      </div>
      {expanded && (
        <div className="p-4 space-y-2">
          {loading ? <div className="flex justify-center py-4"><Loader2 size={16} className="animate-spin text-[#C9A84C]" /></div> : (
            <>
              {criteria.length === 0 ? (
                <p className="text-xs text-[#A8A9AD] text-center py-4">No criteria yet. Add one below.</p>
              ) : (
                criteria.map(c => (
                  <div key={c.id} className="flex items-center gap-3 px-3 py-2.5 border border-[#A8A9AD]/10 hover:border-[#A8A9AD]/20 transition-colors">
                    <span className="text-[9px] tracking-widest uppercase text-[#A8A9AD] border border-[#A8A9AD]/20 px-2 py-0.5 shrink-0">{c.category}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{c.title}</p>
                      {c.description && <p className="text-xs text-[#A8A9AD] truncate">{c.description}</p>}
                    </div>
                    {c.video_url && <Video size={14} className="text-[#C9A84C] shrink-0" />}
                    <button onClick={() => setEditingCriteria(c)} className="text-[#A8A9AD] hover:text-white shrink-0"><Pencil size={14} /></button>
                    <button onClick={() => handleDeleteCriteria(c.id)} className="text-[#A8A9AD] hover:text-red-400 shrink-0"><Trash2 size={14} /></button>
                  </div>
                ))
              )}
              <button onClick={() => { setEditingCriteria(null); setShowForm(true); }} className="flex items-center gap-2 px-3 py-2 border border-dashed border-[#C9A84C]/30 text-[#C9A84C] text-xs font-medium tracking-wide hover:bg-[#C9A84C]/10 transition-colors w-full justify-center">
                <Plus size={14} /> Add Criterion
              </button>
            </>
          )}
        </div>
      )}
      {showForm && <CriteriaForm rankId={belt.id} criteria={editingCriteria} onSave={load} onClose={() => { setShowForm(false); setEditingCriteria(null); }} />}
    </div>
  );
}