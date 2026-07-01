import { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { BELT_RANKS } from "@/lib/constants";
import BeltBadge from "@/components/BeltBadge";
import { Loader2, UserPlus, X, Mail, Send, KeyRound, Ban, Trash2, AlertTriangle } from "lucide-react";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", role: "student", belt_rank: "White" });
  const [inviting, setInviting] = useState(false);
  const [search, setSearch] = useState("");
  const [editingPin, setEditingPin] = useState(null);
  const [pinValue, setPinValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      const data = await base44.entities.User.list();
      setUsers(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const updateBeltRank = async (userId, beltRank) => {
    try {
      await base44.entities.User.update(userId, { belt_rank: beltRank });
      setUsers(users.map((u) => u.id === userId ? { ...u, belt_rank: beltRank } : u));
    } catch (e) {
      console.error(e);
      alert("Failed to update belt rank.");
    }
  };

  const updateRole = async (userId, role) => {
    try {
      await base44.entities.User.update(userId, { role });
      setUsers(users.map((u) => u.id === userId ? { ...u, role } : u));
    } catch (e) {
      console.error(e);
      alert("Failed to update role.");
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteForm.email) return;
    setInviting(true);
    try {
      await base44.users.inviteUser(inviteForm.email, inviteForm.role === "admin" ? "admin" : "user");
      alert(`Invitation sent to ${inviteForm.email}`);
      setShowInvite(false);
      setInviteForm({ email: "", role: "student", belt_rank: "White" });
      loadUsers();
    } catch (e) {
      alert("Failed to invite user: " + e.message);
    }
    setInviting(false);
  };

  const updatePin = async (userId) => {
    if (pinValue.length < 4 || pinValue.length > 6 || !/^\d+$/.test(pinValue)) {
      alert("PIN must be 4-6 digits (numbers only).");
      return;
    }
    try {
      await base44.entities.User.update(userId, { pin_code: pinValue });
      setUsers(users.map((u) => u.id === userId ? { ...u, pin_code: pinValue } : u));
      setEditingPin(null);
      setPinValue("");
    } catch (e) {
      alert("Failed to update PIN: " + e.message);
    }
  };

  const handleCancelUser = async (userId) => {
    setActionLoading(true);
    try {
      const targetUser = users.find(u => u.id === userId);
      const familyId = targetUser?.family_id;
      const enrollments = await base44.entities.Enrollment.filter({ user_id: userId }).catch(() => []);
      for (const e of enrollments.filter(e => e.status === "active")) {
        await base44.entities.Enrollment.update(e.id, { status: "cancelled" });
      }
      if (familyId) {
        const billing = await base44.entities.BillingRecord.filter({ family_id: familyId }).catch(() => []);
        for (const b of billing.filter(b => b.status === "active")) {
          await base44.entities.BillingRecord.update(b.id, { status: "cancelled" });
        }
      }
      await base44.entities.User.update(userId, { role: "guest", subscription_status: "canceled", is_active: false });
      setUsers(users.map(u => u.id === userId ? { ...u, role: "guest", subscription_status: "canceled", is_active: false } : u));
      setCancelTarget(null);
    } catch (e) {
      alert("Failed to cancel membership: " + (e.response?.data?.error || e.message));
    }
    setActionLoading(false);
  };

  const handleDeleteUser = async (userId) => {
    setActionLoading(true);
    try {
      const [enrollments, emergencyContacts, customFieldValues, attendance, eventRegs, activityLogs] = await Promise.all([
        base44.entities.Enrollment.filter({ user_id: userId }).catch(() => []),
        base44.entities.EmergencyContact.filter({ user_id: userId }).catch(() => []),
        base44.entities.CustomFieldValue.filter({ user_id: userId }).catch(() => []),
        base44.entities.AttendanceRecord.filter({ user_id: userId }).catch(() => []),
        base44.entities.EventRegistration.filter({ user_id: userId }).catch(() => []),
        base44.entities.AdminActivityLog.filter({ user_id: userId }).catch(() => []),
      ]);
      if (enrollments.length) await base44.entities.Enrollment.deleteMany({ user_id: userId }).catch(() => {});
      if (emergencyContacts.length) await base44.entities.EmergencyContact.deleteMany({ user_id: userId }).catch(() => {});
      if (customFieldValues.length) await base44.entities.CustomFieldValue.deleteMany({ user_id: userId }).catch(() => {});
      if (attendance.length) await base44.entities.AttendanceRecord.deleteMany({ user_id: userId }).catch(() => {});
      if (eventRegs.length) await base44.entities.EventRegistration.deleteMany({ user_id: userId }).catch(() => {});
      if (activityLogs.length) await base44.entities.AdminActivityLog.deleteMany({ user_id: userId }).catch(() => {});
      await base44.entities.User.delete(userId);
      setUsers(users.filter(u => u.id !== userId));
      setDeleteTarget(null);
    } catch (e) {
      alert("Failed to delete user: " + (e.response?.data?.error || e.message));
    }
    setActionLoading(false);
  };

  const filtered = users.filter((u) =>
    !search || u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs tracking-widest uppercase text-[#C9A84C] mb-2">Member Management</p>
          <h1 className="text-3xl font-bold">Users</h1>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#C9A84C] text-black font-bold text-sm tracking-wide uppercase hover:bg-[#E0C97A] transition-colors"
        >
          <UserPlus size={18} /> Invite User
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name or email..."
        className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none transition-colors"
      />

      <div className="border border-[#C9A84C]/20 bg-[#C9A84C]/5 p-4 flex items-start gap-3">
        <KeyRound size={18} className="text-[#C9A84C] shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-white">Kiosk PIN Management</p>
          <p className="text-xs text-[#A8A9AD] mt-1">Set a 4-6 digit PIN for each admin to unlock the Front Desk Kiosk. Students use the same PIN for self check-in at the kiosk. Click "Set PIN" or "Change" next to any user to manage their code.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-[#C9A84C]" /></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#A8A9AD]/20 text-left">
                <th className="py-3 px-4 text-[10px] tracking-widest uppercase text-[#A8A9AD] font-medium">Name</th>
                <th className="py-3 px-4 text-[10px] tracking-widest uppercase text-[#A8A9AD] font-medium">Email</th>
                <th className="py-3 px-4 text-[10px] tracking-widest uppercase text-[#A8A9AD] font-medium">Belt Rank</th>
                <th className="py-3 px-4 text-[10px] tracking-widest uppercase text-[#A8A9AD] font-medium">Role</th>
                <th className="py-3 px-4 text-[10px] tracking-widest uppercase text-[#A8A9AD] font-medium">Kiosk PIN</th>
                <th className="py-3 px-4 text-[10px] tracking-widest uppercase text-[#A8A9AD] font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-[#A8A9AD]/10 hover:bg-white/5">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center text-xs font-bold text-[#C9A84C]">
                        {u.full_name?.charAt(0) || "?"}
                      </div>
                      <span className="text-sm font-medium">{u.full_name || "Unnamed"}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm text-[#A8A9AD]">{u.email}</td>
                  <td className="py-4 px-4">
                    <select
                      value={u.belt_rank || "White"}
                      onChange={(e) => updateBeltRank(u.id, e.target.value)}
                      className="bg-[#0A0A0A] border border-[#A8A9AD]/30 px-2 py-1.5 text-xs text-white focus:border-[#C9A84C] focus:outline-none"
                    >
                      {BELT_RANKS.map((rank) => <option key={rank} value={rank}>{rank}</option>)}
                    </select>
                  </td>
                  <td className="py-4 px-4">
                    <select
                      value={u.role || "student"}
                      onChange={(e) => updateRole(u.id, e.target.value)}
                      className="bg-[#0A0A0A] border border-[#A8A9AD]/30 px-2 py-1.5 text-xs text-white focus:border-[#C9A84C] focus:outline-none"
                    >
                      <option value="guest">Guest</option>
                      <option value="student">Student</option>
                      <option value="admin">Admin</option>
                      </select>
                      </td>
                      <td className="py-4 px-4">
                        {editingPin === u.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="password"
                          inputMode="numeric"
                          maxLength={6}
                          value={pinValue}
                          onChange={(e) => setPinValue(e.target.value.replace(/\D/g, ""))}
                          placeholder="4-6 digits"
                          className="w-24 bg-[#0A0A0A] border border-[#C9A84C]/50 px-2 py-1.5 text-xs text-white focus:outline-none"
                          autoFocus
                          onKeyDown={(e) => { if (e.key === "Enter") updatePin(u.id); if (e.key === "Escape") { setEditingPin(null); setPinValue(""); } }}
                        />
                        <button onClick={() => updatePin(u.id)} className="text-xs text-[#C9A84C] font-bold hover:text-[#E0C97A]">Save</button>
                        <button onClick={() => { setEditingPin(null); setPinValue(""); }} className="text-xs text-[#A8A9AD] hover:text-white">Cancel</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditingPin(u.id); setPinValue(""); }}
                        className={`text-xs font-medium ${u.pin_code ? "text-[#C9A84C] hover:text-[#E0C97A]" : "text-[#A8A9AD] hover:text-white"}`}
                      >
                        {u.pin_code ? "•••• Change" : "Set PIN"}
                      </button>
                    )}
                    </td>
                    <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCancelTarget(u)}
                        disabled={u.role === "admin"}
                        className="p-1.5 border border-orange-500/30 text-orange-400 hover:bg-orange-500/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Cancel Membership"
                      >
                        <Ban size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(u)}
                        disabled={u.role === "admin"}
                        className="p-1.5 border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Delete Profile"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    </td>
                    </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Invite modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setShowInvite(false)}>
          <div className="w-full max-w-md border border-[#C9A84C]/30 bg-[#0A0A0A] p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Invite New User</h2>
              <button onClick={() => setShowInvite(false)} className="text-[#A8A9AD] hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Email *</label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-3 text-sm text-white focus:border-[#C9A84C] focus:outline-none"
                  placeholder="student@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Role</label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                  className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-3 text-sm text-white focus:border-[#C9A84C] focus:outline-none"
                >
                  <option value="guest">Guest</option>
                  <option value="student">Student</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Starting Belt Rank</label>
                <select
                  value={inviteForm.belt_rank}
                  onChange={(e) => setInviteForm({ ...inviteForm, belt_rank: e.target.value })}
                  className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-3 text-sm text-white focus:border-[#C9A84C] focus:outline-none"
                >
                  {BELT_RANKS.map((rank) => <option key={rank} value={rank}>{rank}</option>)}
                </select>
                <p className="text-xs text-[#A8A9AD] mt-2">Note: Belt rank will be set after the user accepts their invitation and logs in for the first time.</p>
              </div>
              <button
                type="submit"
                disabled={inviting}
                className="w-full bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase py-3 hover:bg-[#E0C97A] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {inviting ? <Loader2 size={18} className="animate-spin" /> : <><Mail size={16} /> Send Invitation</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Cancel confirmation */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => !actionLoading && setCancelTarget(null)}>
          <div className="w-full max-w-md border border-orange-500/30 bg-[#0A0A0A] p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle size={20} className="text-orange-400 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-xl font-bold">Cancel Membership?</h2>
                <p className="text-sm text-[#A8A9AD] mt-2">This will revoke <strong className="text-white">{cancelTarget.full_name || cancelTarget.email}</strong>'s student access, cancel active enrollments and billing, and set their role to Guest. The user account will remain but with limited access.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleCancelUser(cancelTarget.id)} disabled={actionLoading} className="flex-1 px-4 py-3 bg-orange-500 text-white font-bold text-sm tracking-wide uppercase hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2">
                {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <><Ban size={16} /> Cancel Membership</>}
              </button>
              <button onClick={() => setCancelTarget(null)} disabled={actionLoading} className="px-4 py-3 text-sm text-[#A8A9AD] hover:text-white">Back</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => !actionLoading && setDeleteTarget(null)}>
          <div className="w-full max-w-md border border-red-500/30 bg-[#0A0A0A] p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle size={20} className="text-red-400 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-xl font-bold">Delete Profile?</h2>
                <p className="text-sm text-[#A8A9AD] mt-2">This will <strong className="text-red-400">permanently delete</strong> <strong className="text-white">{deleteTarget.full_name || deleteTarget.email}</strong>'s account and all associated records (enrollments, attendance, emergency contacts, etc.). This cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleDeleteUser(deleteTarget.id)} disabled={actionLoading} className="flex-1 px-4 py-3 bg-red-500 text-white font-bold text-sm tracking-wide uppercase hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2">
                {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <><Trash2 size={16} /> Delete Permanently</>}
              </button>
              <button onClick={() => setDeleteTarget(null)} disabled={actionLoading} className="px-4 py-3 text-sm text-[#A8A9AD] hover:text-white">Back</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}