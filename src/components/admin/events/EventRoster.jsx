import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Users, CheckCircle, XCircle, Clock, Search, Mail, Trash2, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export default function EventRoster({ event, onClose }) {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [selectedWaitlist, setSelectedWaitlist] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [expandedReg, setExpandedReg] = useState(null);
  const [customAnswers, setCustomAnswers] = useState({});

  const load = async () => {
    try {
      const regs = await base44.entities.EventRegistration.filter({ event_id: event.id });
      regs.sort((a, b) => new Date(a.registration_date) - new Date(b.registration_date));
      setRegistrations(regs);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const loadAnswers = async (regId) => {
    try {
      const answers = await base44.entities.EventRegistrationAnswer.filter({ registration_id: regId });
      setCustomAnswers(prev => ({ ...prev, [regId]: answers }));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    load();
  }, [event.id]);

  const handleCheckIn = async (regId) => {
    try {
      await base44.entities.EventRegistration.update(regId, {
        status: "checked-in",
        checked_in_date: new Date().toISOString(),
      });
      load();
    } catch (e) {
      alert("Failed to check in: " + e.message);
    }
  };

  const handleCancel = async (regId) => {
    if (!confirm("Cancel this registration?")) return;
    try {
      await base44.entities.EventRegistration.update(regId, { status: "cancelled" });
      load();
    } catch (e) {
      alert("Failed to cancel: " + e.message);
    }
  };

  const handleRefund = async (regId) => {
    if (!confirm("Process refund for this registration?")) return;
    try {
      await base44.entities.EventRegistration.update(regId, {
        status: "cancelled",
        payment_status: "refunded",
      });
      load();
    } catch (e) {
      alert("Failed to refund: " + e.message);
    }
  };

  const handlePromoteFromWaitlist = async () => {
    if (!selectedWaitlist) return;
    setProcessing(true);
    try {
      await base44.entities.EventRegistration.update(selectedWaitlist.id, {
        status: "registered",
        waitlist_position: null,
      });
      setShowWaitlistModal(false);
      setSelectedWaitlist(null);
      load();
    } catch (e) {
      alert("Failed to promote: " + e.message);
    }
    setProcessing(false);
  };

  const registered = registrations.filter((r) => r.status === "registered" || r.status === "checked-in");
  const waitlisted = registrations.filter((r) => r.status === "waitlisted");
  const filtered = registrations.filter((r) => {
    if (filterStatus !== "all" && r.status !== filterStatus) return false;
    if (search) {
      const name = (r.student_name || "").toLowerCase();
      const email = (r.user_email || "").toLowerCase();
      return name.includes(search.toLowerCase()) || email.includes(search.toLowerCase());
    }
    return true;
  });

  const stats = {
    total: registrations.length,
    registered: registered.length,
    waitlisted: waitlisted.length,
    checkedIn: registrations.filter((r) => r.status === "checked-in").length,
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="w-full max-w-6xl border border-[#C9A84C]/30 bg-[#0A0A0A] my-8 max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-[#A8A9AD]/20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">{event.title}</h2>
              <p className="text-sm text-[#A8A9AD] mt-1">
                {new Date(event.start_date).toLocaleDateString()} • {stats.registered} / {event.max_capacity || "∞"} registered
              </p>
            </div>
            <button onClick={onClose} className="text-[#A8A9AD] hover:text-white"><XCircle size={20} /></button>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="border border-[#A8A9AD]/20 p-3">
              <p className="text-xs text-[#A8A9AD] uppercase tracking-widest">Total</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="border border-[#A8A9AD]/20 p-3">
              <p className="text-xs text-[#A8A9AD] uppercase tracking-widest">Registered</p>
              <p className="text-2xl font-bold text-green-400">{stats.registered}</p>
            </div>
            <div className="border border-[#A8A9AD]/20 p-3">
              <p className="text-xs text-[#A8A9AD] uppercase tracking-widest">Checked In</p>
              <p className="text-2xl font-bold text-[#C9A84C]">{stats.checkedIn}</p>
            </div>
            <div className="border border-[#A8A9AD]/20 p-3">
              <p className="text-xs text-[#A8A9AD] uppercase tracking-widest">Waitlist</p>
              <p className="text-2xl font-bold text-orange-400">{stats.waitlisted}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-[#A8A9AD]/20 flex items-center gap-4">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A9AD]" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="pl-10 bg-[#0A0A0A] border border-[#A8A9AD]/30 text-white"
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

          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-[#C9A84C]" /></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-[#A8A9AD]">No registrations found.</div>
            ) : (
              <div className="space-y-3">
                {filtered.map((reg) => (
                  <div key={reg.id} className="border border-[#A8A9AD]/20 p-4">
                    <div className="flex items-center justify-between mb-2">
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
                      </div>
                      <div className="flex items-center gap-2">
                        {reg.status === "registered" && (
                          <Button onClick={() => handleCheckIn(reg.id)} size="sm" className="bg-green-600 text-white hover:bg-green-700">
                            <CheckCircle size={16} className="mr-1" />
                            Check In
                          </Button>
                        )}
                        {reg.status === "waitlisted" && (
                          <Button onClick={() => { setSelectedWaitlist(reg); setShowWaitlistModal(true); }} size="sm" className="bg-[#C9A84C] text-black hover:bg-[#E0C97A]">
                            Promote
                          </Button>
                        )}
                        {reg.payment_status === "paid" && (
                          <Button onClick={() => handleRefund(reg.id)} variant="outline" size="sm" className="border-[#A8A9AD]/30 text-[#A8A9AD] hover:text-red-400">
                            Refund
                          </Button>
                        )}
                        {reg.status !== "cancelled" && (
                          <Button onClick={() => handleCancel(reg.id)} variant="outline" size="sm" className="border-[#A8A9AD]/30 text-[#A8A9AD] hover:text-red-400">
                            <Trash2 size={16} />
                          </Button>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (expandedReg === reg.id) {
                          setExpandedReg(null);
                        } else {
                          setExpandedReg(reg.id);
                          if (!customAnswers[reg.id]) loadAnswers(reg.id);
                        }
                      }}
                      className="text-xs text-[#A8A9AD] hover:text-[#C9A84C] flex items-center gap-1"
                    >
                      {expandedReg === reg.id ? "Hide" : "Show"} Registration Details
                    </button>
                    {expandedReg === reg.id && customAnswers[reg.id] && customAnswers[reg.id].length > 0 && (
                      <div className="mt-3 pt-3 border-t border-[#A8A9AD]/20 space-y-2">
                        <p className="text-xs font-bold text-[#A8A9AD] uppercase tracking-widest">Registration Answers</p>
                        {customAnswers[reg.id].map((ans, idx) => (
                          <div key={idx} className="text-sm">
                            <span className="text-[#A8A9AD]">{ans.question_text}: </span>
                            <span className="text-white">{ans.answer_value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {showWaitlistModal && (
          <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4" onClick={() => setShowWaitlistModal(false)}>
            <div className="w-full max-w-md border border-[#C9A84C]/30 bg-[#0A0A0A] p-6" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold mb-4">Promote from Waitlist</h3>
              <p className="text-sm text-[#A8A9AD] mb-6">
                Promote <strong>{selectedWaitlist?.student_name}</strong> from waitlist to registered status?
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={handlePromoteFromWaitlist}
                  disabled={processing}
                  className="flex-1 bg-[#C9A84C] text-black hover:bg-[#E0C97A]"
                >
                  {processing ? <Loader2 size={16} className="animate-spin" /> : "Promote"}
                </Button>
                <Button onClick={() => setShowWaitlistModal(false)} variant="outline" className="border-[#A8A9AD]/30 text-[#A8A9AD]">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}