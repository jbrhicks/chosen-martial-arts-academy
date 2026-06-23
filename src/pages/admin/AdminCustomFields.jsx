import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Plus, Trash2, GripVertical, X, Check } from "lucide-react";

export default function AdminCustomFields() {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ field_label: "", field_type: "text", is_required: false, dropdown_options: "", display_order: 0 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const data = await base44.entities.CustomField.list();
      data.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
      setFields(data);
    } catch (e) {}
    setLoading(false);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ field_label: "", field_type: "text", is_required: false, dropdown_options: "", display_order: fields.length });
    setShowForm(true);
  };

  const openEdit = (field) => {
    setEditing(field);
    setForm({ field_label: field.field_label, field_type: field.field_type, is_required: field.is_required, dropdown_options: field.dropdown_options || "", display_order: field.display_order || 0 });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.field_label) return;
    setSaving(true);
    try {
      if (editing) {
        await base44.entities.CustomField.update(editing.id, form);
      } else {
        await base44.entities.CustomField.create(form);
      }
      setShowForm(false);
      load();
    } catch (e) { alert("Failed to save field."); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this custom field?")) return;
    try {
      await base44.entities.CustomField.delete(id);
      load();
    } catch (e) { alert("Failed to delete."); }
  };

  const typeIcon = (type) => {
    if (type === "dropdown") return "Dropdown";
    if (type === "checkbox") return "Checkbox";
    return "Text";
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-[#C9A84C]" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs tracking-widest uppercase text-[#C9A84C] mb-2">Registration Builder</p>
          <h1 className="text-3xl font-bold">Custom Fields</h1>
          <p className="text-sm text-[#A8A9AD] mt-2">Create custom registration fields that appear in the onboarding wizard.</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-5 py-2.5 bg-[#C9A84C] text-black font-bold text-sm tracking-wide uppercase hover:bg-[#E0C97A] transition-colors">
          <Plus size={18} /> Add Field
        </button>
      </div>

      {fields.length === 0 ? (
        <div className="border border-[#A8A9AD]/20 p-12 text-center">
          <Plus size={32} className="text-[#A8A9AD] mx-auto mb-3" />
          <p className="text-[#A8A9AD]">No custom fields yet. Create one to add it to the registration wizard.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={field.id} className="border border-[#A8A9AD]/20 bg-black p-5 flex items-center gap-4">
              <GripVertical size={18} className="text-[#A8A9AD]/40 shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <p className="text-sm font-bold">{field.field_label}</p>
                  {field.is_required && <span className="text-[10px] tracking-widest uppercase text-[#C9A84C] border border-[#C9A84C]/30 px-2 py-0.5">Required</span>}
                </div>
                <p className="text-xs text-[#A8A9AD] mt-1">{typeIcon(field.field_type)}{field.dropdown_options ? `: ${field.dropdown_options}` : ""}</p>
              </div>
              <button onClick={() => openEdit(field)} className="text-xs text-[#A8A9AD] hover:text-[#C9A84C] tracking-widest uppercase">Edit</button>
              <button onClick={() => handleDelete(field.id)} className="text-[#A8A9AD] hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-md border border-[#C9A84C]/30 bg-[#0A0A0A] p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold">{editing ? "Edit Field" : "New Custom Field"}</h3>
              <button onClick={() => setShowForm(false)} className="text-[#A8A9AD] hover:text-white"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Field Label *</label>
                <input type="text" value={form.field_label} onChange={e => setForm({ ...form, field_label: e.target.value })} placeholder="e.g., How did you hear about us?" className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Field Type *</label>
                <select value={form.field_type} onChange={e => setForm({ ...form, field_type: e.target.value })} className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none">
                  <option value="text">Text Input</option>
                  <option value="dropdown">Dropdown</option>
                  <option value="checkbox">Checkbox</option>
                </select>
              </div>
              {form.field_type === "dropdown" && (
                <div>
                  <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Dropdown Options (comma-separated)</label>
                  <input type="text" value={form.dropdown_options} onChange={e => setForm({ ...form, dropdown_options: e.target.value })} placeholder="Option 1, Option 2, Option 3" className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm">Required Field</span>
                <button onClick={() => setForm({ ...form, is_required: !form.is_required })} className={`w-12 h-6 rounded-full transition-colors ${form.is_required ? "bg-[#C9A84C]" : "bg-[#A8A9AD]/30"}`}>
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform mx-0.5 ${form.is_required ? "translate-x-6" : "translate-x-0"}`} />
                </button>
              </div>
              <button onClick={handleSave} disabled={saving || !form.field_label} className="w-full bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase py-3 hover:bg-[#E0C97A] transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <><Check size={16} /> {editing ? "Update Field" : "Create Field"}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}