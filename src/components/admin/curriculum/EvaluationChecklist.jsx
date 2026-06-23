import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Mic, Loader2, CheckCircle, Circle, Clock } from "lucide-react";

const STATUS_CYCLE = { not_started: "practicing", practicing: "mastered", mastered: "not_started" };
const STATUS_CONFIG = {
  not_started: { label: "Not Started", color: "text-[#A8A9AD]", bg: "bg-transparent", icon: Circle },
  practicing: { label: "Practicing", color: "text-blue-400", bg: "bg-blue-400/10", icon: Clock },
  mastered: { label: "Mastered", color: "text-[#C9A84C]", bg: "bg-[#C9A84C]/10", icon: CheckCircle },
};

export default function EvaluationChecklist({ criteria, progress, student, evaluator, onProgressUpdate }) {
  const [notes, setNotes] = useState({});
  const [saving, setSaving] = useState(null);
  const [dictating, setDictating] = useState(null);

  const getProgress = (criteriaId) => progress.find(p => p.criteria_id === criteriaId);
  const getStatus = (criteriaId) => getProgress(criteriaId)?.status || "not_started";

  const cycleStatus = async (criterion) => {
    const current = getProgress(criterion.id);
    const newStatus = STATUS_CYCLE[current?.status || "not_started"];
    setSaving(criterion.id);
    try {
      if (current?.id) {
        const updateData = { status: newStatus, evaluator_id: evaluator.id, evaluator_name: evaluator.full_name };
        if (newStatus === "mastered") updateData.date_mastered = new Date().toISOString().split("T")[0];
        await base44.entities.StudentCriteriaProgress.update(current.id, updateData);
      } else {
        await base44.entities.StudentCriteriaProgress.create({
          student_id: student.id,
          student_name: student.full_name,
          criteria_id: criterion.id,
          criteria_title: criterion.title,
          rank_id: criterion.rank_id,
          status: newStatus,
          evaluator_id: evaluator.id,
          evaluator_name: evaluator.full_name,
          date_mastered: newStatus === "mastered" ? new Date().toISOString().split("T")[0] : undefined,
        });
      }
      onProgressUpdate();
    } catch (e) { alert("Failed to update status."); }
    setSaving(null);
  };

  const saveNotes = async (criterion) => {
    const current = getProgress(criterion.id);
    const noteText = notes[criterion.id] ?? current?.instructor_notes ?? "";
    if (noteText === (current?.instructor_notes || "")) return;
    setSaving(criterion.id);
    try {
      if (current?.id) {
        await base44.entities.StudentCriteriaProgress.update(current.id, { instructor_notes: noteText, evaluator_id: evaluator.id, evaluator_name: evaluator.full_name });
      } else {
        await base44.entities.StudentCriteriaProgress.create({
          student_id: student.id,
          student_name: student.full_name,
          criteria_id: criterion.id,
          criteria_title: criterion.title,
          rank_id: criterion.rank_id,
          status: "not_started",
          instructor_notes: noteText,
          evaluator_id: evaluator.id,
          evaluator_name: evaluator.full_name,
        });
      }
      onProgressUpdate();
    } catch (e) { alert("Failed to save notes."); }
    setSaving(null);
  };

  const dictate = (criteriaId) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { alert("Voice dictation not supported on this browser."); return; }
    setDictating(criteriaId);
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setNotes(prev => ({ ...prev, [criteriaId]: (prev[criteriaId] || "") + (prev[criteriaId] ? " " : "") + transcript }));
      setDictating(null);
    };
    recognition.onerror = () => setDictating(null);
    recognition.onend = () => setDictating(null);
    recognition.start();
  };

  if (criteria.length === 0) {
    return <div className="border border-[#A8A9AD]/20 bg-black p-8 text-center"><p className="text-[#A8A9AD]">No criteria defined for this belt. Use the Curriculum Builder to add criteria.</p></div>;
  }

  return (
    <div className="space-y-2">
      {criteria.map(c => {
        const status = getStatus(c.id);
        const config = STATUS_CONFIG[status];
        const StatusIcon = config.icon;
        const current = getProgress(c.id);
        return (
          <div key={c.id} className={`border p-4 transition-colors ${status === "mastered" ? "border-[#C9A84C]/40 bg-[#C9A84C]/5" : "border-[#A8A9AD]/20 bg-black"}`}>
            <div className="flex items-center gap-3">
              <button onClick={() => cycleStatus(c)} disabled={saving === c.id} className="shrink-0">
                {saving === c.id ? <Loader2 size={22} className="animate-spin text-[#C9A84C]" /> : <StatusIcon size={22} className={config.color} />}
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{c.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[9px] tracking-widest uppercase text-[#A8A9AD] border border-[#A8A9AD]/20 px-2 py-0.5">{c.category}</span>
                  <span className={`text-[10px] tracking-widest uppercase ${config.color}`}>{config.label}</span>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2 mt-3">
              <input
                value={notes[c.id] ?? current?.instructor_notes ?? ""}
                onChange={e => setNotes(prev => ({ ...prev, [c.id]: e.target.value }))}
                onBlur={() => saveNotes(c)}
                placeholder="Instructor notes (type or dictate)..."
                className="flex-1 bg-transparent border border-[#A8A9AD]/20 px-3 py-2 text-xs text-white focus:border-[#C9A84C] focus:outline-none"
              />
              <button onClick={() => dictate(c.id)} className={`p-2 border border-[#A8A9AD]/20 transition-colors shrink-0 ${dictating === c.id ? "text-red-400 border-red-400/40 animate-pulse" : "text-[#A8A9AD] hover:text-[#C9A84C]"}`}>
                <Mic size={14} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}