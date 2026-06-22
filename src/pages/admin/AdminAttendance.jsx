import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Plus, X, Calendar, Search, ExternalLink } from "lucide-react";

export default function AdminAttendance() {
  const [records, setRecords] = useState([]);
  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showManual, setShowManual] = useState(false);
  const [manualForm, setManualForm] = useState({ user_id: "", class_name: "" });
  const [saving, setSaving] = useState(false);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split("T")[0]);
  const [filterUser, setFilterUser] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [r, u, c] = await Promise.all([
          base44.entities.AttendanceRecord.list("-check_in_date", 200),
          base44.entities.User.list(),
          base44.entities.ClassSchedule.filter({ is_active: true }),
        ]);
        setRecords(r);
        setUsers(u);
        setClasses(c);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  const handleManualCheckIn = async (e) => {
    e.preventDefault();
    if (!manualForm.user_id || !manualForm.class_name) return;
    setSaving(true);
    try {
      const user = users.find((u) => u.id === manualForm.user_id);
      const created = await base44.entities.AttendanceRecord.create({
        user_id: manualForm.user_id,
        user_name: user?.full_name || "Unknown",
        class_name: manualForm.class_name,
        check_in_date: new Date().toISOString(),
        check_in_method: "manual",
      });
      setRecords([created, ...records]);
      setShowManual(false);
      setManualForm({ user_id: "", class_name: "" });
    } catch (e) {
      alert("Failed to record attendance.");
    }
    setSaving(false);
  };

  const filtered = records.filter((r) => {
    const dateMatch = !filterDate || r.check_in_date?.startsWith(filterDate);
    const userMatch = !filterUser || r.user_name?.toLowerCase().includes(filterUser.toLowerCase());
    return dateMatch && userMatch;
  });

  // Stats
  const todayCount = records.filter((r) => r.check_in_date?.startsWith(new Date().toISOString().split("T")[0])).length;
  const thisWeekCount = records.filter((r) => {
    const d = new Date(r.check_in_date);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return d >= weekAgo;
  }).length;

  const kioskUrl = `${window.location.origin}/kiosk`;

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-[#C9A84C]" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs tracking-widest uppercase text-[#C9A84C] mb-2">Track Attendance</p>
          <h1 className="text-3xl font-bold">Attendance</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.open("/kiosk", "_blank")}
            className="flex items-center gap-2 px-4 py-2.5 border border-[#C9A84C]/40 text-[#C9A84C] font-bold text-sm tracking-wide uppercase hover:bg-[#C9A84C]/10 transition-colors"
          >
            <ExternalLink size={16} /> Open Kiosk
          </button>
          <button
            onClick={() => setShowManual(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#C9A84C] text-black font-bold text-sm tracking-wide uppercase hover:bg-[#E0C97A] transition-colors"
          >
            <Plus size={16} /> Manual Check-In
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="border border-[#A8A9AD]/20 bg-black p-5">
          <p className="text-[10px] tracking-widest uppercase text-[#A8A9AD] mb-1">Today</p>
          <p className="text-2xl font-bold text-[#C9A84C]">{todayCount}</p>
        </div>
        <div className="border border-[#A8A9AD]/20 bg-black p-5">
          <p className="text-[10px] tracking-widest uppercase text-[#A8A9AD] mb-1">This Week</p>
          <p className="text-2xl font-bold">{thisWeekCount}</p>
        </div>
        <div className="border border-[#A8A9AD]/20 bg-black p-5">
          <p className="text-[10px] tracking-widest uppercase text-[#A8A9AD] mb-1">All Time</p>
          <p className="text-2xl font-bold">{records.length}</p>
        </div>
      </div>

      {/* Kiosk link */}
      <div className="border border-[#C9A84C]/20 bg-[#C9A84C]/5 p-4 flex items-center gap-3 flex-wrap">
        <Calendar size={18} className="text-[#C9A84C]" />
        <p className="text-sm text-[#A8A9AD] flex-1">
          Kiosk URL: <span className="text-white font-mono text-xs">{kioskUrl}</span>
        </p>
        <button
          onClick={() => navigator.clipboard.writeText(kioskUrl)}
          className="text-xs text-[#C9A84C] tracking-widest uppercase font-medium hover:text-[#E0C97A] transition-colors"
        >
          Copy Link
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-2 text-sm text-white focus:border-[#C9A84C] focus:outline-none"
        />
        <div className="flex-1 min-w-[200px] relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A9AD]" />
          <input
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            placeholder="Filter by student name..."
            className="w-full bg-transparent border border-[#A8A9AD]/30 pl-9 pr-4 py-2 text-sm text-white focus:border-[#C9A84C] focus:outline-none"
          />
        </div>
        {(filterDate || filterUser) && (
          <button onClick={() => { setFilterDate(""); setFilterUser(""); }} className="text-xs text-[#C9A84C] hover:text-[#E0C97A] tracking-widest uppercase">Clear</button>
        )}
      </div>

      {/* Records */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#A8A9AD]/20 text-left">
              <th className="py-3 px-4 text-[10px] tracking-widest uppercase text-[#A8A9AD] font-medium">Student</th>
              <th className="py-3 px-4 text-[10px] tracking-widest uppercase text-[#A8A9AD] font-medium">Class</th>
              <th className="py-3 px-4 text-[10px] tracking-widest uppercase text-[#A8A9AD] font-medium">Date & Time</th>
              <th className="py-3 px-4 text-[10px] tracking-widest uppercase text-[#A8A9AD] font-medium">Method</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-12 text-[#A8A9AD]">No attendance records found.</td></tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id} className="border-b border-[#A8A9AD]/10 hover:bg-white/5">
                  <td className="py-3 px-4 text-sm">{r.user_name}</td>
                  <td className="py-3 px-4 text-sm text-[#A8A9AD]">{r.class_name}</td>
                  <td className="py-3 px-4 text-sm text-[#A8A9AD]">{new Date(r.check_in_date).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</td>
                  <td className="py-3 px-4">
                    <span className={`text-[9px] tracking-widest uppercase px-2 py-1 border ${
                      r.check_in_method === "kiosk" ? "text-[#C9A84C] border-[#C9A84C]/30" : "text-[#A8A9AD] border-[#A8A9AD]/20"
                    }`}>{r.check_in_method}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Manual check-in modal */}
      {showManual && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setShowManual(false)}>
          <div className="w-full max-w-md border border-[#C9A84C]/30 bg-[#0A0A0A] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold">Manual Check-In</h3>
              <button onClick={() => setShowManual(false)} className="text-[#A8A9AD] hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={handleManualCheckIn} className="space-y-4">
              <div>
                <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Student *</label>
                <select
                  value={manualForm.user_id}
                  onChange={(e) => setManualForm({ ...manualForm, user_id: e.target.value })}
                  className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none"
                  required
                >
                  <option value="">Select student...</option>
                  {users.map((u) => <option key={u.id} value={u.id}>{u.full_name || u.email}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Class *</label>
                <select
                  value={manualForm.class_name}
                  onChange={(e) => setManualForm({ ...manualForm, class_name: e.target.value })}
                  className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none"
                  required
                >
                  <option value="">Select class...</option>
                  {[...new Set(classes.map((c) => c.class_name))].map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase py-3 hover:bg-[#E0C97A] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : "Record Attendance"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}