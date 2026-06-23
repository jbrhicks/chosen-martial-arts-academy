import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Check, Phone, MessageSquare, Mail, Loader2, Calendar } from "lucide-react";

export default function DailyTaskRoster() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const all = await base44.entities.FollowUpTask.list();
      const today = new Date().toISOString().split("T")[0];
      const overdue = all
        .filter(t => t.status === "pending" && t.due_date <= today)
        .sort((a, b) => (a.due_date || "").localeCompare(b.due_date || ""));
      setTasks(overdue);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleComplete = async (id) => {
    try {
      await base44.entities.FollowUpTask.update(id, { status: "completed" });
      load();
    } catch (e) { console.error(e); }
  };

  const taskIcons = {
    call: Phone,
    text: MessageSquare,
    email: Mail,
  };

  const taskColors = {
    call: "text-[#C9A84C]",
    text: "text-blue-400",
    email: "text-purple-400",
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-[#C9A84C]" /></div>;

  if (tasks.length === 0) {
    return (
      <div className="border border-[#A8A9AD]/20 p-8 text-center">
        <Check size={28} className="mx-auto text-green-400 mb-3" />
        <p className="text-sm text-[#A8A9AD]">All caught up! No pending follow-up tasks.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map(task => {
        const Icon = taskIcons[task.task_type] || Phone;
        const color = taskColors[task.task_type] || "text-[#C9A84C]";
        const isOverdue = task.due_date < new Date().toISOString().split("T")[0];
        return (
          <div key={task.id} className="border border-[#A8A9AD]/20 bg-[#0A0A0A] p-4 flex items-center gap-4">
            <div className={`w-10 h-10 border border-[#A8A9AD]/30 flex items-center justify-center shrink-0`}>
              <Icon size={16} className={color} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold">{task.lead_name || "Unknown Lead"}</p>
              <p className="text-xs text-[#A8A9AD] mt-0.5">{task.admin_notes || `${task.task_type} follow-up`}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className={`text-xs flex items-center gap-1 ${isOverdue ? "text-red-400" : "text-[#A8A9AD]"}`}>
                  <Calendar size={10} /> {task.due_date ? new Date(task.due_date).toLocaleDateString() : "—"}
                  {isOverdue && <span className="ml-1 uppercase tracking-wider">Overdue</span>}
                </span>
              </div>
            </div>
            <button onClick={() => handleComplete(task.id)} className="flex items-center gap-1.5 px-3 py-2 border border-green-400/30 text-green-400 hover:bg-green-400/10 text-xs tracking-wide uppercase transition-colors shrink-0">
              <Check size={14} /> Done
            </button>
          </div>
        );
      })}
    </div>
  );
}