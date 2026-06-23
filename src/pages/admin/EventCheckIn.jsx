import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, CheckCircle, X, Search, Calendar, Users, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function EventCheckIn() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedReg, setSelectedReg] = useState(null);
  const [adminComments, setAdminComments] = useState("");
  const [savingComments, setSavingComments] = useState(false);
  const [customAnswers, setCustomAnswers] = useState({});

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const all = await base44.entities.Event.list();
      const upcoming = all
        .filter((e) => new Date(e.start_date) >= new Date())
        .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
      setEvents(upcoming);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const loadRegistrations = async (event) => {
    setSelectedEvent(event);
    setLoading(true);
    try {
      const regs = await base44.entities.EventRegistration.filter({ event_id: event.id });
      regs.sort((a, b) => new Date(a.registration_date) - new Date(b.registration_date));
      setRegistrations(regs);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleCheckIn = async (regId) => {
    try {
      await base44.entities.EventRegistration.update(regId, {
        status: "checked-in",
        checked_in_date: new Date().toISOString(),
      });
      loadRegistrations(selectedEvent);
    } catch (e) {
      alert("Failed to check in: " + e.message);
    }
  };

  const handleUndoCheckIn = async (regId) => {
    try {
      await base44.entities.EventRegistration.update(regId, {
        status: "registered",
        checked_in_date: null,
      });
      loadRegistrations(selectedEvent);
    } catch (e) {
      alert("Failed to undo: " + e.message);
    }
  };

  const openDetailModal = async (reg) => {
    setSelectedReg(reg);
    setAdminComments(reg.admin_comments || "");
    if (reg.id) {
      try {
        const answers = await base44.entities.EventRegistrationAnswer.filter({ registration_id: reg.id });
        setCustomAnswers(answers);
      } catch (e) {
        console.error(e);
      }
    }
    setShowDetailModal(true);
  };

  const handleSaveComments = async () => {
    setSavingComments(true);
    try {
      await base44.entities.EventRegistration.update(selectedReg.id, {
        admin_comments: adminComments,
      });
      setShowDetailModal(false);
      setSelectedReg(null);
      loadRegistrations(selectedEvent);
    } catch (e) {
      alert("Failed to save comments: " + e.message);
    }
    setSavingComments(false);
  };

  const filtered = registrations.filter((reg) => {
    if (filterStatus !== "all" && reg.status !== filterStatus) return false;
    if (search) {
      const name = (reg.student_name || "").toLowerCase();
      const email = (reg.user_email || "").toLowerCase();
      return name.includes(search.toLowerCase()) || email.includes(search.toLowerCase());
    }
    return true;
  });

  const stats = {
    total: registrations.length,
    registered: registrations.filter((r) => r.status === "registered").length,
    checkedIn: registrations.filter((r) => r.status === "checked-in").length,
    waitlisted: registrations.filter((r) => r.status === "waitlisted").length,
  };

  if (loading && !selectedEvent) {
    return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-[#C9A84C]" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs tracking-widest uppercase text-[#C9A84C] mb-2">Event Attendance</p>
        <h1 className="text-3xl font-bold">Event Check-In</h1>
        <p className="text-[#A8A9AD] text-sm mt-1">Manage event registrations and check-ins.</p>
      </div>

      {!selectedEvent ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event) => {
            const eventDate = new Date(event.start_date);
            return (
              <button
                key={event.id}
                onClick={() => loadRegistrations(event)}
                className="border border-[#A8A9AD]/20 p-6 text-left hover:border-[#C9A84C]/40 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-[10px] tracking-widest uppercase text-[#C9A84C] border border-[#C9A84C]/30 px-2 py-1">
                    {event.event_type.replace("-", " ")}
                  </span>
                </div>
                <h3 className="text-lg font-bold mb-2">{event.title}</h3>
                <div className="flex items-center gap-2 text-sm text-[#A8A9AD] mb-1">
                  <Calendar size={14} className="text-[#C9A84C]" />
                  {eventDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                </div>
                {event.location && (
                  <div className="flex items-center gap-2 text-sm text-[#A8A9AD]">
                    <Users size={14} className="text-[#C9A84C]" />
                    {event.location}
                  </div>
                )}
              </button>
            );
          })}
          {events.length === 0 && (
            <div className="col-span-full border border-[#A8A9AD]/20 p-12 text-center">
              <p className="text-[#A8A9AD]">No upcoming events.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSelectedEvent(null)}
              className="text-sm text-[#A8A9AD] hover:text-[#C9A84C] flex items-center gap-2"
            >
              ← Back to Events
            </button>
            <h2 className="text-xl font-bold">{selectedEvent.title}</h2>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="border border-[#A8A9AD]/20 p-4">
              <p className="text-xs text-[#A8A9AD] uppercase tracking-widest">Total</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="border border-[#A8A9AD]/20 p-4">
              <p className="text-xs text-[#A8A9AD] uppercase tracking-widest">Registered</p>
              <p className="text-2xl font-bold text-blue-400">{stats.registered}</p>
            </div>
            <div className="border border-[#A8A9AD]/20 p-4">
              <p className="text-xs text-[#A8A9AD] uppercase tracking-widest">Checked In</p>
              <p className="text-2xl font-bold text-[#C9A84C]">{stats.checkedIn}</p>
            </div>
            <div className="border border-[#A8A9AD]/20 p-4">
              <p className="text-xs text-[#A8A9AD] uppercase tracking-widest">Waitlist</p>
              <p className="text-2xl font-bold text-orange-400">{stats.waitlisted}</p>
            </div>
          </div>

          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px] relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A9AD]" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="pl-9 bg-[#0A0A0A] border border-[#A8A9AD]/30 text-white"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="bg-[#0A0A0A] border border-[#A8A9AD]/30 text-white w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0A0A0A] border border-[#A8A9AD]/30">
                <SelectItem value="all" className="text-white">All</SelectItem>
                <SelectItem value="registered" className="text-white">Registered</SelectItem>
                <SelectItem value="checked-in" className="text-white">Checked In</SelectItem>
                <SelectItem value="waitlisted" className="text-white">Waitlist</SelectItem>
                <SelectItem value="cancelled" className="text-white">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-[#C9A84C]" /></div>
          ) : filtered.length === 0 ? (
            <div className="border border-[#A8A9AD]/20 p-12 text-center">
              <p className="text-[#A8A9AD]">No registrations found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((reg) => (
                <div key={reg.id} className="border border-[#A8A9AD]/20 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-bold">{reg.student_name}</h4>
                        <span className={`px-2 py-0.5 text-xs uppercase tracking-wider rounded ${
                          reg.status === "checked-in" ? "bg-green-900/30 text-green-400" :
                          reg.status === "registered" ? "bg-blue-900/30 text-blue-400" :
                          reg.status === "waitlisted" ? "bg-orange-900/30 text-orange-400" :
                          "bg-red-900/30 text-red-400"
                        }`}>
                          {reg.status}
                        </span>
                        {reg.waitlist_position && <span className="text-xs text-orange-400">#{reg.waitlist_position}</span>}
                      </div>
                      <p className="text-sm text-[#A8A9AD]">{reg.user_email}</p>
                      {reg.student_belt_rank && <p className="text-xs text-[#C9A84C] mt-1">{reg.student_belt_rank}</p>}
                      {reg.admin_comments && (
                        <div className="mt-2 p-2 bg-[#C9A84C]/10 border border-[#C9A84C]/20 rounded">
                          <p className="text-xs text-[#C9A84C] font-bold uppercase tracking-widest mb-1">Admin Notes</p>
                          <p className="text-sm text-white">{reg.admin_comments}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {reg.status === "registered" && (
                        <Button onClick={() => handleCheckIn(reg.id)} size="sm" className="bg-green-600 text-white hover:bg-green-700">
                          <CheckCircle size={16} className="mr-1" />
                          Check In
                        </Button>
                      )}
                      {reg.status === "checked-in" && (
                        <Button onClick={() => handleUndoCheckIn(reg.id)} size="sm" variant="outline" className="border-[#A8A9AD]/30 text-[#A8A9AD] hover:text-white">
                          <UserCheck size={16} className="mr-1" />
                          Undo
                        </Button>
                      )}
                      <Button
                        onClick={() => openDetailModal(reg)}
                        size="sm"
                        variant="outline"
                        className="border-[#A8A9AD]/30 text-[#A8A9AD] hover:text-[#C9A84C]"
                      >
                        Details
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showDetailModal && selectedReg && (
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="bg-[#0A0A0A] border border-[#A8A9AD]/20 max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">
                Registration Details - {selectedReg.student_name}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-[#A8A9AD] uppercase tracking-widest mb-1">Student</p>
                  <p className="text-sm font-medium">{selectedReg.student_name}</p>
                </div>
                <div>
                  <p className="text-xs text-[#A8A9AD] uppercase tracking-widest mb-1">Belt Rank</p>
                  <p className="text-sm text-[#C9A84C]">{selectedReg.student_belt_rank || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-[#A8A9AD] uppercase tracking-widest mb-1">Parent Email</p>
                  <p className="text-sm">{selectedReg.user_email}</p>
                </div>
                <div>
                  <p className="text-xs text-[#A8A9AD] uppercase tracking-widest mb-1">Status</p>
                  <p className="text-sm capitalize">{selectedReg.status}</p>
                </div>
              </div>

              {customAnswers.length > 0 && (
                <div className="border border-[#A8A9AD]/20 p-4">
                  <p className="text-xs text-[#A8A9AD] uppercase tracking-widest mb-3">Registration Answers</p>
                  <div className="space-y-2">
                    {customAnswers.map((ans, idx) => (
                      <div key={idx}>
                        <p className="text-xs text-[#A8A9AD]">{ans.question_text}</p>
                        <p className="text-sm text-white">{ans.answer_value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs text-[#A8A9AD] uppercase tracking-widest mb-2 block">
                  Admin Comments
                </label>
                <Textarea
                  value={adminComments}
                  onChange={(e) => setAdminComments(e.target.value)}
                  placeholder="Add notes about this attendee..."
                  className="bg-[#0A0A0A] border border-[#A8A9AD]/30 text-white min-h-[100px]"
                  rows={4}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSaveComments}
                  disabled={savingComments}
                  className="flex-1 bg-[#C9A84C] text-black hover:bg-[#E0C97A]"
                >
                  {savingComments ? <Loader2 size={16} className="animate-spin" /> : "Save Comments"}
                </Button>
                <Button
                  onClick={() => setShowDetailModal(false)}
                  variant="outline"
                  className="border-[#A8A9AD]/30 text-[#A8A9AD]"
                >
                  <X size={16} />
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}