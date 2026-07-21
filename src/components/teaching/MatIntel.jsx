import { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Loader2, RefreshCw, Cake, HeartPulse, Star, Award, HelpCircle, AlertTriangle, Users, Flag } from "lucide-react";
import StudentFlagModal from "@/components/teaching/StudentFlagModal";

const alertConfig = {
  birthday: { icon: Cake, color: "text-pink-400", bg: "bg-pink-400/10", border: "border-pink-400/30" },
  injury: { icon: HeartPulse, color: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/30" },
  trial: { icon: Star, color: "text-[#C9A84C]", bg: "bg-[#C9A84C]/10", border: "border-[#C9A84C]/30" },
  ready_to_test: { icon: Award, color: "text-[#C9A84C]", bg: "bg-[#C9A84C]/10", border: "border-[#C9A84C]/30" },
  needs_help: { icon: HelpCircle, color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/30" },
  behavior: { icon: AlertTriangle, color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/30" },
};

export default function MatIntel() {
  const { user } = useAuth();
  const [roster, setRoster] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [flaggingStudent, setFlaggingStudent] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await base44.functions.invoke("getMatIntel", { class_name: selectedClass });
      const data = res.data || res;
      if (data.success) {
        setRoster(data.roster || []);
        setClasses(data.classes || []);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [selectedClass]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  const uniqueAttendees = roster.filter((r, i, arr) => arr.findIndex((x) => x.user_id === r.user_id) === i);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-[#C9A84C]" />
          <h2 className="text-lg font-bold">Mat Intel — Live Roster</h2>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedClass || ""}
            onChange={(e) => { setLoading(true); setSelectedClass(e.target.value || null); }}
            className="bg-black border border-[#A8A9AD]/30 px-3 py-2 text-sm text-white focus:border-[#C9A84C] focus:outline-none"
          >
            <option value="">All Classes Today</option>
            {classes.map((c) => <option key={c.id} value={c.class_name}>{c.class_name}</option>)}
          </select>
          <button onClick={() => { setLoading(true); load(); }} className="p-2 border border-[#A8A9AD]/30 hover:border-[#C9A84C] transition-colors">
            <RefreshCw size={16} className="text-[#A8A9AD]" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-[#C9A84C]" /></div>
      ) : uniqueAttendees.length === 0 ? (
        <div className="border border-[#A8A9AD]/20 p-8 text-center">
          <Users size={32} className="text-[#A8A9AD] mx-auto mb-3" />
          <p className="text-[#A8A9AD]">No students checked in yet.</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-[#A8A9AD]">{uniqueAttendees.length} student{uniqueAttendees.length !== 1 ? "s" : ""} on the mat</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {uniqueAttendees.map((student) => {
              const hasAlerts = student.alerts.length > 0;
              return (
                <button
                  key={student.user_id}
                  onClick={() => setFlaggingStudent(student)}
                  className={`border p-4 text-left transition-all hover:border-[#C9A84C]/40 flex items-start gap-3 ${hasAlerts ? "border-[#C9A84C]/30 bg-[#C9A84C]/5" : "border-[#A8A9AD]/20 bg-black"}`}
                >
                  <div className="w-10 h-10 bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center shrink-0">
                    {student.profile_photo ? <img src={student.profile_photo} className="w-full h-full object-cover" alt="" /> : <span className="text-[#C9A84C] font-bold text-sm">{student.full_name?.charAt(0)}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{student.full_name}</p>
                    <p className="text-xs text-[#A8A9AD]">{student.belt_rank || "No belt"}</p>
                    {hasAlerts && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {student.alerts.map((alert, i) => {
                          const cfg = alertConfig[alert.type] || alertConfig.needs_help;
                          const Icon = cfg.icon;
                          return (
                            <span key={i} className={`flex items-center gap-1 px-1.5 py-0.5 border ${cfg.border} ${cfg.bg}`} title={alert.label}>
                              <Icon size={10} className={cfg.color} />
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <Flag size={14} className="text-[#A8A9AD] shrink-0 mt-1" />
                </button>
              );
            })}
          </div>
        </>
      )}

      {flaggingStudent && (
        <StudentFlagModal
          student={flaggingStudent}
          instructor={user}
          onClose={() => setFlaggingStudent(null)}
        />
      )}
    </div>
  );
}