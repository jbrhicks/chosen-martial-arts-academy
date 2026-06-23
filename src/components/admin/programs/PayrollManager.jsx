import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Plus, X, DollarSign, Clock, CheckCircle } from "lucide-react";

export default function PayrollManager() {
  const [payrolls, setPayrolls] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ instructor_id: "", pay_type: "per_class", pay_rate: "", classes_taught: "", hours_worked: "", pay_period_start: "", pay_period_end: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [p, i] = await Promise.all([
        base44.entities.Payroll.list("-created_date", 100),
        base44.entities.Instructor.list(),
      ]);
      setPayrolls(p);
      setInstructors(i);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const calculatedTotal = form.pay_type === "hourly"
    ? (parseFloat(form.hours_worked) || 0) * (parseFloat(form.pay_rate) || 0)
    : (parseInt(form.classes_taught) || 0) * (parseFloat(form.pay_rate) || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.instructor_id || !form.pay_rate) return;
    setSaving(true);
    try {
      const instructor = instructors.find(i => i.id === form.instructor_id);
      await base44.entities.Payroll.create({
        instructor_id: form.instructor_id,
        instructor_name: instructor?.name || "Unknown",
        pay_type: form.pay_type,
        pay_rate: parseFloat(form.pay_rate),
        classes_taught: parseInt(form.classes_taught) || 0,
        hours_worked: parseFloat(form.hours_worked) || 0,
        total_paid: calculatedTotal,
        pay_period_start: form.pay_period_start || undefined,
        pay_period_end: form.pay_period_end || undefined,
        status: "pending",
      });
      await base44.entities.GeneralLedger.create({
        type: "expense",
        amount: calculatedTotal,
        date: new Date().toISOString(),
        category: "payroll",
        description: `Payroll: ${instructor?.name || "Unknown"} (${form.pay_type === "hourly" ? `${form.hours_worked}hrs` : `${form.classes_taught} classes`})`,
      });
      setShowForm(false);
      setForm({ instructor_id: "", pay_type: "per_class", pay_rate: "", classes_taught: "", hours_worked: "", pay_period_start: "", pay_period_end: "" });
      load();
    } catch (e) { alert("Failed to create payroll entry."); }
    setSaving(false);
  };

  const markPaid = async (id) => {
    try { await base44.entities.Payroll.update(id, { status: "paid" }); load(); } catch (e) { alert("Failed to update."); }
  };

  const totalPending = payrolls.filter(p => p.status === "pending").reduce((s, p) => s + (p.total_paid || 0), 0);
  const totalPaid = payrolls.filter(p => p.status === "paid").reduce((s, p) => s + (p.total_paid || 0), 0);

  if (loading) return <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-[#C9A84C]" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-xl font-bold">Instructor Payroll</h2>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2.5 bg-[#C9A84C] text-black font-bold text-sm tracking-wide uppercase hover:bg-[#E0C97A] transition-colors">
          <Plus size={16} /> New Payroll Entry
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="border border-[#C9A84C]/20 bg-[#C9A84C]/5 p-5">
          <div className="flex items-center gap-2 mb-2"><Clock size={16} className="text-[#C9A84C]" /><p className="text-[10px] tracking-widest uppercase text-[#A8A9AD]">Pending Payment</p></div>
          <p className="text-2xl font-bold text-[#C9A84C]">${totalPending.toFixed(2)}</p>
        </div>
        <div className="border border-green-400/20 bg-green-400/5 p-5">
          <div className="flex items-center gap-2 mb-2"><CheckCircle size={16} className="text-green-400" /><p className="text-[10px] tracking-widest uppercase text-[#A8A9AD]">Paid This Cycle</p></div>
          <p className="text-2xl font-bold text-green-400">${totalPaid.toFixed(2)}</p>
        </div>
      </div>

      {payrolls.length === 0 ? (
        <div className="border border-[#A8A9AD]/20 bg-black p-12 text-center">
          <p className="text-[#A8A9AD]">No payroll entries yet.</p>
        </div>
      ) : (
        <div className="border border-[#A8A9AD]/20 bg-black divide-y divide-[#A8A9AD]/10">
          {payrolls.map(p => (
            <div key={p.id} className="px-4 py-3 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{p.instructor_name}</p>
                <p className="text-xs text-[#A8A9AD]">
                  {p.pay_type === "hourly" ? `${p.hours_worked} hrs @ $${p.pay_rate}/hr` : `${p.classes_taught} classes @ $${p.pay_rate}/class`}
                  {p.pay_period_start && ` • ${new Date(p.pay_period_start).toLocaleDateString()} - ${p.pay_period_end ? new Date(p.pay_period_end).toLocaleDateString() : ""}`}
                </p>
              </div>
              <span className="text-sm font-bold shrink-0">${(p.total_paid || 0).toFixed(2)}</span>
              {p.status === "pending" ? (
                <button onClick={() => markPaid(p.id)} className="text-xs text-[#C9A84C] tracking-widest uppercase font-medium hover:text-[#E0C97A] shrink-0">Mark Paid</button>
              ) : (
                <span className="text-[9px] tracking-widest uppercase text-green-400 shrink-0">Paid</span>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-md border border-[#C9A84C]/30 bg-[#0A0A0A] p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold">New Payroll Entry</h3>
              <button onClick={() => setShowForm(false)} className="text-[#A8A9AD] hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Instructor *</label>
                <select value={form.instructor_id} onChange={e => setForm({ ...form, instructor_id: e.target.value })} className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" required>
                  <option value="">Select instructor...</option>
                  {instructors.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setForm({ ...form, pay_type: "per_class" })} className={`flex-1 px-4 py-2.5 text-sm font-medium border-2 transition-colors ${form.pay_type === "per_class" ? "border-[#C9A84C] bg-[#C9A84C]/10 text-[#C9A84C]" : "border-[#A8A9AD]/20 text-[#A8A9AD]"}`}>Per Class</button>
                <button type="button" onClick={() => setForm({ ...form, pay_type: "hourly" })} className={`flex-1 px-4 py-2.5 text-sm font-medium border-2 transition-colors ${form.pay_type === "hourly" ? "border-[#C9A84C] bg-[#C9A84C]/10 text-[#C9A84C]" : "border-[#A8A9AD]/20 text-[#A8A9AD]"}`}>Hourly</button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Pay Rate ($) *</label>
                  <input type="number" value={form.pay_rate} onChange={e => setForm({ ...form, pay_rate: e.target.value })} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" required />
                </div>
                <div>
                  <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">{form.pay_type === "hourly" ? "Hours Worked" : "Classes Taught"}</label>
                  <input type="number" value={form.pay_type === "hourly" ? form.hours_worked : form.classes_taught} onChange={e => setForm({ ...form, [form.pay_type === "hourly" ? "hours_worked" : "classes_taught"]: e.target.value })} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Pay Period Start</label>
                  <input type="date" value={form.pay_period_start} onChange={e => setForm({ ...form, pay_period_start: e.target.value })} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Pay Period End</label>
                  <input type="date" value={form.pay_period_end} onChange={e => setForm({ ...form, pay_period_end: e.target.value })} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
                </div>
              </div>
              <div className="border border-[#C9A84C]/20 bg-[#C9A84C]/5 p-4 flex items-center justify-between">
                <span className="text-sm text-[#A8A9AD]">Total Pay</span>
                <span className="text-xl font-bold text-[#C9A84C]">${calculatedTotal.toFixed(2)}</span>
              </div>
              <button type="submit" disabled={saving} className="w-full bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase py-3 hover:bg-[#E0C97A] transition-colors disabled:opacity-50">
                {saving ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Create Entry"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}