import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import ProgramCard from "./ProgramCard";
import { Loader2, Plus, X } from "lucide-react";
import { BELT_RANKS } from "@/lib/constants";

export default function ProgramOverview({ onSelect }) {
  const [programs, setPrograms] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ program_name: "", age_group: "Youth", default_monthly_rate: 120, max_capacity: 25, description: "", age_minimum: 0, age_maximum: 0, prerequisite_rank: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [p, e] = await Promise.all([
        base44.entities.Program.list(),
        base44.entities.Enrollment.filter({ status: "active" }),
      ]);
      setPrograms(p);
      setEnrollments(e);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.program_name.trim()) return;
    setSaving(true);
    try {
      await base44.entities.Program.create({ ...form, status: "active" });
      setShowAdd(false);
      setForm({ program_name: "", age_group: "Youth", default_monthly_rate: 120, max_capacity: 25, description: "", age_minimum: 0, age_maximum: 0, prerequisite_rank: "" });
      load();
    } catch (e) { alert("Failed to create program."); }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-[#C9A84C]" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2.5 bg-[#C9A84C] text-black font-bold text-sm tracking-wide uppercase hover:bg-[#E0C97A] transition-colors">
          <Plus size={16} /> Add Program
        </button>
      </div>

      {programs.length === 0 ? (
        <div className="border border-[#A8A9AD]/20 bg-black p-12 text-center">
          <p className="text-[#A8A9AD]">No programs yet. Click "Add Program" to create one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {programs.map(p => <ProgramCard key={p.id} program={p} enrollments={enrollments} onClick={() => onSelect(p)} />)}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="w-full max-w-md border border-[#C9A84C]/30 bg-[#0A0A0A] p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold">Add Program</h3>
              <button onClick={() => setShowAdd(false)} className="text-[#A8A9AD] hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Program Name *</label>
                <input value={form.program_name} onChange={e => setForm({ ...form, program_name: e.target.value })} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" placeholder="e.g. Tang Soo Do (Youth)" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Age Group</label>
                  <select value={form.age_group} onChange={e => setForm({ ...form, age_group: e.target.value })} className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none">
                    <option value="Youth">Youth</option>
                    <option value="Teen/Adult">Teen/Adult</option>
                    <option value="All Ages">All Ages</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Monthly Rate ($)</label>
                  <input type="number" value={form.default_monthly_rate} onChange={e => setForm({ ...form, default_monthly_rate: parseFloat(e.target.value) || 0 })} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Max Capacity</label>
                <input type="number" value={form.max_capacity} onChange={e => setForm({ ...form, max_capacity: parseInt(e.target.value) || 0 })} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Min Age (0 = none)</label>
                  <input type="number" value={form.age_minimum} onChange={e => setForm({ ...form, age_minimum: parseInt(e.target.value) || 0 })} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Max Age (0 = none)</label>
                  <input type="number" value={form.age_maximum} onChange={e => setForm({ ...form, age_maximum: parseInt(e.target.value) || 0 })} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Prerequisite Rank (blank = none)</label>
                <select value={form.prerequisite_rank} onChange={e => setForm({ ...form, prerequisite_rank: e.target.value })} className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none">
                  <option value="">No prerequisite</option>
                  {BELT_RANKS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <button type="submit" disabled={saving} className="w-full bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase py-3 hover:bg-[#E0C97A] transition-colors disabled:opacity-50">
                {saving ? "Creating..." : "Create Program"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}