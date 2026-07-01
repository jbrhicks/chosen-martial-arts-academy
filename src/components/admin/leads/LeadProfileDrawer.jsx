import { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import {
  X, Mail, Phone, Calendar, Clock, User, MessageSquare, Bell, UserCheck,
  Send, Loader2, StickyNote, AlertTriangle, CalendarCheck, Globe, Gift,
  ChevronRight, History
} from "lucide-react";
import { formatTime } from "@/lib/constants";

const STAGE_LABELS = {
  new_lead: "New Lead", contacted: "Contacted", trial_booked: "Trial Booked",
  showed_up: "Trial Attended", won: "Won / Enrolled", lost: "Lost",
};

const ACTION_ICONS = {
  email: Mail, sms: MessageSquare, web_form: Globe, staff_note: StickyNote,
  stage_change: ChevronRight, trial_booked: CalendarCheck, call: Phone,
  enrolled: UserCheck, reminder_set: Bell,
};

const ACTION_COLORS = {
  email: "text-blue-400", sms: "text-cyan-400", web_form: "text-purple-400",
  staff_note: "text-[#C9A84C]", stage_change: "text-[#A8A9AD]", trial_booked: "text-purple-400",
  call: "text-green-400", enrolled: "text-green-400", reminder_set: "text-orange-400",
};

export default function LeadProfileDrawer({ lead, onClose, onLeadUpdated }) {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loadingTimeline, setLoadingTimeline] = useState(true);
  const [noteText, setNoteText] = useState("");
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [reminder, setReminder] = useState({ text: "", date: "", type: "call" });
  const [converting, setConverting] = useState(false);
  const [booking, setBooking] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadTimeline = useCallback(async () => {
    if (!lead) return;
    setLoadingTimeline(true);
    try {
      const [logs, taskList] = await Promise.all([
        base44.entities.LeadActivityLog.filter({ lead_id: lead.id }).catch(() => []),
        base44.entities.FollowUpTask.filter({ lead_id: lead.id }).catch(() => []),
      ]);
      setActivities(logs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
      setTasks(taskList.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
    } catch (e) { console.error(e); }
    setLoadingTimeline(false);
  }, [lead]);

  useEffect(() => {
    loadTimeline();
  }, [loadTimeline]);

  const adminName = user?.full_name || "Admin";

  const logActivity = async (actionType, content) => {
    try {
      await base44.entities.LeadActivityLog.create({
        lead_id: lead.id,
        lead_name: lead.full_name,
        action_type: actionType,
        content,
        admin_id: user?.id,
        admin_name: adminName,
      });
      loadTimeline();
    } catch (e) { console.error(e); }
  };

  const handleSaveNote = async () => {
    if (!noteText.trim()) return;
    setActionLoading(true);
    await logActivity("staff_note", noteText.trim());
    setNoteText("");
    setShowNoteForm(false);
    setActionLoading(false);
  };

  const handleSetReminder = async () => {
    if (!reminder.text.trim() || !reminder.date) return;
    setActionLoading(true);
    try {
      await base44.entities.FollowUpTask.create({
        lead_id: lead.id,
        lead_name: lead.full_name,
        task_type: reminder.type,
        due_date: reminder.date,
        status: "pending",
        admin_notes: reminder.text.trim(),
      });
      await logActivity("reminder_set", `Reminder set: ${reminder.text.trim()} (${reminder.type} on ${reminder.date})`);
      setReminder({ text: "", date: "", type: "call" });
      setShowReminderForm(false);
    } catch (e) { console.error(e); }
    setActionLoading(false);
  };

  const handleBookTrial = async () => {
    setBooking(true);
    try {
      await base44.functions.invoke("bookTrial", {
        lead_id: lead.id,
        class_id: lead.trial_class_id,
        class_name: lead.trial_class_name,
        trial_date: lead.trial_date,
      });
      await logActivity("trial_booked", `Trial booked: ${lead.trial_class_name} on ${lead.trial_date}`);
      onLeadUpdated();
    } catch (e) {
      alert("Failed to book trial. Please try again.");
    }
    setBooking(false);
  };

  const handleConvert = async () => {
    if (!confirm(`Convert ${lead.full_name} to a student? This will send them an account invitation email.`)) return;
    setConverting(true);
    try {
      await base44.functions.invoke("convertLeadToStudent", {
        lead_id: lead.id,
        admin_name: adminName,
      });
      onLeadUpdated();
      onClose();
    } catch (e) {
      alert("Failed to convert: " + (e.response?.data?.error || e.message));
    }
    setConverting(false);
  };

  const handleSendEmail = async () => {
    if (!lead.email) return;
    const subject = prompt("Email subject:", "Following up — Chosen Martial Arts Academy");
    if (!subject) return;
    const body = prompt("Email message:", `Hi ${lead.full_name},\n\n`);
    if (!body) return;
    setActionLoading(true);
    try {
      await base44.integrations.Core.SendEmail({ to: lead.email, subject, body });
      await logActivity("email", `Sent email: "${subject}"`);
    } catch (e) {
      alert("Failed to send email.");
    }
    setActionLoading(false);
  };

  if (!lead) return null;

  // Build unified timeline
  const timeline = [
    ...activities.map(a => ({
      date: a.created_date, type: a.action_type, content: a.content,
      author: a.admin_name, icon: ACTION_ICONS[a.action_type] || StickyNote,
      color: ACTION_COLORS[a.action_type] || "text-[#A8A9AD]",
    })),
    ...tasks.map(t => ({
      date: t.created_date, type: "reminder", content: `Reminder: ${t.admin_notes || t.task_type} (due ${t.due_date}) — ${t.status}`,
      author: "Staff", icon: Bell, color: t.status === "completed" ? "text-green-400" : "text-orange-400",
    })),
    { date: lead.created_date, type: "created", content: "Lead submitted via website", author: "System", icon: Globe, color: "text-purple-400" },
    lead.welcome_email_sent && { date: lead.created_date, type: "welcome", content: "Welcome email sent automatically", author: "System", icon: Mail, color: "text-blue-400" },
    lead.trial_date && { date: lead.trial_date, type: "trial", content: `Trial scheduled: ${lead.trial_class_name || 'Class'}`, author: "System", icon: CalendarCheck, color: "text-purple-400" },
  ].filter(Boolean).sort((a, b) => new Date(b.date) - new Date(a.date));

  const stage = STAGE_LABELS[lead.pipeline_stage] || "New Lead";
  const canConvert = lead.pipeline_stage !== "won" && lead.email;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[#0A0A0A] border-l border-[#A8A9AD]/20 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#0A0A0A] border-b border-[#A8A9AD]/20 p-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="text-xl font-bold">{lead.full_name}</h2>
              <p className="text-xs text-[#A8A9AD] mt-1">{stage} · {lead.program_of_interest || lead.interest || "—"}</p>
            </div>
            <button onClick={onClose} className="text-[#A8A9AD] hover:text-white"><X size={20} /></button>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-[#A8A9AD]">
            {lead.email && <a href={`mailto:${lead.email}`} className="flex items-center gap-1 hover:text-[#C9A84C]"><Mail size={12} /> {lead.email}</a>}
            {lead.phone && lead.phone !== "N/A" && <a href={`tel:${lead.phone}`} className="flex items-center gap-1 hover:text-[#C9A84C]"><Phone size={12} /> {lead.phone}</a>}
            {lead.lead_source && <span className="flex items-center gap-1"><Gift size={12} /> {lead.lead_source}</span>}
            {lead.student_age != null && <span className="flex items-center gap-1"><User size={12} /> Age {lead.student_age}</span>}
          </div>
          {lead.message && (
            <div className="mt-3 border-l-2 border-[#C9A84C]/30 pl-3">
              <p className="text-xs text-[#A8A9AD] italic">"{lead.message}"</p>
            </div>
          )}
        </div>

        {/* Trial info */}
        {lead.trial_class_name && (
          <div className="border-b border-[#A8A9AD]/20 p-6">
            <p className="text-xs tracking-widest uppercase text-[#C9A84C] mb-3">Trial Details</p>
            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2 text-white"><CalendarCheck size={14} className="text-[#C9A84C]" /> {lead.trial_class_name}</p>
              {lead.trial_date && <p className="flex items-center gap-2 text-[#A8A9AD]"><Calendar size={14} /> {new Date(lead.trial_date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>}
            </div>
            {lead.override_requested && (
              <div className="mt-3 border border-red-500/30 bg-red-500/5 p-3 flex items-start gap-2">
                <AlertTriangle size={14} className="text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-red-400">Override Requested</p>
                  {lead.override_reason && <p className="text-xs text-[#A8A9AD] italic mt-1">"{lead.override_reason}"</p>}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="border-b border-[#A8A9AD]/20 p-6">
          <p className="text-xs tracking-widest uppercase text-[#C9A84C] mb-3">Quick Actions</p>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setShowNoteForm(!showNoteForm)} className="flex items-center justify-center gap-2 px-3 py-2.5 border border-[#A8A9AD]/30 text-xs font-medium text-white hover:border-[#C9A84C]/50 transition-colors">
              <StickyNote size={14} /> Log Note
            </button>
            <button onClick={() => setShowReminderForm(!showReminderForm)} className="flex items-center justify-center gap-2 px-3 py-2.5 border border-[#A8A9AD]/30 text-xs font-medium text-white hover:border-[#C9A84C]/50 transition-colors">
              <Bell size={14} /> Set Reminder
            </button>
            <button onClick={handleSendEmail} disabled={actionLoading} className="flex items-center justify-center gap-2 px-3 py-2.5 border border-[#A8A9AD]/30 text-xs font-medium text-white hover:border-[#C9A84C]/50 transition-colors disabled:opacity-50">
              <Send size={14} /> Send Email
            </button>
            <button onClick={handleConvert} disabled={converting || !canConvert} className="flex items-center justify-center gap-2 px-3 py-2.5 bg-green-500/10 border border-green-500/30 text-xs font-bold text-green-400 hover:bg-green-500/20 transition-colors disabled:opacity-50">
              {converting ? <Loader2 size={14} className="animate-spin" /> : <UserCheck size={14} />} Convert to Student
            </button>
          </div>

          {/* Inline Note Form */}
          {showNoteForm && (
            <div className="mt-3 space-y-2">
              <textarea value={noteText} onChange={e => setNoteText(e.target.value)} rows={3} placeholder="Add a note..." className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-3 py-2 text-sm text-white focus:border-[#C9A84C] focus:outline-none resize-none" />
              <div className="flex gap-2">
                <button onClick={handleSaveNote} disabled={actionLoading || !noteText.trim()} className="px-4 py-2 bg-[#C9A84C] text-black text-xs font-bold tracking-wide uppercase hover:bg-[#E0C97A] disabled:opacity-50">Save Note</button>
                <button onClick={() => setShowNoteForm(false)} className="px-4 py-2 text-xs text-[#A8A9AD] hover:text-white">Cancel</button>
              </div>
            </div>
          )}

          {/* Inline Reminder Form */}
          {showReminderForm && (
            <div className="mt-3 space-y-2">
              <input type="text" value={reminder.text} onChange={e => setReminder({ ...reminder, text: e.target.value })} placeholder="Reminder note (e.g., Call back Friday)" className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-3 py-2 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
              <div className="flex gap-2">
                <select value={reminder.type} onChange={e => setReminder({ ...reminder, type: e.target.value })} className="bg-[#0A0A0A] border border-[#A8A9AD]/30 px-3 py-2 text-sm text-white focus:border-[#C9A84C] focus:outline-none">
                  <option value="call">Call</option>
                  <option value="text">Text</option>
                  <option value="email">Email</option>
                </select>
                <input type="date" value={reminder.date} min={new Date().toISOString().split("T")[0]} onChange={e => setReminder({ ...reminder, date: e.target.value })} className="flex-1 bg-[#0A0A0A] border border-[#A8A9AD]/30 px-3 py-2 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
              </div>
              <div className="flex gap-2">
                <button onClick={handleSetReminder} disabled={actionLoading || !reminder.text.trim() || !reminder.date} className="px-4 py-2 bg-[#C9A84C] text-black text-xs font-bold tracking-wide uppercase hover:bg-[#E0C97A] disabled:opacity-50">Set Reminder</button>
                <button onClick={() => setShowReminderForm(false)} className="px-4 py-2 text-xs text-[#A8A9AD] hover:text-white">Cancel</button>
              </div>
            </div>
          )}
        </div>

        {/* Activity Timeline */}
        <div className="p-6">
          <p className="text-xs tracking-widest uppercase text-[#C9A84C] mb-4 flex items-center gap-2">
            <History size={14} /> Activity Timeline
          </p>
          {loadingTimeline ? (
            <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-[#C9A84C]" /></div>
          ) : timeline.length === 0 ? (
            <p className="text-sm text-[#A8A9AD] text-center py-8">No activity yet.</p>
          ) : (
            <div className="space-y-4">
              {timeline.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 border border-[#A8A9AD]/30 flex items-center justify-center shrink-0">
                        <Icon size={14} className={item.color} />
                      </div>
                      {idx < timeline.length - 1 && <div className="w-px flex-1 bg-[#A8A9AD]/20 my-1" />}
                    </div>
                    <div className="flex-1 pb-2">
                      <p className="text-sm text-white">{item.content}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-[#A8A9AD]">{item.author}</span>
                        <span className="text-[10px] text-[#A8A9AD]/50">·</span>
                        <span className="text-[10px] text-[#A8A9AD]">
                          {new Date(item.date).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}