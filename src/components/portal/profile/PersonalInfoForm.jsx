import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Save, Loader2 } from "lucide-react";

export default function PersonalInfoForm() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    phone: user?.phone || "", address: user?.address || "", dob: user?.dob || "",
    belt_size: user?.belt_size || "", uniform_size: user?.uniform_size || "",
    medical_conditions: user?.medical_conditions || "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) { alert("Failed to save: " + e.message); }
    setSaving(false);
  };

  const inputClass = "w-full bg-transparent border border-[#A8A9AD]/30 px-3 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none transition-colors";
  const labelClass = "block text-xs tracking-widest uppercase text-[#A8A9AD] mb-1.5";

  return (
    <div className="border border-[#A8A9AD]/20 bg-black p-6">
      <h2 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C] mb-4">Personal Information</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><label className={labelClass}>Phone</label><input className={inputClass} value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
        <div><label className={labelClass}>Date of Birth</label><input type="date" className={inputClass} value={form.dob} onChange={e => setForm({...form, dob: e.target.value})} /></div>
        <div className="sm:col-span-2"><label className={labelClass}>Address</label><input className={inputClass} value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></div>
        <div><label className={labelClass}>Belt Size</label><input className={inputClass} value={form.belt_size} onChange={e => setForm({...form, belt_size: e.target.value})} /></div>
        <div><label className={labelClass}>Uniform Size</label><input className={inputClass} value={form.uniform_size} onChange={e => setForm({...form, uniform_size: e.target.value})} /></div>
        <div className="sm:col-span-2"><label className={labelClass}>Medical Conditions / Allergies</label><textarea className={inputClass} rows={2} value={form.medical_conditions} onChange={e => setForm({...form, medical_conditions: e.target.value})} placeholder="List any medical conditions or allergies the academy should know about..." /></div>
      </div>
      <div className="flex items-center gap-3 mt-4">
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-[#C9A84C] text-black font-bold text-sm tracking-wide uppercase hover:bg-[#E0C97A] transition-colors disabled:opacity-50">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Changes
        </button>
        {saved && <span className="text-sm text-green-400">✓ Saved</span>}
      </div>
    </div>
  );
}