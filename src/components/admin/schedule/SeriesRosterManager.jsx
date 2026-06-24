import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { getOccurrencesInRange } from "@/lib/scheduleUtils";
import { Loader2, X, UserPlus, Trash2, Users } from "lucide-react";

export default function SeriesRosterManager({ cls, onClose }) {
  const [enrollments, setEnrollments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [enrolls, allUsers] = await Promise.all([
          base44.entities.SeriesEnrollment.filter({ class_id: cls.id, status: "active" }),
          base44.entities.User.list(),
        ]);
        setEnrollments(enrolls);
        setUsers(allUsers);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [cls.id]);

  const seriesDates = cls.series_start_date && cls.series_end_date
    ? getOccurrencesInRange(cls, cls.series_start_date, cls.series_end_date)
    : [];

  const enrolledUserIds = new Set(enrollments.map(e => e.user_id));
  const filteredUsers = search.length >= 2
    ? users.filter(u => !enrolledUserIds.has(u.id) && (u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())))
    : [];

  const handleAdd = async (user) => {
    setAdding(true);
    try {
      let dates = [];
      if (cls.require_full_series_signup) {
        dates = seriesDates.map(d => d.toISOString().split("T")[0]);
      } else if (seriesDates.length > 0) {
        dates = [seriesDates[0].toISOString().split("T")[0]];
      }
      if (dates.length === 0) {
        alert("No session dates found for this series.");
        setAdding(false);
        return;
      }
      await base44.entities.SeriesEnrollment.create({
        class_id: cls.id,
        class_name: cls.class_name,
        user_id: user.id,
        user_name: user.full_name,
        series_start_date: cls.series_start_date,
        series_end_date: cls.series_end_date,
        enrolled_dates: dates.join(","),
        status: "active",
        enrollment_date: new Date().toISOString(),
      });
      const enrolls = await base44.entities.SeriesEnrollment.filter({ class_id: cls.id, status: "active" });
      setEnrollments(enrolls);
      setShowAdd(false);
      setSearch("");
    } catch (e) {
      alert("Failed to add student: " + e.message);
    }
    setAdding(false);
  };

  const handleRemove = async (id) => {
    if (!confirm("Remove this student from the series?")) return;
    try {
      await base44.entities.SeriesEnrollment.delete(id);
      setEnrollments(enrollments.filter(e => e.id !== id));
    } catch (e) { alert("Failed to remove"); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="w-full max-w-2xl border border-[#C9A84C]/30 bg-[#0A0A0A] p-8 my-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Users size={20} className="text-[#C9A84C]" />
            <div>
              <h2 className="text-xl font-bold">Series Roster</h2>
              <p className="text-xs text-[#A8A9AD]">{cls.class_name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#A8A9AD] hover:text-white"><X size={20} /></button>
        </div>

        <div className="bg-[#C9A84C]/5 border border-[#C9A84C]/20 p-4 mb-6">
          <p className="text-sm text-white">
            <span className="font-bold">{seriesDates.length}</span> session{seriesDates.length !== 1 ? "s" : ""} in this series
            {cls.series_start_date && cls.series_end_date && (
              <span className="text-[#A8A9AD]"> · {new Date(cls.series_start_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })} → {new Date(cls.series_end_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
            )}
          </p>
          {cls.require_full_series_signup ? (
            <p className="text-xs text-[#C9A84C] mt-1">✓ Full series sign-up required — students are enrolled in all {seriesDates.length} dates automatically.</p>
          ) : (
            <p className="text-xs text-[#A8A9AD] mt-1">Students are enrolled in the first session only. They can join additional dates manually.</p>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-[#C9A84C]" /></div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold tracking-widest uppercase text-[#A8A9AD]">Enrolled Students ({enrollments.length})</h3>
              <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-2 px-4 py-2 bg-[#C9A84C] text-black font-bold text-xs tracking-wide uppercase hover:bg-[#E0C97A] transition-colors">
                <UserPlus size={14} /> Add Student
              </button>
            </div>

            {showAdd && (
              <div className="border border-[#A8A9AD]/20 p-4 mb-4">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
                  placeholder="Search by name or email..."
                  className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-3 text-sm text-white focus:border-[#C9A84C] focus:outline-none mb-3"
                />
                {filteredUsers.length > 0 ? (
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {filteredUsers.map(u => (
                      <button
                        key={u.id}
                        onClick={() => handleAdd(u)}
                        disabled={adding}
                        className="w-full text-left px-4 py-3 border border-[#A8A9AD]/20 hover:bg-[#C9A84C]/10 transition-colors flex items-center gap-3"
                      >
                        <div className="w-10 h-10 bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center text-sm font-bold text-[#C9A84C]">{u.full_name?.charAt(0) || "?"}</div>
                        <div>
                          <p className="text-sm font-medium">{u.full_name}</p>
                          <p className="text-xs text-[#A8A9AD]">{u.email}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : search.length >= 2 ? (
                  <p className="text-sm text-[#A8A9AD] text-center py-4">No students found.</p>
                ) : (
                  <p className="text-sm text-[#A8A9AD] text-center py-4">Start typing to search for students.</p>
                )}
              </div>
            )}

            {enrollments.length === 0 ? (
              <p className="text-sm text-[#A8A9AD] text-center py-8">No students enrolled yet.</p>
            ) : (
              <div className="space-y-2">
                {enrollments.map(e => {
                  const dateCount = e.enrolled_dates ? e.enrolled_dates.split(",").filter(Boolean).length : 0;
                  return (
                    <div key={e.id} className="border border-[#A8A9AD]/20 p-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{e.user_name}</p>
                        <p className="text-xs text-[#A8A9AD]">Enrolled in {dateCount} of {seriesDates.length} session{seriesDates.length !== 1 ? "s" : ""}</p>
                      </div>
                      <button onClick={() => handleRemove(e.id)} className="p-2 text-[#A8A9AD] hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}