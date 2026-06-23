import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Mic, Loader2 } from "lucide-react";

const STATUS_TO_SCORE = { not_started: "needs_work", practicing: "practicing", mastered: "mastered" };
const SCORE_TO_STATUS = { needs_work: "not_started", practicing: "practicing", mastered: "mastered" };

const SCORE_BUTTONS = [
  { score: "needs_work", label: "Needs Work", activeClass: "bg-red-500 text-white border-red-500", idleClass: "border-red-500/30 text-red-400 hover:bg-red-500/10" },
  { score: "practicing", label: "Practicing", activeClass: "bg-yellow-500 text-black border-yellow-500", idleClass: "border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10" },
  { score: "mastered", label: "Mastered", activeClass: "bg-[#C9A84C] text-black border-[#C9A84C]", idleClass: "border-[#C9A84C]/30 text-[#C9A84C] hover:bg-[#C9A84C]/10" },
];

export default function EvaluationChecklist({ criteria, progress, student, evaluator, sessionId, onProgressUpdate }) {
  const [notes, setNotes] = useState({});
  const [saving, setSaving] = useState(null);
  const [dictating, setDictating] = useState(null);

  const getProgress = (criteriaId) => progress.find(p => p.criteria_id === criteriaId);
  const getStatus = (criteriaId) => getProgress(criteriaId)?.status || "not_started";
  const getScore = (criteriaId) => STATUS_TO_SCORE[getStatus(criteriaId)];

  const logEvaluation = async (criterion, score, noteText) => {
    await base44.entities.EvaluationLog.create({
      student_id: student.id,
      student_name: student.full_name,
      session_id: sessionId || undefined,
      criteria_id: criterion.id,
      criteria_title: criterion.title,
      rank_id: criterion.rank_id,
      score: score,
      instructor_notes: noteText || undefined,
      instructor_id: evaluator.id,
      instructor_name: evaluator.full_name,
      timestamp: new Date().toISOString(),
    }).catch(() => {});
  };

  const setScore = async (criterion, score) => {
    const newStatus = SCORE_TO_STATUS[score];
    const current = getProgress(criterion.id);
    if (current?.status === newStatus) return;
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
      await logEvaluation(criterion, score);
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
      if (noteText) {
        await logEvaluation(criterion, STATUS_TO_SCORE[getStatus(criterion.id)], noteText);
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
        const score = getScore(c.id);
        const current = getProgress(c.id);
        return (
          <div key={c.id} className={`border p-4 transition-colors ${score === "mastered" ? "border-[#C9A84C]/40 bg-[#C9A84C]/5" : score === "needs_work" ? "border-red-500/20 bg-red-500/5" : "border-[#A8A9AD]/20 bg-black"}`}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{c.title}</p>
                <span className="text-[9px] tracking-widest uppercase text-[#A8A9AD] border border-[#A8A9AD]/20 px-2 py-0.5 mt-1 inline-block">{c.category}</span>
              </div>
              {saving === c.id && <Loader2 size={16} className="animate-spin text-[#C9A84C] shrink-0" />}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {SCORE_BUTTONS.map(btn => {
                const active = score === btn.score;
                return (
                  <button
                    key={btn.score}
                    onClick={() => setScore(c, btn.score)}
                    disabled={saving === c.id}
                    className={`py-3 text-xs font-bold tracking-wide uppercase border-2 transition-all ${active ? btn.activeClass : btn.idleClass} disabled:opacity-50`}
                  >
                    {btn.label}
                  </button>
                );
              })}
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