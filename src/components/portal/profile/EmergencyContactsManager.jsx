import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Plus, Trash2, Loader2, Phone, X } from "lucide-react";

export default function EmergencyContactsManager() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ contact_name: "", relationship: "", phone: "", alt_phone: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!user) return;
    try {
      const data = await base44.entities.EmergencyContact.filter({ user_id: user.id });
      setContacts(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const handleAdd = async () => {
    if (!form.contact_name || !form.phone) return;
    setSaving(true);
    try {
      await base44.entities.EmergencyContact.create({ ...form, user_id: user.id, user_email: user.email });
      setForm({ contact_name: "", relationship: "", phone: "", alt_phone: "" });
      setShowAdd(false);
      load();
    } catch (e) { alert("Failed to add: " + e.message); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Remove this emergency contact?")) return;
    try {
      await base44.entities.EmergencyContact.delete(id);
      load();
    } catch (e) { alert("Failed to delete: " + e.message); }
  };

  const inputClass = "w-full bg-transparent border border-[#A8A9AD]/30 px-3 py-2 text-sm text-white focus:border-[#C9A84C] focus:outline-none transition-colors";

  return (
    <div className="border border-[#A8A9AD]/20 bg-black p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C]">Emergency Contacts</h2>
        <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1 text-xs text-[#C9A84C] hover:text-[#E0C97A] font-medium">
          <Plus size={14} /> Add Contact
        </button>
      </div>
      {showAdd && (
        <div className="mb-4 p-4 border border-[#C9A84C]/30 bg-[#C9A84C]/5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-[#C9A84C] uppercase tracking-wide">New Emergency Contact</p>
            <button onClick={() => setShowAdd(false)} className="text-[#A8A9AD] hover:text-white"><X size={16} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input className={inputClass} placeholder="Full name" value={form.contact_name} onChange={e => setForm({...form, contact_name: e.target.value})} />
            <input className={inputClass} placeholder="Relationship (e.g. Parent)" value={form.relationship} onChange={e => setForm({...form, relationship: e.target.value})} />
            <input className={inputClass} placeholder="Phone number" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
            <input className={inputClass} placeholder="Alternate phone (optional)" value={form.alt_phone} onChange={e => setForm({...form, alt_phone: e.target.value})} />
          </div>
          <button onClick={handleAdd} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-[#C9A84C] text-black font-bold text-xs uppercase tracking-wide hover:bg-[#E0C97A] disabled:opacity-50">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add Contact
          </button>
        </div>
      )}
      {loading ? (
        <div className="flex justify-center py-4"><Loader2 size={20} className="animate-spin text-[#C9A84C]" /></div>
      ) : contacts.length === 0 ? (
        <p className="text-sm text-[#A8A9AD]">No emergency contacts on file. Please add at least one.</p>
      ) : (
        <div className="space-y-2">
          {contacts.map(c => (
            <div key={c.id} className="flex items-center gap-3 p-3 border border-[#A8A9AD]/20">
              <Phone size={16} className="text-[#C9A84C] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{c.contact_name}</p>
                <p className="text-xs text-[#A8A9AD]">{c.relationship || "Contact"} · {c.phone}{c.alt_phone ? ` / ${c.alt_phone}` : ""}</p>
              </div>
              <button onClick={() => handleDelete(c.id)} className="text-[#A8A9AD] hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}