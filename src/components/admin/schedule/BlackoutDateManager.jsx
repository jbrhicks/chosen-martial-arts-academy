import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, X, Plus, Trash2, Ban, Power } from "lucide-react";

export default function BlackoutDateManager({ onClose, onChanged }) {
  const [blackouts, setBlackouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ start_date: "", end_date: "", public_message: "" });
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const load = async () => {
      const [u, data] = await Promise.all([
        base44.auth.me().catch(() => null),
        base44.entities.BlackoutDate.list().catch(() => []),
      ]);
      setUser(u);
      setBlackouts(data.sort((a, b) => (b.start_date || "").localeCompare(a.start_date || "")));
      setLoading(false);
    };
    load();
  }, []);

  const handleCreate = async () => {
    if (!form.start_date || !form.end_date || !form.public_message) return;
    setSaving(true);
    try {
      await base44.entities.BlackoutDate.create({
        ...form,
        is_active: true,
        created_by_id: user?.id || "",
        created_by_name: user?.full_name || "",
      });
      const data = await base44.entities.BlackoutDate.list();
      setBlackouts(data.sort((a, b) => (b.start_date || "").localeCompare(a.start_date || "")));
      setForm({ start_date: "", end_date: "", public_message: "" });
      onChanged();
    } catch (e) {
      alert("Failed to create blackout: " + e.message);
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this blackout period?")) return;
    try {
      await base44.entities.BlackoutDate.delete(id);
      setBlackouts(prev => prev.filter(b => b.id !== id));
      onChanged();
    } catch (e) {
      alert("Failed to delete: " + e.message);
    }
  };

  const toggleActive = async (b) => {
    try {
      await base44.entities.BlackoutDate.update(b.id, { is_active: !b.is_active });
      setBlackouts(prev => prev.map(x => x.id === b.id ? { ...x, is_active: !x.is_active } : x));
      onChanged();
    } catch (e) {
      alert("Failed to update: " + e.message);
    }
  };

  const fmtDate = (d) => d ? new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="w-full max-w-lg border border-[#C9A84C]/30 bg-[#0A0A0A] p-8 my-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Ban size={20} className="text-[#C9A84C]" />
            <h2 className="text-xl font-bold">Holiday & Blackout Dates</h2>
          </div>
          <button onClick={onClose} className="text-[#A8A9AD] hover:text-white"><X size={20} /></button>
        </div>

        <p className="text-sm text-[#A8A9AD] mb-6">Select a date range to pause all standard classes. A public "Closed" banner will appear on the admin and student apps.</p>

        <div className="space-y-3 mb-6 p-4 border border-[#A8A9AD]/20">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-1">Start Date *</label>
              <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} className="time-picker-light w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-3 py-2 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-1">End Date *</label>
              <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} className="time-picker-light w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-3 py-2 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-1">Public Message *</label>
            <input type="text" value={form.public_message} onChange={e => setForm({ ...form, public_message: e.target.value })} placeholder="e.g., Closed for Thanksgiving" className="w-full bg-transparent border border-[#A8A9AD]/30 px-3 py-2 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
          </div>
          <button onClick={handleCreate} disabled={!form.start_date || !form.end_date || !form.public_message || saving} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#C9A84C] text-black font-bold text-xs tracking-widest uppercase hover:bg-[#E0C97A] transition-colors disabled:opacity-50">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <><Plus size={14} /> Add Blackout Period</>}
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-[#C9A84C]" /></div>
        ) : blackouts.length === 0 ? (
          <p className="text-sm text-[#A8A9AD] text-center py-4">No blackout periods configured.</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {blackouts.map(b => (
              <div key={b.id} className={`flex items-center justify-between p-3 border ${b.is_active === false ? "border-[#A8A9AD]/10 opacity-50" : "border-red-500/20 bg-red-500/5"}`}>
                <div>
                  <p className="text-sm font-bold text-white">{b.public_message}</p>
                  <p className="text-xs text-[#A8A9AD]">{fmtDate(b.start_date)} — {fmtDate(b.end_date)}</p>
                  {b.created_by_name && <p className="text-xs text-[#A8A9AD]/60 mt-0.5">by {b.created_by_name}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleActive(b)} className={`p-2 ${b.is_active === false ? "text-[#A8A9AD] hover:text-[#C9A84C]" : "text-[#C9A84C] hover:text-[#E0C97A]"}`}>
                    <Power size={14} />
                  </button>
                  <button onClick={() => handleDelete(b.id)} className="p-2 text-[#A8A9AD] hover:text-red-400 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}