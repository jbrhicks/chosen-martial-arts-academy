import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { BELT_RANKS } from "@/lib/constants";
import BeltBadge from "@/components/BeltBadge";
import { Loader2, CheckCircle, Circle, Clock, Save } from "lucide-react";

export default function StudentProgressView({ student }) {
  const [goals, setGoals] = useState([]);
  const [progress, setProgress] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);

  const rank = student.belt_rank || "White";

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [g, p, a] = await Promise.all([
          base44.entities.ProgressGoal.filter({ belt_rank: rank }),
          base44.entities.StudentProgress.filter({ user_id: student.id, belt_rank: rank }),
          base44.entities.AttendanceRecord.filter({ user_id: student.id }),
        ]);
        setGoals(g);
        setProgress(p);
        setAttendance(a);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [student.id, rank]);

  const getProgressRecord = (goalId) => progress.find((p) => p.goal_id === goalId);

  const updateProgress = async (goal, status, notes) => {
    setSaving(goal.id);
    try {
      const existing = getProgressRecord(goal.id);
      const data = {
        user_id: student.id,
        user_name: student.full_name,
        goal_id: goal.id,
        goal_title: goal.title,
        belt_rank: rank,
        status,
        admin_notes: notes || "",
        completed_date: status === "completed" ? new Date().toISOString().split("T")[0] : undefined,
      };

      if (existing) {
        await base44.entities.StudentProgress.update(existing.id, data);
        setProgress(progress.map((p) => p.id === existing.id ? { ...p, ...data } : p));
      } else {
        const created = await base44.entities.StudentProgress.create(data);
        setProgress([...progress, created]);
      }
    } catch (e) {
      alert("Failed to update progress.");
    }
    setSaving(null);
  };

  const completedCount = goals.filter((g) => getProgressRecord(g.id)?.status === "completed").length;
  const totalRequired = goals.filter((g) => g.is_required).length;
  const completedRequired = goals.filter((g) => g.is_required && getProgressRecord(g.id)?.status === "completed").length;

  const statusOptions = [
    { value: "not_started", label: "Not Started", icon: Circle, color: "text-[#A8A9AD]" },
    { value: "in_progress", label: "In Progress", icon: Clock, color: "text-[#C9A84C]" },
    { value: "completed", label: "Completed", icon: CheckCircle, color: "text-green-400" },
  ];

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-[#C9A84C]" /></div>;
  }

  return (
    <div className="border border-[#C9A84C]/30 bg-black p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center text-lg font-bold text-[#C9A84C]">
            {student.full_name?.charAt(0) || "?"}
          </div>
          <div>
            <h3 className="text-lg font-bold">{student.full_name}</h3>
            <BeltBadge rank={rank} size="md" />
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-[#A8A9AD]">Progress: {completedRequired}/{totalRequired} required</p>
          <p className="text-xs text-[#A8A9AD]">Total attendance: {attendance.length} classes</p>
        </div>
      </div>

      {/* Goals */}
      {goals.length === 0 ? (
        <p className="text-[#A8A9AD] text-center py-8">No goals set for {rank}. Create goals in the Belt Goals tab.</p>
      ) : (
        <div className="space-y-3">
          {goals.map((goal) => {
            const record = getProgressRecord(goal.id);
            const currentStatus = record?.status || "not_started";
            const currentNotes = record?.admin_notes || "";
            return (
              <GoalRow
                key={goal.id}
                goal={goal}
                status={currentStatus}
                notes={currentNotes}
                saving={saving === goal.id}
                statusOptions={statusOptions}
                onSave={(status, notes) => updateProgress(goal, status, notes)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function GoalRow({ goal, status, notes, saving, statusOptions, onSave }) {
  const [localStatus, setLocalStatus] = useState(status);
  const [localNotes, setLocalNotes] = useState(notes);
  const changed = localStatus !== status || localNotes !== notes;

  useEffect(() => { setLocalStatus(status); setLocalNotes(notes); }, [status, notes]);

  return (
    <div className="border border-[#A8A9AD]/20 p-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{goal.title}</p>
          {goal.is_required && <span className="text-[9px] tracking-widest uppercase text-[#C9A84C] border border-[#C9A84C]/30 px-1.5 py-0.5">Required</span>}
          <span className="text-[9px] tracking-widest uppercase text-[#A8A9AD]">{goal.category}</span>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={localStatus}
          onChange={(e) => setLocalStatus(e.target.value)}
          className="bg-[#0A0A0A] border border-[#A8A9AD]/30 px-3 py-1.5 text-xs text-white focus:border-[#C9A84C] focus:outline-none"
        >
          {statusOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <input
          value={localNotes}
          onChange={(e) => setLocalNotes(e.target.value)}
          placeholder="Instructor notes..."
          className="flex-1 min-w-[200px] bg-transparent border border-[#A8A9AD]/20 px-3 py-1.5 text-xs text-white focus:border-[#C9A84C] focus:outline-none"
        />
        {changed && (
          <button
            onClick={() => onSave(localStatus, localNotes)}
            disabled={saving}
            className="flex items-center gap-1 px-3 py-1.5 bg-[#C9A84C] text-black text-xs font-bold tracking-wide hover:bg-[#E0C97A] transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save
          </button>
        )}
      </div>
    </div>
  );
}