import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { getNextOccurrence, getOccurrencesInRange, isClassCancelledOnDate } from "@/lib/scheduleUtils";
import { Loader2, X, CalendarX, RotateCcw, CalendarPlus } from "lucide-react";

export default function CancelOccurrenceModal({ cls, customDates, cancellations, onClose, onChanged }) {
  const [loading, setLoading] = useState(true);
  const [upcoming, setUpcoming] = useState([]);
  const [existing, setExisting] = useState([]);
  const [actioning, setActioning] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const load = async () => {
      const [u, cancels] = await Promise.all([
        base44.auth.me().catch(() => null),
        base44.entities.ClassCancellation.filter({ class_id: cls.id }).catch(() => []),
      ]);
      setUser(u);
      setExisting(cancels.sort((a, b) => (a.cancelled_date || "").localeCompare(b.cancelled_date || "")));

      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const rangeEnd = new Date(now);
      rangeEnd.setDate(rangeEnd.getDate() + 90);
      const dates = getOccurrencesInRange(cls, now, rangeEnd, customDates);
      setUpcoming(dates.filter(d => !isClassCancelledOnDate(cls, d, cancels)).slice(0, 12));
      setLoading(false);
    };
    load();
  }, [cls, customDates]);

  const cancelDate = async (date) => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    setActioning(dateStr);
    try {
      await base44.entities.ClassCancellation.create({
        class_id: cls.id,
        class_name: cls.class_name,
        cancelled_date: dateStr,
        cancelled_by_id: user?.id || "",
        cancelled_by_name: user?.full_name || "",
      });
      const cancels = await base44.entities.ClassCancellation.filter({ class_id: cls.id }).catch(() => []);
      setExisting(cancels.sort((a, b) => (a.cancelled_date || "").localeCompare(b.cancelled_date || "")));
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const rangeEnd = new Date(now);
      rangeEnd.setDate(rangeEnd.getDate() + 90);
      const dates = getOccurrencesInRange(cls, now, rangeEnd, customDates);
      setUpcoming(dates.filter(d => !isClassCancelledOnDate(cls, d, cancels)).slice(0, 12));
      onChanged();
    } catch (e) {
      alert("Failed to cancel: " + e.message);
    }
    setActioning(null);
  };

  const restoreDate = async (cancellation) => {
    setActioning(cancellation.id);
    try {
      await base44.entities.ClassCancellation.delete(cancellation.id);
      const cancels = await base44.entities.ClassCancellation.filter({ class_id: cls.id }).catch(() => []);
      setExisting(cancels.sort((a, b) => (a.cancelled_date || "").localeCompare(b.cancelled_date || "")));
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const rangeEnd = new Date(now);
      rangeEnd.setDate(rangeEnd.getDate() + 90);
      const dates = getOccurrencesInRange(cls, now, rangeEnd, customDates);
      setUpcoming(dates.filter(d => !isClassCancelledOnDate(cls, d, cancels)).slice(0, 12));
      onChanged();
    } catch (e) {
      alert("Failed to restore: " + e.message);
    }
    setActioning(null);
  };

  const fmtDate = (d) => new Date(d + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  const fmtDateObj = (d) => d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="w-full max-w-lg border border-[#C9A84C]/30 bg-[#0A0A0A] p-8 my-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <CalendarX size={20} className="text-[#C9A84C]" />
            <h2 className="text-xl font-bold">Cancel Single Occurrence</h2>
          </div>
          <button onClick={onClose} className="text-[#A8A9AD] hover:text-white"><X size={20} /></button>
        </div>

        <p className="text-sm text-[#A8A9AD] mb-1">{cls.class_name}</p>
        <p className="text-xs text-[#A8A9AD] mb-6">Cancel an individual class date without affecting the rest of the recurring pattern.</p>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-[#C9A84C]" /></div>
        ) : (
          <div className="space-y-6">
            <div>
              <h3 className="text-xs tracking-widest uppercase text-[#C9A84C] mb-3 flex items-center gap-2"><CalendarPlus size={14} /> Upcoming Occurrences</h3>
              {upcoming.length === 0 ? (
                <p className="text-sm text-[#A8A9AD]">No upcoming occurrences in the next 90 days.</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {upcoming.map((date, i) => {
                    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
                    return (
                      <div key={i} className="flex items-center justify-between border border-[#A8A9AD]/20 p-3">
                        <span className="text-sm text-white">{fmtDateObj(date)}</span>
                        <button
                          onClick={() => cancelDate(date)}
                          disabled={actioning === dateStr}
                          className="flex items-center gap-1 px-3 py-1.5 border border-red-500/30 text-red-400 text-xs font-bold tracking-wide uppercase hover:bg-red-500/10 transition-colors disabled:opacity-50"
                        >
                          {actioning === dateStr ? <Loader2 size={12} className="animate-spin" /> : <CalendarX size={12} />} Cancel
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {existing.length > 0 && (
              <div>
                <h3 className="text-xs tracking-widest uppercase text-[#C9A84C] mb-3 flex items-center gap-2"><CalendarX size={14} /> Cancelled Dates ({existing.length})</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {existing.map((c) => (
                    <div key={c.id} className="flex items-center justify-between border border-red-500/20 bg-red-500/5 p-3">
                      <div>
                        <span className="text-sm text-white line-through opacity-70">{fmtDate(c.cancelled_date)}</span>
                        {c.cancelled_by_name && <span className="text-xs text-[#A8A9AD] ml-2">by {c.cancelled_by_name}</span>}
                      </div>
                      <button
                        onClick={() => restoreDate(c)}
                        disabled={actioning === c.id}
                        className="flex items-center gap-1 px-3 py-1.5 border border-[#C9A84C]/30 text-[#C9A84C] text-xs font-bold tracking-wide uppercase hover:bg-[#C9A84C]/10 transition-colors disabled:opacity-50"
                      >
                        {actioning === c.id ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />} Restore
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}