import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useFamily } from "@/lib/FamilyContext";
import { computeIsMinor, computeAge } from "@/lib/studentAccess";
import { Loader2, Shield, MessageSquare, Users, Lock, Info } from "lucide-react";

// Guardian-facing parental controls. Lists each student in the family,
// flags minors (under 18 from DOB), and toggles Community + member DM access.
// Adults are shown as unrestricted. Saves run through the saveStudentAccess
// backend function (which validates the caller is a guardian in the family).
export default function AccessControls() {
  const { user } = useAuth();
  const { members, familyGroup } = useFamily();
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  const students = (members || []).filter((m) => m.family_role === "student");

  const loadSettings = async () => {
    if (!user?.family_id || students.length === 0) { setLoading(false); return; }
    try {
      const all = await base44.entities.StudentAccessSettings.filter({ family_id: user.family_id });
      setSettings(all);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadSettings(); }, [user?.family_id, students.length]);

  const getSettings = (studentId) => settings.find((s) => s.student_id === studentId) || null;

  const toggle = async (student, field) => {
    const current = getSettings(student.id) || {};
    const nextValue = !current[field];
    setSavingId(student.id);
    try {
      await base44.functions.invoke("saveStudentAccess", {
        studentId: student.id,
        allowCommunity: field === "allow_community" ? nextValue : (current.allow_community || false),
        allowMemberDirectMessages: field === "allow_member_direct_messages" ? nextValue : (current.allow_member_direct_messages || false),
      });
      await loadSettings();
    } catch (e) {
      alert("Failed to update: " + (e.message || "unknown error"));
    }
    setSavingId(null);
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-[#C9A84C]" /></div>;
  }

  if (students.length === 0) {
    return (
      <div className="border border-[#A8A9AD]/20 bg-black p-8 text-center">
        <Users size={28} className="text-[#A8A9AD] mx-auto mb-3" />
        <p className="text-[#A8A9AD] text-sm">No students in this family group yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="border border-[#C9A84C]/30 bg-[#C9A84C]/5 p-4 flex items-start gap-3">
        <Info size={18} className="text-[#C9A84C] shrink-0 mt-0.5" />
        <p className="text-xs text-[#A8A9AD]">
          Students under 18 are flagged as <span className="text-white font-medium">minors</span> based on their
          date of birth. By default, minors cannot access the Community feed or direct-message other members.
          Enable features below as you see fit. Direct messages to admins and the Front Desk are always allowed.
        </p>
      </div>

      {students.map((student) => {
        const s = getSettings(student.id);
        const isMinor = computeIsMinor(student.dob);
        const age = computeAge(student.dob);
        const adminLocked = !!s?.admin_locked;

        return (
          <div key={student.id} className="border border-[#A8A9AD]/20 bg-black p-5">
            <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center shrink-0">
                  <span className="text-[#C9A84C] font-bold">{student.full_name?.charAt(0) || "?"}</span>
                </div>
                <div>
                  <p className="text-sm font-medium">{student.full_name || "Unnamed"}</p>
                  <p className="text-xs text-[#A8A9AD]">{student.email}</p>
                </div>
              </div>
              {isMinor ? (
                <span className="flex items-center gap-1.5 text-xs tracking-widest uppercase text-[#C9A84C] border border-[#C9A84C]/40 px-2.5 py-1">
                  <Shield size={12} /> Minor{age !== null ? ` · ${age} yrs` : ""}
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs tracking-widest uppercase text-[#A8A9AD]">
                  Adult — no restrictions
                </span>
              )}
            </div>

            {adminLocked && (
              <div className="mb-4 flex items-center gap-2 border border-red-500/30 bg-red-500/5 px-3 py-2">
                <Lock size={14} className="text-red-400 shrink-0" />
                <p className="text-xs text-red-300">
                  An administrator has locked this student's access. Contact the academy to review.
                </p>
              </div>
            )}

            {!isMinor ? (
              <p className="text-xs text-[#A8A9AD]">
                Access controls only apply to students under 18. To set a date of birth, edit the student's profile.
              </p>
            ) : (
              <div className="space-y-3">
                <PermissionToggle
                  icon={Users}
                  label="Community Feed"
                  description="View and post in the private academy community"
                  enabled={!!s?.allow_community && !adminLocked}
                  disabled={adminLocked || savingId === student.id}
                  onToggle={() => toggle(student, "allow_community")}
                />
                <PermissionToggle
                  icon={MessageSquare}
                  label="Direct Message Members"
                  description="Start conversations with other students. Front Desk is always available."
                  enabled={!!s?.allow_member_direct_messages && !adminLocked}
                  disabled={adminLocked || savingId === student.id}
                  onToggle={() => toggle(student, "allow_member_direct_messages")}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PermissionToggle({ icon: Icon, label, description, enabled, disabled, onToggle }) {
  return (
    <div className="flex items-center justify-between gap-4 border border-[#A8A9AD]/15 px-4 py-3">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <Icon size={18} className={enabled ? "text-[#C9A84C] shrink-0 mt-0.5" : "text-[#A8A9AD] shrink-0 mt-0.5"} />
        <div className="min-w-0">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-[#A8A9AD]">{description}</p>
        </div>
      </div>
      <button
        onClick={onToggle}
        disabled={disabled}
        className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${
          enabled ? "bg-[#C9A84C]" : "bg-[#A8A9AD]/25"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        aria-pressed={enabled}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
            enabled ? "translate-x-6" : ""
          }`}
        />
      </button>
    </div>
  );
}