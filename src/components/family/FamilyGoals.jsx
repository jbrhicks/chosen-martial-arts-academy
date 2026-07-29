import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useFamily } from "@/lib/FamilyContext";
import { useAuth } from "@/lib/AuthContext";
import { Loader2, Plus, Target, Check, Trash2, Calendar } from "lucide-react";

const CATEGORIES = ["Technique", "Kata", "Sparring", "Fitness", "Knowledge", "Family Challenge"];

export default function FamilyGoals() {
  const { familyGroup, hasFamily } = useFamily();
  const { user } = useAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Family Challenge");
  const [targetDate, setTargetDate] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!familyGroup?.id) { setLoading(false); return; }
    try {
      const data = await base44.entities.FamilyGoal.filter({ family_id: familyGroup.id });
      setGoals(data.sort((a, b) => {
        if (a.status !== b.status) return a.status === "active" ? -1 : 1;
        return new Date(b.created_date || 0) - new Date(a.created_date || 0);
      }));
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [familyGroup?.id]);

  const createGoal = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await base44.entities.FamilyGoal.create({
        family_id: familyGroup.id,
        title: title.trim(),
        description: description.trim(),
        category,
        target_date: targetDate || undefined,
        status: "active",
        created_by_id: user.id,
        created_by_name: user.full_name,
      });
      setShowForm(false);
      setTitle(""); setDescription(""); setTargetDate("");
      load();
    } catch (e) { alert("Failed to create goal."); }
    setSaving(false);
  };

  const completeGoal = async (g) => {
    await base44.entities.FamilyGoal.update(g.id, { status: "completed" });
    load();
  };

  const deleteGoal = async (g) => {
    await base44.entities.FamilyGoal.delete(g.id);
    load();
  };

  if (!hasFamily) {
    return <div className="text-center py-20 text-[#A8A9AD] text-sm">Create or join a family to set shared goals.</div>;
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-[#C9A84C]" /></div>;

  const active = goals.filter(g => g.status === "active");
  const completed = goals.filter(g => g.status === "completed");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold mb-1">Family Training Goals</h2>
          <p className="text-sm text-[#A8A9AD]">Set and track martial arts goals together.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#C9A84C] text-black font-bold text-xs tracking-widest uppercase hover:bg-[#E0C97A] transition-colors"
        >
          <Plus size={14} /> New Goal
        </button>
      </div>

      {showForm && (
        <form onSubmit={createGoal} className="border border-[#C9A84C]/30 bg-black p-6 space-y-4">
          <div>
            <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Goal Title *</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none"
              placeholder="e.g. Master the first 3 forms together"
              required
            />
          </div>
          <div>
            <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none"
              placeholder="What does success look like?"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-black border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Target Date</label>
              <input
                type="date"
                value={targetDate}
                onChange={e => setTargetDate(e.target.value)}
                className="w-full bg-black border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase py-3 hover:bg-[#E0C97A] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : "Create Goal"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 border border-[#A8A9AD]/30 text-[#A8A9AD] hover:text-white text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {active.length > 0 && (
        <div>
          <h3 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C] mb-3">Active Goals</h3>
          <div className="space-y-3">
            {active.map(g => (
              <div key={g.id} className="border border-[#A8A9AD]/20 bg-black p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <Target size={18} className="text-[#C9A84C] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{g.title}</p>
                      {g.description && <p className="text-xs text-[#A8A9AD] mt-1">{g.description}</p>}
                      <div className="flex items-center gap-3 mt-2 text-xs text-[#A8A9AD]/70">
                        <span className="text-[#C9A84C]">{g.category}</span>
                        {g.target_date && (
                          <span className="flex items-center gap-1">
                            <Calendar size={10} /> {new Date(g.target_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        )}
                        {g.created_by_name && <span>By {g.created_by_name}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => completeGoal(g)} className="p-2 text-green-400 hover:bg-green-400/10 transition-colors" title="Mark complete">
                      <Check size={16} />
                    </button>
                    <button onClick={() => deleteGoal(g)} className="p-2 text-[#A8A9AD] hover:text-red-400 transition-colors" title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {completed.length > 0 && (
        <div>
          <h3 className="text-sm font-bold tracking-widest uppercase text-[#A8A9AD] mb-3">Completed</h3>
          <div className="space-y-2">
            {completed.map(g => (
              <div key={g.id} className="border border-[#A8A9AD]/10 bg-black/50 p-3 flex items-center gap-3 opacity-60">
                <Check size={16} className="text-green-400 shrink-0" />
                <p className="text-sm line-through flex-1">{g.title}</p>
                <button onClick={() => deleteGoal(g)} className="p-1 text-[#A8A9AD] hover:text-red-400">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {active.length === 0 && completed.length === 0 && !showForm && (
        <div className="border border-[#A8A9AD]/20 p-8 text-center">
          <Target size={28} className="mx-auto text-[#A8A9AD]/40 mb-2" />
          <p className="text-[#A8A9AD] text-sm">No goals yet. Create your first family training goal!</p>
        </div>
      )}
    </div>
  );
}