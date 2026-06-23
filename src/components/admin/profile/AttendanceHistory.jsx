import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Calendar, Plus, Loader2, Trophy, Clock } from "lucide-react";

export default function AttendanceHistory({ user, attendance, eventRegs, events, enrollments, belts, onRefresh, logActivity }) {
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [saving, setSaving] = useState(false);

  const userEnrollment = enrollments.find(e => e.user_id === user.id && e.status === "active");
  const programBelts = belts.filter(b => b.program_id === userEnrollment?.program_id);
  const currentBelt = programBelts.find(b => b.belt_name === user.belt_rank) || programBelts[0];
  const minClasses = currentBelt?.min_classes_required || 0;
  const totalAttended = attendance.length;

  const sortedAttendance = [...attendance].sort((a, b) => new Date(b.check_in_date) - new Date(a.check_in_date));
  const sortedEventRegs = [...eventRegs].sort((a, b) => new Date(b.event_date || b.created_date) - new Date(a.event_date || a.created_date));
  const upcomingEvents = events.filter(e => new Date(e.start_date) >= new Date()).sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

  const addToEvent = async () => {
    if (!selectedEventId) return;
    const event = events.find(e => e.id === selectedEventId);
    if (!event) return;
    setSaving(true);
    try {
      await base44.entities.EventRegistration.create({
        user_id: user.id, user_name: user.full_name, user_email: user.email, family_id: user.family_id,
        event_id: event.id, event_title: event.title, event_date: event.start_date, event_type: event.event_type,
        payment_status: "unpaid", registration_date: new Date().toISOString(),
      });
      await logActivity("note", `Manually registered for event: ${event.title}`);
      setSelectedEventId("");
      setShowAddEvent(false);
      onRefresh();
    } catch (e) { alert("Failed: " + e.message); }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="border border-[#C9A84C]/30 bg-[#C9A84C]/5 p-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Trophy size={24} className="text-[#C9A84C]" />
          <span className="text-5xl font-bold text-[#C9A84C]">{totalAttended}</span>
        </div>
        <p className="text-sm text-white font-medium">Total Classes Attended</p>
        {minClasses > 0 && (
          <p className="text-xs text-[#A8A9AD] mt-1">
            {totalAttended >= minClasses
              ? `✓ Minimum met (${minClasses} required for ${currentBelt?.belt_name || "next rank"})`
              : `${minClasses - totalAttended} more needed for ${currentBelt?.belt_name || "next rank"} (${totalAttended}/${minClasses})`}
          </p>
        )}
      </div>

      <div className="border border-[#A8A9AD]/20 bg-black p-6">
        <h3 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C] mb-4">Check-In History</h3>
        {sortedAttendance.length === 0 ? (
          <p className="text-sm text-[#A8A9AD]">No attendance records.</p>
        ) : (
          <div className="max-h-80 overflow-y-auto space-y-2">
            {sortedAttendance.map(a => (
              <div key={a.id} className="flex items-center gap-3 p-2 border border-[#A8A9AD]/10 hover:bg-white/5">
                <Clock size={14} className="text-[#C9A84C] shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{a.class_name}</p>
                  <p className="text-xs text-[#A8A9AD]">{new Date(a.check_in_date).toLocaleString()} · {a.check_in_method}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border border-[#A8A9AD]/20 bg-black p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C]">Special Events & Seminars</h3>
          <button onClick={() => setShowAddEvent(!showAddEvent)} className="flex items-center gap-1 text-xs text-[#C9A84C] hover:text-[#E0C97A] font-medium">
            <Plus size={14} /> Add to Event
          </button>
        </div>
        {showAddEvent && (
          <div className="mb-4 p-4 border border-[#C9A84C]/30 bg-[#C9A84C]/5 space-y-3">
            <select value={selectedEventId} onChange={e => setSelectedEventId(e.target.value)} className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-3 py-2 text-sm text-white focus:border-[#C9A84C] focus:outline-none">
              <option value="">Select an upcoming event...</option>
              {upcomingEvents.map(e => <option key={e.id} value={e.id}>{e.title} - {new Date(e.start_date).toLocaleDateString()}</option>)}
            </select>
            <button onClick={addToEvent} disabled={saving || !selectedEventId} className="flex items-center gap-1 px-4 py-2 bg-[#C9A84C] text-black font-bold text-xs uppercase hover:bg-[#E0C97A] disabled:opacity-50">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Register Student
            </button>
          </div>
        )}
        {sortedEventRegs.length === 0 ? (
          <p className="text-sm text-[#A8A9AD]">No event registrations.</p>
        ) : (
          <div className="space-y-2">
            {sortedEventRegs.map(reg => (
              <div key={reg.id} className="flex items-center gap-3 p-3 border border-[#A8A9AD]/10">
                <Calendar size={16} className="text-[#C9A84C] shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{reg.event_title}</p>
                  <p className="text-xs text-[#A8A9AD]">{reg.event_date ? new Date(reg.event_date).toLocaleDateString() : "Date TBD"}</p>
                </div>
                <span className={`text-xs font-bold uppercase tracking-wide px-2 py-1 ${reg.payment_status === "paid" ? "text-green-400 bg-green-400/10" : reg.payment_status === "pending" ? "text-yellow-400 bg-yellow-400/10" : "text-red-400 bg-red-400/10"}`}>
                  {reg.payment_status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}