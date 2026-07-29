import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { computeIsMinor, computeAge } from "@/lib/studentAccess";
import { Loader2, Shield, MessageSquare, Users, Lock, Info } from "lucide-react";

// Admin-facing view of a student's access controls. Shows guardian-set
// permissions and provides an admin lock override (admin_locked) that
// instantly restricts the minor regardless of guardian settings.
export default function StudentAccessControls({ user, logActivity }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isMinor = computeIsMinor(user?.dob);
  const age = computeAge(user?.dob);

  const load = async () => {
    if (!user?.id) return;
    try {
      const res = await base44.entities.StudentAccessSettings.filter({ student_id: user.id });
      setSettings(res[0] || null);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [user?.id]);

  const save = async (changes) => {
    setSaving(true);
    try {
      await base44.functions.invoke("saveStudentAccess", {
        studentId: user.id,
        allowCommunity: changes.allowCommunity ?? settings?.allow_community ?? false,
        allowMemberDirectMessages: changes.allowMemberDirectMessages ?? settings?.allow_member_direct_messages ?? false,
        adminLocked: changes.adminLocked ?? settings?.admin_locked ?? false,
      });
      await logActivity("edit", `Updated access controls for ${user.full_name || user.email}`);
      await load();
    } catch (e) {
      alert("Failed to update: " + (e.message || "unknown error"));
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-[#C9A84C]" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 border-b border-[#A8A9AD]/20 pb-3">
        <Shield size={18} className="text-[#C9A84C]" />
        <h3 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C]">Access Controls</h3>
        {isMinor ? (
          <span className="text-xs tracking-widest uppercase text-[#C9A84C] border border-[#C9A84C]/40 px-2 py-0.5">
            Minor{age !== null ? ` · ${age} yrs` : ""}
          </span>
        ) : (
          <span className="text-xs tracking-widest uppercase text-[#A8A9AD]">Adult — unrestricted</span>
        )}
      </div>

      {!isMinor ? (
        <div className="border border-[#A8A9AD]/20 bg-black p-4 flex items-start gap-3">
          <Info size={16} className="text-[#A8A9AD] shrink-0 mt-0.5" />
          <p className="text-xs text-[#A8A9AD]">
            Access controls only apply to students under 18. Set a date of birth on the student's profile to enable
            parental controls.
          </p>
        </div>
      ) : (
        <>
          {settings?.set_by_guardian_name && (
            <p className="text-xs text-[#A8A9AD]">
              Last updated by guardian <span className="text-white font-medium">{settings.set_by_guardian_name}</span>.
            </p>
          )}

          <PermissionRow
            icon={Users}
            label="Community Feed"
            description="View and post in the private academy community"
            enabled={!!settings?.allow_community && !settings?.admin_locked}
            disabled={saving || !!settings?.admin_locked}
            onToggle={() => save({ allowCommunity: !settings?.allow_community })}
          />
          <PermissionRow
            icon={MessageSquare}
            label="Direct Message Members"
            description="Start conversations with other students"
            enabled={!!settings?.allow_member_direct_messages && !settings?.admin_locked}
            disabled={saving || !!settings?.admin_locked}
            onToggle={() => save({ allowMemberDirectMessages: !settings?.allow_member_direct_messages })}
          />

          <div className="border border-red-500/30 bg-red-500/5 p-4 mt-2">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-start gap-3 flex-1 min-w-[200px]">
                <Lock size={18} className="text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-white">Admin Lock Override</p>
                  <p className="text-xs text-[#A8A9AD] mt-1">
                    Instantly restrict Community and member DMs for this student, overriding guardian settings.
                    Front Desk contact remains available.
                  </p>
                </div>
              </div>
              <button
                onClick={() => save({ adminLocked: !settings?.admin_locked })}
                disabled={saving}
                className={`px-4 py-2.5 text-xs font-bold tracking-wide uppercase transition-colors shrink-0 ${
                  settings?.admin_locked
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "border border-red-500/40 text-red-400 hover:bg-red-500/10"
                } disabled:opacity-50`}
              >
                {settings?.admin_locked ? "Locked — Unlock" : "Lock Access"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function PermissionRow({ icon: Icon, label, description, enabled, disabled, onToggle }) {
  return (
    <div className="flex items-center justify-between gap-4 border border-[#A8A9AD]/15 bg-black px-4 py-3">
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