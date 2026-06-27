import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle, Clock, Calendar, TrendingUp } from "lucide-react";

export default function ProgressTracker({ studentId, belt, enrollmentDate }) {
  const [attendanceCount, setAttendanceCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) { setLoading(false); return; }
    base44.entities.AttendanceRecord.filter({ user_id: studentId })
      .then((records) => {
        // Count classes since enrollment to current rank
        const relevant = enrollmentDate
          ? records.filter(r => new Date(r.check_in_date) >= new Date(enrollmentDate))
          : records;
        setAttendanceCount(relevant.length);
      })
      .catch(() => setAttendanceCount(0));
    setLoading(false);
  }, [studentId, enrollmentDate]);

  if (loading) return null;

  const minClasses = belt?.min_classes_required || 20;
  const minWeeks = belt?.min_time_in_grade || 8;
  const classProgress = Math.min(attendanceCount / minClasses, 1);

  // Time in grade calculation
  const weeksInGrade = enrollmentDate
    ? Math.floor((Date.now() - new Date(enrollmentDate).getTime()) / (7 * 24 * 60 * 60 * 1000))
    : 0;
  const timeProgress = Math.min(weeksInGrade / minWeeks, 1);

  const overallReady = classProgress >= 1 && timeProgress >= 1;

  return (
    <div className={`border p-5 ${overallReady ? "border-[#C9A84C]/50 bg-[#C9A84C]/10" : "border-[#A8A9AD]/20 bg-black"}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold tracking-widest uppercase text-[#A8A9AD]">Progress to Next Rank</h3>
          <p className="text-lg font-bold text-white mt-1">{belt?.belt_name || "Current Rank"}</p>
        </div>
        {overallReady ? (
          <div className="flex items-center gap-2 text-[#C9A84C]">
            <CheckCircle size={20} />
            <span className="text-sm font-bold">Ready to Test!</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-[#A8A9AD]">
            <TrendingUp size={20} />
            <span className="text-sm">In Progress</span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* Classes progress */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-[#A8A9AD] flex items-center gap-1.5"><CheckCircle size={12} /> Classes Attended</span>
            <span className="text-xs font-bold text-white">{attendanceCount} / {minClasses}</span>
          </div>
          <div className="h-2 bg-white/10 overflow-hidden rounded-full">
            <div className="h-full bg-[#C9A84C] transition-all duration-500 rounded-full" style={{ width: `${classProgress * 100}%` }} />
          </div>
        </div>

        {/* Time in grade progress */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-[#A8A9AD] flex items-center gap-1.5"><Clock size={12} /> Time in Grade</span>
            <span className="text-xs font-bold text-white">{weeksInGrade} / {minWeeks} weeks</span>
          </div>
          <div className="h-2 bg-white/10 overflow-hidden rounded-full">
            <div className="h-full bg-blue-500 transition-all duration-500 rounded-full" style={{ width: `${timeProgress * 100}%` }} />
          </div>
        </div>
      </div>

      <p className="text-xs text-[#A8A9AD] mt-4 flex items-center gap-1.5">
        <Calendar size={12} />
        {overallReady
          ? "You've met all requirements for your next belt test. Talk to your instructor!"
          : `Keep training! ${minClasses - attendanceCount > 0 ? `${minClasses - attendanceCount} more classes` : "Classes complete"} ${minWeeks - weeksInGrade > 0 ? `and ${minWeeks - weeksInGrade} more weeks` : "and time requirement met"} to go.`}
      </p>
    </div>
  );
}