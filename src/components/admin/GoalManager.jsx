import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { BELT_RANKS } from "@/lib/constants";
import { Loader2, Plus, X, Trash2, Edit2, Save } from "lucide-react";

export default function GoalManager() {
  const [selectedRank, setSelectedRank] = useState("White");
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [form, setForm] = useState({ title: "", description: "", category: "Technique", is_required: true });
  const [saving, setSaving] = useState(false);

  const loadGoals = async (rank) => {
    setLoading(true);
    try {
      const data = await base44.entities.ProgressGoal.filter({ belt_rank: rank });
      setGoals(data.sort((a, b) => (a.display_order || 0) - (b.display_order || 0)));
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadGoals(selectedRank); }, [selectedRank]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      if (editingGoal) {
        await base44.entities.ProgressGoal.update(editingGoal.id, { ...form });
      } else {
        await base44.entities.ProgressGoal.create({ ...form, belt_rank: selectedRank });
      }
      setShowForm(false);
      setEditingGoal(null);
      setForm({ title: "", description: "", category: "Technique", is_required: true });
      loadGoals(selectedRank);
    } catch (e) {
      alert("Failed to save goal.");
    }
    setSaving(false);
  };

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setForm({ title: goal.title, description: goal.description || "", category: goal.category, is_required: goal.is_required });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this goal?")) return;
    try {
      await base44.entities.ProgressGoal.delete(id);
      loadGoals(selectedRank);
    } catch (e) { alert("Failed to delete."); }
  };

  const categories = ["Technique", "Kata", "Sparring", "Fitness", "Knowledge"];

  return (
    <div className="space-y-4">
      {/* Belt rank selector */}
      <div className="flex flex-wrap gap-2">
        {BELT_RANKS.map((rank) => (
          <button
            key={rank}
            onClick={() => setSelectedRank(rank)}
            className={`px-3 py-1.5 text-xs font-medium tracking-wide transition-colors ${
              selectedRank === rank
                ? "bg-[#C9A84C] text-black"
                : "border border-[#A8A9AD]/20 text-[#A8A9AD] hover:text-white hover:border-[#A8A9AD]/40"
            }`}
          >
            {rank}
          </button>
        ))}
      </div>

      {/* Add button */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-[#A8A9AD]">{goals.length} goal{goals.length !== 1 ? "s" : ""} for <span className="text-white font-medium">{selectedRank}</span></p>
        <button
          onClick={() => { setShowForm(true); setEditingGoal(null); setForm({ title: "", description: "", category: "Technique", is_required: true }); }}
          className="flex items-center gap-2 px-4 py-2 bg-[#C9A84C] text-black font-bold text-xs tracking-wide uppercase hover:bg-[#E0C97A] transition-colors"
        >
          <Plus size={14} /> Add Goal
        </button>
      </div>

      {/* Goal form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => { setShowForm(false); setEditingGoal(null); }}>
          <div className="w-full max-w-md border border-[#C9A84C]/30 bg-[#0A0A0A] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold">{editingGoal ? "Edit Goal" : "New Goal"}</h3>
              <button onClick={() => { setShowForm(false); setEditingGoal(null); }} className="text-[#A8A9AD] hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Title *</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none"
                  placeholder="e.g. Front Kick Technique"
                  required
                />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none resize-none"
                  placeholder="What the student needs to demonstrate..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none"
                  >
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.is_required}
                      onChange={(e) => setForm({ ...form, is_required: e.target.checked })}
                      className="accent-[#C9A84C] w-4 h-4"
                    />
                    <span className="text-sm text-white">Required for promotion</span>
                  </label>
                </div>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase py-3 hover:bg-[#E0C97A] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <><Save size={14} /> {editingGoal ? "Update Goal" : "Create Goal"}</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Goals list */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-[#C9A84C]" /></div>
      ) : goals.length === 0 ? (
        <div className="border border-[#A8A9AD]/20 bg-black p-12 text-center">
          <p className="text-[#A8A9AD]">No goals set for {selectedRank} yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map((cat) => {
            const catGoals = goals.filter((g) => g.category === cat);
            if (catGoals.length === 0) return null;
            return (
              <div key={cat}>
                <p className="text-xs tracking-widest uppercase text-[#C9A84C] mb-2 mt-4">{cat}</p>
                {catGoals.map((goal) => (
                  <div key={goal.id} className="border border-[#A8A9AD]/20 bg-black p-4 flex items-center justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{goal.title}</p>
                        {goal.is_required && <span className="text-[9px] tracking-widest uppercase text-[#C9A84C] border border-[#C9A84C]/30 px-1.5 py-0.5">Required</span>}
                      </div>
                      {goal.description && <p className="text-xs text-[#A8A9AD] mt-1">{goal.description}</p>}
                    </div>
                    <div className="flex items-center gap-2 ml-4 shrink-0">
                      <button onClick={() => handleEdit(goal)} className="p-2 text-[#A8A9AD] hover:text-[#C9A84C] transition-colors"><Edit2 size={14} /></button>
                      <button onClick={() => handleDelete(goal.id)} className="p-2 text-[#A8A9AD] hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}