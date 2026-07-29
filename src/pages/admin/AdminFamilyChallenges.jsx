import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Loader2, Plus, Trophy, Trash2, X, Calendar } from "lucide-react";

const TYPES = [
  { value: "attendance_count", label: "Combined Attendance", unit: "classes" },
  { value: "goal_completions", label: "Goals Completed", unit: "goals" },
  { value: "class_streak", label: "Class Streak", unit: "days" },
  { value: "custom", label: "Custom", unit: "units" },
];

export default function AdminFamilyChallenges() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", challenge_type: "attendance_count", target_value: 100, unit_label: "classes", start_date: "", end_date: "", status: "active" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const data = await base44.entities.FamilyChallenge.list("-created_date");
      setChallenges(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const createChallenge = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await base44.entities.FamilyChallenge.create({
        ...form,
        target_value: Number(form.target_value) || 100,
        start_date: form.start_date || undefined,
        end_date: form.end_date || undefined,
        created_by_id: user.id,
        created_by_name: user.full_name,
      });
      setShowForm(false);
      setForm({ title: "", description: "", challenge_type: "attendance_count", target_value: 100, unit_label: "classes", start_date: "", end_date: "", status: "active" });
      load();
    } catch (e) { alert("Failed to create challenge."); }
    setSaving(false);
  };

  const updateStatus = async (ch, status) => {
    await base44.entities.FamilyChallenge.update(ch.id, { status });
    load();
  };

  const deleteChallenge = async (ch) => {
    if (!confirm(`Delete "${ch.title}"? This cannot be undone.`)) return;
    await base44.entities.FamilyChallenge.delete(ch.id);
    load();
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-[#C9A84C]" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs tracking-widest uppercase text-[#C9A84C] mb-2">Engagement</p>
          <h1 className="text-3xl font-bold">Family Challenges</h1>
          <p className="text-sm text-[#A8A9AD] mt-1">Create academy-wide challenges for families to compete in together.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase hover:bg-[#E0C97A] transition-colors"
        >
          <Plus size={16} /> New Challenge
        </button>
      </div>

      {challenges.length === 0 ? (
        <div className="border border-[#A8A9AD]/20 p-12 text-center">
          <Trophy size={32} className="mx-auto text-[#A8A9AD] mb-3" />
          <p className="text-[#A8A9AD]">No challenges yet. Create your first family challenge!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {challenges.map((ch) => {
            const typeLabel = TYPES.find((t) => t.value === ch.challenge_type)?.label || ch.challenge_type;
            return (
              <div key={ch.id} className={`border bg-black p-5 ${ch.status === "active" ? "border-[#C9A84C]/30" : "border-[#A8A9AD]/20"}`}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className={`text-[9px] tracking-widest uppercase px-2 py-0.5 ${ch.status === "active" ? "text-green-400 border border-green-400/30" : "text-[#A8A9AD] border border-[#A8A9AD]/20"}`}>{ch.status}</span>
                      <span className="text-[9px] tracking-widest uppercase text-[#C9A84C]">{typeLabel}</span>
                    </div>
                    <h3 className="font-bold text-sm mb-1">{ch.title}</h3>
                    {ch.description && <p className="text-xs text-[#A8A9AD]">{ch.description}</p>}
                    <div className="flex items-center gap-4 mt-2 text-xs text-[#A8A9AD]/70">
                      <span>Target: <strong className="text-white">{ch.target_value} {ch.unit_label}</strong></span>
                      {ch.start_date && <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(ch.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>}
                      {ch.end_date && <span>– {new Date(ch.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {ch.status === "active" ? (
                      <button onClick={() => updateStatus(ch, "completed")} className="px-3 py-1.5 text-[10px] tracking-widest uppercase border border-green-500/30 text-green-400 hover:bg-green-500/10 transition-colors">Complete</button>
                    ) : (
                      <button onClick={() => updateStatus(ch, "active")} className="px-3 py-1.5 text-[10px] tracking-widest uppercase border border-[#C9A84C]/30 text-[#C9A84C] hover:bg-[#C9A84C]/10 transition-colors">Reactivate</button>
                    )}
                    <button onClick={() => deleteChallenge(ch)} className="p-1.5 text-[#A8A9AD] hover:text-red-400 transition-colors" title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto border border-[#C9A84C]/30 bg-[#0A0A0A] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold">New Family Challenge</h3>
              <button onClick={() => setShowForm(false)} className="text-[#A8A9AD] hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={createChallenge} className="space-y-4">
              <div>
                <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Title *</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" placeholder="e.g. 100 Combined Classes Q3" required />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none resize-none" placeholder="Challenge details..." />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Challenge Type *</label>
                <select value={form.challenge_type} onChange={(e) => { const t = TYPES.find(t => t.value === e.target.value); setForm({ ...form, challenge_type: e.target.value, unit_label: t?.unit || "units" }); }} className="w-full bg-black border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none">
                  {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Target Value *</label>
                  <input type="number" min="1" value={form.target_value} onChange={(e) => setForm({ ...form, target_value: e.target.value })} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" required />
                </div>
                <div>
                  <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Unit Label</label>
                  <input value={form.unit_label} onChange={(e) => setForm({ ...form, unit_label: e.target.value })} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" placeholder="classes" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Start Date</label>
                  <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="w-full bg-black border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">End Date</label>
                  <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="w-full bg-black border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
                </div>
              </div>
              <button type="submit" disabled={saving} className="w-full bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase py-3 hover:bg-[#E0C97A] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <Loader2 size={16} className="animate-spin" /> : "Create Challenge"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}