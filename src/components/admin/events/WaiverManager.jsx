import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, X, Plus, Trash2, FileText, Pencil } from "lucide-react";

const WAIVER_TYPES = [
  { value: "standard", label: "Standard" },
  { value: "tournament", label: "Tournament" },
  { value: "camp", label: "Camp" },
  { value: "custom", label: "Custom" },
];

export default function WaiverManager({ onClose }) {
  const [waivers, setWaivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ waiver_name: "", waiver_type: "standard", body_text: "", is_active: true });
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const load = async () => {
      const [u, data] = await Promise.all([
        base44.auth.me().catch(() => null),
        base44.entities.Waiver.list().catch(() => []),
      ]);
      setUser(u);
      setWaivers(data.sort((a, b) => (a.waiver_name || "").localeCompare(b.waiver_name || "")));
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!form.waiver_name || !form.body_text) return;
    setSaving(true);
    try {
      if (editing) {
        await base44.entities.Waiver.update(editing.id, form);
      } else {
        await base44.entities.Waiver.create({
          ...form,
          created_by_id: user?.id || "",
          created_by_name: user?.full_name || "",
        });
      }
      const data = await base44.entities.Waiver.list();
      setWaivers(data.sort((a, b) => (a.waiver_name || "").localeCompare(b.waiver_name || "")));
      setForm({ waiver_name: "", waiver_type: "standard", body_text: "", is_active: true });
      setEditing(null);
    } catch (e) {
      alert("Failed to save waiver: " + e.message);
    }
    setSaving(false);
  };

  const handleEdit = (w) => {
    setEditing(w);
    setForm({ waiver_name: w.waiver_name, waiver_type: w.waiver_type, body_text: w.body_text, is_active: w.is_active });
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this waiver?")) return;
    try {
      await base44.entities.Waiver.delete(id);
      setWaivers(prev => prev.filter(w => w.id !== id));
    } catch (e) { alert("Failed to delete: " + e.message); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="w-full max-w-2xl border border-[#C9A84C]/30 bg-[#0A0A0A] p-8 my-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <FileText size={20} className="text-[#C9A84C]" />
            <h2 className="text-xl font-bold">Digital Waivers</h2>
          </div>
          <button onClick={onClose} className="text-[#A8A9AD] hover:text-white"><X size={20} /></button>
        </div>

        <p className="text-sm text-[#A8A9AD] mb-6">Create liability waivers (e.g., standard, tournament sparring, camp) and link them to events during checkout.</p>

        <div className="space-y-3 mb-6 p-4 border border-[#A8A9AD]/20">
          <div className="flex items-center gap-2 mb-2">
            {editing ? <Pencil size={14} className="text-[#C9A84C]" /> : <Plus size={14} className="text-[#C9A84C]" />}
            <p className="text-xs tracking-widest uppercase text-[#C9A84C]">{editing ? "Edit Waiver" : "New Waiver"}</p>
            {editing && <button onClick={() => { setEditing(null); setForm({ waiver_name: "", waiver_type: "standard", body_text: "", is_active: true }); }} className="text-xs text-[#A8A9AD] hover:text-white ml-auto">Cancel Edit</button>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input type="text" value={form.waiver_name} onChange={e => setForm({ ...form, waiver_name: e.target.value })} placeholder="Waiver name (e.g., Tournament Sparring Waiver)" className="bg-[#0A0A0A] border border-[#A8A9AD]/30 px-3 py-2 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
            <select value={form.waiver_type} onChange={e => setForm({ ...form, waiver_type: e.target.value })} className="bg-[#0A0A0A] border border-[#A8A9AD]/30 px-3 py-2 text-sm text-white focus:border-[#C9A84C] focus:outline-none">
              {WAIVER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <textarea value={form.body_text} onChange={e => setForm({ ...form, body_text: e.target.value })} placeholder="Waiver body text — the legal agreement the participant must sign..." className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-3 py-2 text-sm text-white focus:border-[#C9A84C] focus:outline-none min-h-[120px]" />
          <button onClick={handleSave} disabled={!form.waiver_name || !form.body_text || saving} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#C9A84C] text-black font-bold text-xs tracking-widest uppercase hover:bg-[#E0C97A] transition-colors disabled:opacity-50">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <>{editing ? "Update Waiver" : "Create Waiver"}</>}
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-[#C9A84C]" /></div>
        ) : waivers.length === 0 ? (
          <p className="text-sm text-[#A8A9AD] text-center py-4">No waivers created yet.</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {waivers.map(w => (
              <div key={w.id} className={`flex items-start justify-between p-3 border ${w.is_active === false ? "border-[#A8A9AD]/10 opacity-50" : "border-[#A8A9AD]/20"}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-white">{w.waiver_name}</p>
                    <span className="text-[10px] tracking-widest uppercase px-1.5 py-0.5 border border-[#C9A84C]/30 text-[#C9A84C]">{w.waiver_type}</span>
                  </div>
                  <p className="text-xs text-[#A8A9AD] mt-1 line-clamp-2">{w.body_text}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <button onClick={() => handleEdit(w)} className="p-2 text-[#A8A9AD] hover:text-[#C9A84C] transition-colors"><Pencil size={14} /></button>
                  <button onClick={() => handleDelete(w.id)} className="p-2 text-[#A8A9AD] hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}