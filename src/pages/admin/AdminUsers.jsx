import { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { BELT_RANKS } from "@/lib/constants";
import BeltBadge from "@/components/BeltBadge";
import { Loader2, UserPlus, X, Mail, Send, KeyRound } from "lucide-react";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", role: "student", belt_rank: "White" });
  const [inviting, setInviting] = useState(false);
  const [search, setSearch] = useState("");
  const [editingPin, setEditingPin] = useState(null);
  const [pinValue, setPinValue] = useState("");

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
      await base44.users.inviteUser(inviteForm.email, inviteForm.role === "student" ? "user" : "admin");
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
    </div>
  );
}