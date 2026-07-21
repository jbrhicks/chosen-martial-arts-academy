import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, X, Settings2, Loader2 } from "lucide-react";

export default function SectionManager() {
  const [sections, setSections] = useState([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const items = await base44.entities.LessonPlanSection.list();
      setSections(items.sort((a, b) => (a.display_order || 0) - (b.display_order || 0)));
    } catch (e) {}
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      await base44.entities.LessonPlanSection.create({ section_name: newName.trim(), is_active: true });
      setNewName("");
      load();
    } catch (e) { alert("Failed: " + e.message); }
    setAdding(false);
  };

  const handleDelete = async (id) => {
    try { await base44.entities.LessonPlanSection.delete(id); load(); } catch (e) {}
  };

  if (!expanded) {
    return (
      <button onClick={() => setExpanded(true)} className="flex items-center gap-2 text-xs text-[#A8A9AD] hover:text-[#C9A84C] transition-colors">
        <Settings2 size={14} /> Manage Section Templates
      </button>
    );
  }

  return (
    <div className="border border-[#A8A9AD]/20 bg-black p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C]">Section Templates</h3>
        <button onClick={() => setExpanded(false)} className="text-xs text-[#A8A9AD] hover:text-white">Collapse</button>
      </div>
      <div className="flex gap-2 mb-3">
        <input value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAdd()} placeholder="New section name (e.g., Warm-up)..." className="flex-1 bg-transparent border border-[#A8A9AD]/30 px-3 py-2 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
        <button onClick={handleAdd} disabled={adding || !newName.trim()} className="flex items-center gap-1 px-3 py-2 bg-[#C9A84C] text-black text-sm font-bold hover:bg-[#E0C97A] disabled:opacity-50">
          {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add
        </button>
      </div>
      {loading ? (
        <div className="flex justify-center py-4"><Loader2 size={16} className="animate-spin text-[#C9A84C]" /></div>
      ) : sections.length === 0 ? (
        <p className="text-xs text-[#A8A9AD] text-center py-3">No section templates yet. Add some above.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {sections.map((s) => (
            <span key={s.id} className="flex items-center gap-1.5 border border-[#A8A9AD]/30 px-3 py-1.5 text-sm text-white">
              {s.section_name}
              <button onClick={() => handleDelete(s.id)} className="text-[#A8A9AD] hover:text-red-400 transition-colors"><X size={12} /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}