import { useEffect, useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useFamily } from "@/lib/FamilyContext";
import { QrCode, ChevronRight, Trophy, Video, Users, Clock, Loader2, KeyRound, CheckCircle2, Sparkles } from "lucide-react";
import IDCard from "@/components/portal/checkin/IDCard";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function formatTime(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  if (isNaN(h)) return t;
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

function nowTimeStr() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function UpNextHero({ profile }) {
  const { isGuardian } = useFamily();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [todayClasses, setTodayClasses] = useState([]);
  const [postClass, setPostClass] = useState(false);
  const [activeChallenges, setActiveChallenges] = useState([]);
  const [showIDCard, setShowIDCard] = useState(false);
  const [promptIndex, setPromptIndex] = useState(0);

  const uid = profile?.id;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!uid) return;
      setLoading(true);
      try {
        const [enrollments, allClasses, attendance, challenges] = await Promise.all([
          base44.entities.Enrollment.filter({ user_id: uid, status: "active" }).catch(() => []),
          base44.entities.ClassSchedule.filter({ is_active: true }).catch(() => []),
          base44.entities.AttendanceRecord.filter({ user_id: uid }).catch(() => []),
          base44.entities.Challenge.filter({ status: "active" }).catch(() => []),
        ]);
        if (cancelled) return;

        const enrolledProgramIds = enrollments.map((e) => e.program_id).filter(Boolean);
        const todayName = DAYS[new Date().getDay()];
        const nowStr = nowTimeStr();
        const eligible = allClasses
          .filter((c) => c.day_of_week === todayName)
          .map((c) => {
            const linkedIds = c.linked_program_ids
              ? c.linked_program_ids.split(",")
              : c.linked_program_id
              ? [c.linked_program_id]
              : [];
            const matched = linkedIds.length === 0 ? false : linkedIds.some((id) => enrolledProgramIds.includes(id));
            return { ...c, _matched: matched };
          })
          .filter((c) => c._matched && c.start_time && c.start_time >= nowStr)
          .sort((a, b) => a.start_time.localeCompare(b.start_time));

        setTodayClasses(eligible);

        const sorted = attendance.sort(
          (a, b) => new Date(b.check_in_date) - new Date(a.check_in_date)
        );
        const latest = sorted[0];
        const within3h =
          latest && Date.now() - new Date(latest.check_in_date).getTime() < 3 * 60 * 60 * 1000;
        setPostClass(!!within3h);
        setActiveChallenges(challenges);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [uid]);

  // Auto-rotate the post-class priority prompts every 5s
  useEffect(() => {
    if (!postClass) return;
    const id = setInterval(() => setPromptIndex((i) => (i + 1) % 3), 5000);
    return () => clearInterval(id);
  }, [postClass]);

  const prompts = useMemo(() => {
    const firstName = (profile?.full_name || "").split(" ")[0] || "Student";
    return [
      {
        priority: 1,
        icon: Trophy,
        title: "Log Your Challenge Points",
        desc: isGuardian
          ? `Verify ${firstName}'s challenge activity and approve their points.`
          : "Just finished class? Log your activity and earn your badge.",
        cta: "Log Points",
        path: "/portal/progress",
        disabled: activeChallenges.length === 0,
      },
      {
        priority: 2,
        icon: Video,
        title: "Watch Next-Rank Videos",
        desc: "Review the curriculum videos for your upcoming belt requirements.",
        cta: "Open Training Vault",
        path: "/portal/curriculum",
      },
      {
        priority: 3,
        icon: Users,
        title: "Share the Hype",
        desc: "Post a class highlight to the community and keep the energy going.",
        cta: "Go to Community",
        path: "/portal/community",
      },
    ];
  }, [profile, isGuardian, activeChallenges]);

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(uid || "")}&color=000000&bgcolor=FFFFFF`;

  if (loading) {
    return (
      <div className="border border-[#C9A84C]/30 bg-gradient-to-br from-[#C9A84C]/10 to-transparent p-6 flex items-center justify-center min-h-[220px]">
        <Loader2 size={24} className="animate-spin text-[#C9A84C]" />
      </div>
    );
  }

  // ===== POST-CLASS STATE =====
  if (postClass) {
    const p = prompts[promptIndex];
    const Icon = p.icon;
    const remaining = prompts.filter((x) => !x.disabled);
    return (
      <div className="border border-[#C9A84C]/30 bg-gradient-to-br from-[#C9A84C]/15 to-transparent p-6">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 size={18} className="text-[#C9A84C]" />
          <h2 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C]">
            Great class — what's next?
          </h2>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 border border-[#C9A84C]/40 flex items-center justify-center shrink-0">
            <Icon size={22} className="text-[#C9A84C]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] tracking-widest uppercase text-[#A8A9AD] mb-1">
              Priority {p.priority}
            </p>
            <h3 className="text-lg font-bold mb-1">{p.title}</h3>
            <p className="text-sm text-[#A8A9AD] mb-4">{p.desc}</p>
            <button
              onClick={() => navigate(p.path)}
              disabled={p.disabled}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#C9A84C] text-black text-sm font-bold tracking-wide hover:bg-[#E0C97A] transition-colors disabled:opacity-40"
            >
              {p.cta} <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Rotation dots */}
        <div className="flex items-center gap-2 mt-5">
          {prompts.map((x, i) => (
            <button
              key={i}
              onClick={() => !x.disabled && setPromptIndex(i)}
              disabled={x.disabled}
              className={`h-1.5 transition-all ${
                i === promptIndex ? "w-8 bg-[#C9A84C]" : x.disabled ? "w-3 bg-[#A8A9AD]/20" : "w-3 bg-[#A8A9AD]/40"
              }`}
              aria-label={`Prompt ${i + 1}`}
            />
          ))}
          <span className="text-[10px] tracking-widest uppercase text-[#A8A9AD] ml-auto">
            {promptIndex + 1} of {remaining.length}
          </span>
        </div>
      </div>
    );
  }

  // ===== PRE-CLASS STATE (default) =====
  return (
    <div className="border border-[#C9A84C]/30 bg-gradient-to-br from-[#C9A84C]/10 to-transparent p-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={18} className="text-[#C9A84C]" />
        <h2 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C]">Up Next Today</h2>
      </div>

      {/* Scrollable list of eligible upcoming classes */}
      <div className="max-h-52 overflow-y-auto scrollbar-hide space-y-2 mb-5">
        {todayClasses.length === 0 ? (
          <div className="text-center py-6">
            <Clock size={24} className="text-[#A8A9AD]/40 mx-auto mb-2" />
            <p className="text-sm text-[#A8A9AD]">No more eligible classes scheduled for today.</p>
            <Link to="/portal/schedule" className="text-xs text-[#C9A84C] hover:underline mt-1 inline-block">
              View full schedule
            </Link>
          </div>
        ) : (
          todayClasses.map((c) => (
            <div key={c.id} className="flex items-center gap-3 border border-[#A8A9AD]/20 bg-black/40 px-3 py-2.5">
              <div className="text-center shrink-0 w-16">
                <p className="text-sm font-bold text-[#C9A84C]">{formatTime(c.start_time)}</p>
                {c.end_time && <p className="text-[10px] text-[#A8A9AD]">{formatTime(c.end_time)}</p>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{c.class_name}</p>
                <p className="text-xs text-[#A8A9AD] truncate">
                  {c.instructor ? `${c.instructor} · ` : ""}
                  {c.location || "Dojo"}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Digital Check-In Barcode + PIN */}
      <div className="border-t border-[#A8A9AD]/20 pt-5">
        <p className="text-[10px] tracking-widest uppercase text-[#A8A9AD] mb-3">Digital Check-In</p>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="bg-white p-2 shrink-0">
            <img src={qrUrl} alt="Check-in barcode" className="w-28 h-28" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
              <KeyRound size={14} className="text-[#C9A84C]" />
              <span className="text-[10px] tracking-widest uppercase text-[#A8A9AD]">Check-In PIN</span>
            </div>
            <p className="text-3xl font-mono tracking-[0.4em] text-white mb-2">• • • •</p>
            <button
              onClick={() => setShowIDCard(true)}
              className="inline-flex items-center gap-1.5 text-xs text-[#C9A84C] hover:underline"
            >
              <QrCode size={14} /> View barcode / set PIN
            </button>
            <p className="text-[11px] text-[#A8A9AD]/70 mt-2">
              For security, your PIN isn't displayed. Set or reset it anytime.
            </p>
          </div>
        </div>
      </div>

      {showIDCard && <IDCard user={profile} onClose={() => setShowIDCard(false)} />}
    </div>
  );
}