import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { X, Loader2, Users, Award, Shield, Calendar, Target, ToggleLeft, ToggleRight, Trophy } from "lucide-react";

const RANKS = ["White", "White w/ Black Stripe", "Orange", "Orange w/ White Stripe", "Green", "Green w/ White Stripe", "Brown", "Brown w/ White Stripe", "Red", "Red w/ White Stripe", "Blue", "1st Degree Black Belt", "2nd Degree Black Belt", "3rd Degree Black Belt", "4th Degree Master"];

const GOAL_TYPES = [
  { value: "attendance", label: "Attendance (auto-tracked from check-ins)", icon: Calendar },
  { value: "task", label: "Task / Reps (manual daily logging)", icon: Target },
  { value: "media_proof", label: "Media Proof (photo/video upload)", icon: Award },
];

export default function ChallengeBuilderForm({ onClose, onCreated }) {
  const { user } = useAuth();
  const [programs, setPrograms] = useState([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "",
    target_audience_type: "all", target_program_id: "", target_rank: "",
    min_age: 0, max_age: 100,
    enrollment_type: "opt_in",
    start_date: "", end_date: "",
    goal_type: "attendance", target_goal_value: 10, unit_label: "classes",
    has_leaderboard: true,
    badge_name: "", badge_graphic_url: "",
    status: "active",
  });

  useEffect(() => {
    base44.entities.Program.list().then(setPrograms).catch(() => {});
  }, []);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await base44.functions.invoke("createChallenge", form);
      onCreated();
    } catch (e) { alert("Failed to create challenge."); }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto border border-[#C9A84C]/30 bg-[#0A0A0A] p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold">Challenge Builder</h3>
          <button onClick={onClose} className="text-[#A8A9AD] hover:text-white"><X size={18} /></button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Challenge Title *</label>
            <input value={form.title} onChange={(e) => set("title", e.target.value)} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" placeholder="e.g. Summer Training Challenge" required />
          </div>
          <div>
            <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Description</label>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none resize-none" placeholder="What's the challenge?" />
          </div>

          {/* Target Audience */}
          <div>
            <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2 flex items-center gap-1"><Users size={11} /> Target Audience *</label>
            <select value={form.target_audience_type} onChange={(e) => set("target_audience_type", e.target.value)} className="w-full bg-black border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none">
              <option value="all">All Students (Entire School)</option>
              <option value="program">Specific Program</option>
              <option value="rank">Specific Rank</option>
              <option value="age_group">Age Range</option>
              <option value="family">All Families</option>
            </select>
          </div>

          {form.target_audience_type === "program" && (
            <div>
              <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Program *</label>
              <select value={form.target_program_id} onChange={(e) => { const p = programs.find(p => p.id === e.target.value); set("target_program_id", e.target.value); set("target_program_name", p?.program_name || p?.name || ""); }} className="w-full bg-black border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" required>
                <option value="">Select program...</option>
                {programs.map((p) => <option key={p.id} value={p.id}>{p.program_name || p.name}</option>)}
              </select>
            </div>
          )}

          {form.target_audience_type === "rank" && (
            <div>
              <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Belt Rank *</label>
              <select value={form.target_rank} onChange={(e) => set("target_rank", e.target.value)} className="w-full bg-black border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" required>
                <option value="">Select rank...</option>
                {RANKS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          )}

          {form.target_audience_type === "age_group" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Min Age *</label>
                <input type="number" min="0" max="100" value={form.min_age} onChange={(e) => set("min_age", e.target.value)} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" required />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Max Age *</label>
                <input type="number" min="0" max="100" value={form.max_age} onChange={(e) => set("max_age", e.target.value)} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" required />
              </div>
            </div>
          )}

          {/* Enrollment Type */}
          <div>
            <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Enrollment Type *</label>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => set("enrollment_type", "auto")} className={`p-3 border text-left transition-colors ${form.enrollment_type === "auto" ? "border-[#C9A84C] bg-[#C9A84C]/10" : "border-[#A8A9AD]/30"}`}>
                <p className="text-sm font-bold">Auto-Enroll</p>
                <p className="text-xs text-[#A8A9AD] mt-0.5">All matching students are automatically enrolled.</p>
              </button>
              <button type="button" onClick={() => set("enrollment_type", "opt_in")} className={`p-3 border text-left transition-colors ${form.enrollment_type === "opt_in" ? "border-[#C9A84C] bg-[#C9A84C]/10" : "border-[#A8A9AD]/30"}`}>
                <p className="text-sm font-bold">Opt-In</p>
                <p className="text-xs text-[#A8A9AD] mt-0.5">Students choose to join from their app.</p>
              </button>
            </div>
          </div>

          {/* Goal Type */}
          <div>
            <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2 flex items-center gap-1"><Target size={11} /> Goal Metric *</label>
            <select value={form.goal_type} onChange={(e) => set("goal_type", e.target.value)} className="w-full bg-black border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none">
              {GOAL_TYPES.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Target Goal *</label>
              <input type="number" min="1" value={form.target_goal_value} onChange={(e) => set("target_goal_value", e.target.value)} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" required />
            </div>
            <div>
              <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Unit Label</label>
              <input value={form.unit_label} onChange={(e) => set("unit_label", e.target.value)} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" placeholder="classes, reps, days..." />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2 flex items-center gap-1"><Calendar size={11} /> Start Date</label>
              <input type="date" value={form.start_date} onChange={(e) => set("start_date", e.target.value)} className="w-full bg-black border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2 flex items-center gap-1"><Calendar size={11} /> End Date</label>
              <input type="date" value={form.end_date} onChange={(e) => set("end_date", e.target.value)} className="w-full bg-black border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
            </div>
          </div>

          {/* Leaderboard Toggle */}
          <div className="border border-[#A8A9AD]/30 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold flex items-center gap-1"><Trophy size={14} className="text-[#C9A84C]" /> Public Leaderboard</p>
                <p className="text-xs text-[#A8A9AD] mt-1">ON for competitive adult programs. OFF for sensitive youth programs.</p>
              </div>
              <button type="button" onClick={() => set("has_leaderboard", !form.has_leaderboard)} className="shrink-0">
                {form.has_leaderboard
                  ? <ToggleRight size={40} className="text-[#C9A84C]" />
                  : <ToggleLeft size={40} className="text-[#A8A9AD]" />}
              </button>
            </div>
          </div>

          {/* Reward Badge */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2 flex items-center gap-1"><Award size={11} /> Badge Name</label>
              <input value={form.badge_name} onChange={(e) => set("badge_name", e.target.value)} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" placeholder="Summer Champion Patch" />
            </div>
            <div>
              <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Badge Image URL</label>
              <input value={form.badge_graphic_url} onChange={(e) => set("badge_graphic_url", e.target.value)} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" placeholder="https://..." />
            </div>
          </div>

          <button type="submit" disabled={saving} className="w-full bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase py-3 hover:bg-[#E0C97A] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <><Shield size={16} /> Publish Challenge</>}
          </button>
        </form>
      </div>
    </div>
  );
}