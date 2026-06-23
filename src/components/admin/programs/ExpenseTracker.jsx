import { useEffect, useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Plus, X, Upload, Trash2, FileImage } from "lucide-react";

const CATEGORIES = ["rent", "payroll", "utilities", "equipment", "marketing", "insurance", "pro_shop_inventory", "other"];

export default function ExpenseTracker() {
  const [expenses, setExpenses] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ vendor_name: "", amount: "", date: new Date().toISOString().split("T")[0], category: "other", description: "", program_id: "", receipt_image: "" });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const load = async () => {
    try {
      const [e, p] = await Promise.all([
        base44.entities.Expense.list("-date", 100),
        base44.entities.Program.list(),
      ]);
      setExpenses(e);
      setPrograms(p);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm({ ...form, receipt_image: file_url });
    } catch (e) { alert("Failed to upload receipt."); }
    setUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.vendor_name || !form.amount || !form.date) return;
    setSaving(true);
    try {
      const expenseData = {
        vendor_name: form.vendor_name,
        amount: parseFloat(form.amount),
        date: form.date,
        category: form.category,
        description: form.description,
        program_id: form.program_id || undefined,
        receipt_image: form.receipt_image || undefined,
      };
      await base44.entities.Expense.create(expenseData);
      await base44.entities.GeneralLedger.create({
        type: "expense",
        amount: parseFloat(form.amount),
        date: new Date(form.date).toISOString(),
        category: form.category,
        description: `${form.vendor_name} - ${form.description || ""}`,
        program_id: form.program_id || undefined,
      });
      setShowForm(false);
      setForm({ vendor_name: "", amount: "", date: new Date().toISOString().split("T")[0], category: "other", description: "", program_id: "", receipt_image: "" });
      load();
    } catch (e) { alert("Failed to save expense."); }
    setSaving(false);
  };

  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);

  if (loading) return <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-[#C9A84C]" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold">Expense & Vendor Tracking</h2>
          <p className="text-xs text-[#A8A9AD] mt-1">Total: ${totalExpenses.toFixed(2)}</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2.5 bg-[#C9A84C] text-black font-bold text-sm tracking-wide uppercase hover:bg-[#E0C97A] transition-colors">
          <Plus size={16} /> Add Expense
        </button>
      </div>

      {expenses.length === 0 ? (
        <div className="border border-[#A8A9AD]/20 bg-black p-12 text-center">
          <p className="text-[#A8A9AD]">No expenses recorded yet.</p>
        </div>
      ) : (
        <div className="border border-[#A8A9AD]/20 bg-black divide-y divide-[#A8A9AD]/10">
          {expenses.map(exp => (
            <div key={exp.id} className="px-4 py-3 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium">{exp.vendor_name}</p>
                  <span className="text-[9px] tracking-widest uppercase text-[#A8A9AD] border border-[#A8A9AD]/20 px-2 py-0.5">{exp.category}</span>
                  {exp.receipt_image && <FileImage size={12} className="text-[#C9A84C]" />}
                </div>
                {exp.description && <p className="text-xs text-[#A8A9AD] mt-0.5">{exp.description}</p>}
                <p className="text-xs text-[#A8A9AD] mt-0.5">{new Date(exp.date).toLocaleDateString()}</p>
              </div>
              <span className="text-sm font-bold text-red-400 shrink-0">${(exp.amount || 0).toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-md border border-[#C9A84C]/30 bg-[#0A0A0A] p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold">Add Expense</h3>
              <button onClick={() => setShowForm(false)} className="text-[#A8A9AD] hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Vendor Name *</label>
                <input value={form.vendor_name} onChange={e => setForm({ ...form, vendor_name: e.target.value })} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Amount ($) *</label>
                  <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" required />
                </div>
                <div>
                  <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Date *</label>
                  <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" required />
                </div>
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Category</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Program (optional)</label>
                <select value={form.program_id} onChange={e => setForm({ ...form, program_id: e.target.value })} className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none">
                  <option value="">None</option>
                  {programs.map(p => <option key={p.id} value={p.id}>{p.program_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Description</label>
                <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Receipt Image</label>
                {form.receipt_image ? (
                  <div className="flex items-center gap-3">
                    <img src={form.receipt_image} alt="Receipt" className="w-20 h-20 object-cover border border-[#A8A9AD]/30" />
                    <button onClick={() => setForm({ ...form, receipt_image: "" })} className="text-red-400 hover:text-red-300"><Trash2 size={16} /></button>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-[#A8A9AD]/30 text-sm text-[#A8A9AD] hover:text-white hover:border-[#C9A84C] transition-colors w-full justify-center disabled:opacity-50">
                    {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Upload Receipt
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => handleUpload(e.target.files[0])} />
              </div>
              <button type="submit" disabled={saving} className="w-full bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase py-3 hover:bg-[#E0C97A] transition-colors disabled:opacity-50">
                {saving ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Save Expense"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}