import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Save, Plus, X, Loader2, MessageSquare } from "lucide-react";

export default function PersonalDetails({ user, customFields, customFieldValues, onRefresh, logActivity }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    phone: user?.phone || "", address: user?.address || "", dob: user?.dob || "",
    belt_size: user?.belt_size || "", uniform_size: user?.uniform_size || "",
    medical_conditions: user?.medical_conditions || "",
  });
  const [saving, setSaving] = useState(false);
  const [showNewField, setShowNewField] = useState(false);
  const [newField, setNewField] = useState({ field_label: "", field_type: "text", field_value: "" });
  const [fieldSaving, setFieldSaving] = useState(false);

  const fieldMap = customFieldValues.reduce((acc, cfv) => ({ ...acc, [cfv.field_id]: cfv }), {});

  const handleSave = async () => {
    setSaving(true);
    try {
      const changes = Object.keys(form).filter(k => form[k] !== (user?.[k] || ""));
      await base44.entities.User.update(user.id, form);
      if (changes.length > 0) await logActivity("edit", `Updated personal details: ${changes.join(", ")}`);
      onRefresh();
    } catch (e) { alert("Failed to save: " + e.message); }
    setSaving(false);
  };

  const handleFieldBlur = async (cf, value) => {
    if (value === (fieldMap[cf.id]?.field_value || "")) return;
    setFieldSaving(true);
    try {
      if (fieldMap[cf.id]) {
        await base44.entities.CustomFieldValue.update(fieldMap[cf.id].id, { field_value: value });
      } else {
        await base44.entities.CustomFieldValue.create({ user_id: user.id, field_id: cf.id, field_label: cf.field_label, field_value: value });
      }
      await logActivity("edit", `Updated custom field "${cf.field_label}" to "${value}"`);
      onRefresh();
    } catch (e) { alert("Failed to save field: " + e.message); }
    setFieldSaving(false);
  };

  const handleAddField = async () => {
    if (!newField.field_label) return;
    setFieldSaving(true);
    try {
      const cf = await base44.entities.CustomField.create({ field_label: newField.field_label, field_type: newField.field_type, is_active: true });
      if (newField.field_value) {
        await base44.entities.CustomFieldValue.create({ user_id: user.id, field_id: cf.id, field_label: cf.field_label, field_value: newField.field_value });
      }
      await logActivity("edit", `Added new custom field "${newField.field_label}"`);
      setNewField({ field_label: "", field_type: "text", field_value: "" });
      setShowNewField(false);
      onRefresh();
    } catch (e) { alert("Failed to add field: " + e.message); }
    setFieldSaving(false);
  };

  const inputClass = "w-full bg-transparent border border-[#A8A9AD]/30 px-3 py-2 text-sm text-white focus:border-[#C9A84C] focus:outline-none transition-colors";
  const labelClass = "block text-xs tracking-widest uppercase text-[#A8A9AD] mb-1.5";

  return (
    <div className="space-y-6">
      <div className="border border-[#A8A9AD]/20 bg-black p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C]">Contact Information</h3>
          <button
            onClick={() => navigate(`/admin/inbox?userId=${user.id}&userName=${encodeURIComponent(user.full_name || "user")}`)}
            className="flex items-center gap-2 px-4 py-2 bg-[#C9A84C] text-black font-bold text-xs tracking-wide uppercase hover:bg-[#E0C97A] transition-colors"
          >
            <MessageSquare size={14} /> Message User
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className={labelClass}>Phone</label><input className={inputClass} value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
          <div><label className={labelClass}>Date of Birth</label><input type="date" className={inputClass} value={form.dob} onChange={e => setForm({...form, dob: e.target.value})} /></div>
          <div className="sm:col-span-2"><label className={labelClass}>Address</label><input className={inputClass} value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></div>
          <div><label className={labelClass}>Belt Size</label><input className={inputClass} value={form.belt_size} onChange={e => setForm({...form, belt_size: e.target.value})} /></div>
          <div><label className={labelClass}>Uniform Size</label><input className={inputClass} value={form.uniform_size} onChange={e => setForm({...form, uniform_size: e.target.value})} /></div>
          <div className="sm:col-span-2"><label className={labelClass}>Medical Conditions / Allergies</label><textarea className={inputClass} rows={2} value={form.medical_conditions} onChange={e => setForm({...form, medical_conditions: e.target.value})} /></div>
        </div>
        <button onClick={handleSave} disabled={saving} className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-[#C9A84C] text-black font-bold text-sm tracking-wide uppercase hover:bg-[#E0C97A] transition-colors disabled:opacity-50">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Changes
        </button>
      </div>

      <div className="border border-[#A8A9AD]/20 bg-black p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C]">Custom Fields</h3>
          <button onClick={() => setShowNewField(!showNewField)} className="flex items-center gap-1 text-xs text-[#C9A84C] hover:text-[#E0C97A] font-medium">
            <Plus size={14} /> Add New Field
          </button>
        </div>
        {showNewField && (
          <div className="mb-4 p-4 border border-[#C9A84C]/30 bg-[#C9A84C]/5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-[#C9A84C] uppercase tracking-wide">New Custom Field</p>
              <button onClick={() => setShowNewField(false)} className="text-[#A8A9AD] hover:text-white"><X size={16} /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input className={inputClass} placeholder="Field label (e.g. School District)" value={newField.field_label} onChange={e => setNewField({...newField, field_label: e.target.value})} />
              <select className={inputClass} value={newField.field_type} onChange={e => setNewField({...newField, field_type: e.target.value})}>
                <option value="text">Text</option><option value="dropdown">Dropdown</option><option value="checkbox">Checkbox</option>
              </select>
              <input className={inputClass} placeholder="Initial value" value={newField.field_value} onChange={e => setNewField({...newField, field_value: e.target.value})} />
            </div>
            <button onClick={handleAddField} disabled={fieldSaving} className="flex items-center gap-2 px-4 py-2 bg-[#C9A84C] text-black font-bold text-xs uppercase tracking-wide hover:bg-[#E0C97A] disabled:opacity-50">
              {fieldSaving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add Field
            </button>
          </div>
        )}
        {customFields.length === 0 && !showNewField ? (
          <p className="text-sm text-[#A8A9AD]">No custom fields defined. Click "Add New Field" to create one.</p>
        ) : (
          <div className="space-y-3">
            {customFields.map(cf => (
              <div key={cf.id} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                <label className="text-sm text-[#A8A9AD]">{cf.field_label}</label>
                <input className={`${inputClass} sm:col-span-2`} key={fieldMap[cf.id]?.id || cf.id} defaultValue={fieldMap[cf.id]?.field_value || ""} onBlur={e => handleFieldBlur(cf, e.target.value)} placeholder="Enter value..." />
              </div>
            ))}
          </div>
        )}
        {fieldSaving && <p className="text-xs text-[#C9A84C] mt-2">Saving...</p>}
      </div>
    </div>
  );
}