import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Plus, X, Users, Trash2, UserPlus, Lock, Globe } from "lucide-react";

export default function GroupManager({ currentUser }) {
  const [groups, setGroups] = useState([]);
  const [members, setMembers] = useState({});
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ group_name: "", description: "", is_private: false });
  const [saving, setSaving] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState(null);
  const [showAddMember, setShowAddMember] = useState(null);

  const load = async () => {
    try {
      const [g, users] = await Promise.all([
        base44.entities.Group.list(),
        base44.entities.User.list(),
      ]);
      setGroups(g);
      setAllUsers(users.filter(u => u.role !== "admin"));
      const memberMap = {};
      for (const grp of g) {
        memberMap[grp.id] = await base44.entities.GroupMember.filter({ group_id: grp.id });
      }
      setMembers(memberMap);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.group_name.trim()) return;
    setSaving(true);
    try {
      const group = await base44.entities.Group.create({
        ...form,
        created_by_id: currentUser.id,
        created_by_name: currentUser.full_name,
      });
      await base44.entities.GroupMember.create({
        group_id: group.id,
        group_name: group.group_name,
        user_id: currentUser.id,
        user_name: currentUser.full_name,
      });
      setShowCreate(false);
      setForm({ group_name: "", description: "", is_private: false });
      load();
    } catch (e) { alert("Failed to create group."); }
    setSaving(false);
  };

  const handleAddMember = async (groupId, groupName, userId) => {
    const u = allUsers.find(u => u.id === userId);
    if (!u) return;
    try {
      await base44.entities.GroupMember.create({ group_id: groupId, group_name: groupName, user_id: u.id, user_name: u.full_name });
      setShowAddMember(null);
      load();
    } catch (e) { alert("Failed to add member."); }
  };

  const handleRemoveMember = async (memberId) => {
    try { await base44.entities.GroupMember.delete(memberId); load(); } catch (e) { alert("Failed to remove."); }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!confirm("Delete this group and remove all members?")) return;
    try {
      const groupMembers = members[groupId] || [];
      for (const m of groupMembers) await base44.entities.GroupMember.delete(m.id);
      await base44.entities.Group.delete(groupId);
      load();
    } catch (e) { alert("Failed to delete group."); }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-[#C9A84C]" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2.5 bg-[#C9A84C] text-black font-bold text-sm tracking-wide uppercase hover:bg-[#E0C97A] transition-colors">
          <Plus size={16} /> Create Group
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="border border-[#A8A9AD]/20 bg-black p-12 text-center"><p className="text-[#A8A9AD]">No groups yet. Create one to get started.</p></div>
      ) : (
        <div className="space-y-3">
          {groups.map(g => (
            <div key={g.id} className="border border-[#A8A9AD]/20 bg-black">
              <div className="px-5 py-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center"><Users size={16} className="text-[#C9A84C]" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm">{g.group_name}</h3>
                    {g.is_private ? <Lock size={12} className="text-[#A8A9AD]" /> : <Globe size={12} className="text-[#A8A9AD]" />}
                  </div>
                  <p className="text-xs text-[#A8A9AD]">{g.description || "No description"} • {(members[g.id] || []).length} members</p>
                </div>
                <button onClick={() => setExpandedGroup(expandedGroup === g.id ? null : g.id)} className="text-xs text-[#C9A84C] tracking-widest uppercase font-medium hover:text-[#E0C97A]">
                  {expandedGroup === g.id ? "Hide" : "Manage"}
                </button>
                <button onClick={() => handleDeleteGroup(g.id)} className="text-[#A8A9AD] hover:text-red-400"><Trash2 size={14} /></button>
              </div>
              {expandedGroup === g.id && (
                <div className="px-5 pb-4 pt-2 border-t border-[#A8A9AD]/10 space-y-2">
                  {(members[g.id] || []).map(m => (
                    <div key={m.id} className="flex items-center gap-3 px-3 py-2 border border-[#A8A9AD]/10">
                      <div className="w-7 h-7 bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center text-xs font-bold text-[#C9A84C]">{m.user_name?.charAt(0)}</div>
                      <span className="text-sm flex-1">{m.user_name}</span>
                      {m.user_id !== currentUser.id && <button onClick={() => handleRemoveMember(m.id)} className="text-[#A8A9AD] hover:text-red-400 text-xs">Remove</button>}
                    </div>
                  ))}
                  <button onClick={() => setShowAddMember(g.id)} className="flex items-center gap-2 px-3 py-2 border border-dashed border-[#C9A84C]/30 text-[#C9A84C] text-xs font-medium hover:bg-[#C9A84C]/10 transition-colors w-full justify-center">
                    <UserPlus size={14} /> Add Member
                  </button>
                </div>
              )}
              {showAddMember === g.id && (
                <div className="px-5 pb-4 space-y-1 border-t border-[#A8A9AD]/10">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs tracking-widest uppercase text-[#A8A9AD]">Select User</p>
                    <button onClick={() => setShowAddMember(null)} className="text-[#A8A9AD] hover:text-white"><X size={14} /></button>
                  </div>
                  {allUsers.filter(u => !(members[g.id] || []).some(m => m.user_id === u.id)).map(u => (
                    <button key={u.id} onClick={() => handleAddMember(g.id, g.group_name, u.id)} className="w-full flex items-center gap-3 px-3 py-2 border border-[#A8A9AD]/10 hover:border-[#C9A84C]/30 transition-colors text-left">
                      <div className="w-7 h-7 bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center text-xs font-bold text-[#C9A84C]">{u.full_name?.charAt(0)}</div>
                      <span className="text-sm">{u.full_name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create group modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-md border border-[#C9A84C]/30 bg-[#0A0A0A] p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold">Create Group</h3>
              <button onClick={() => setShowCreate(false)} className="text-[#A8A9AD] hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Group Name *</label>
                <input value={form.group_name} onChange={e => setForm({ ...form, group_name: e.target.value })} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" placeholder="e.g. Tournament Team" required />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none resize-none" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_private} onChange={e => setForm({ ...form, is_private: e.target.checked })} className="accent-[#C9A84C]" />
                <span className="text-sm text-[#A8A9AD]">Private group</span>
              </label>
              <button type="submit" disabled={saving} className="w-full bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase py-3 hover:bg-[#E0C97A] transition-colors disabled:opacity-50">
                {saving ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Create Group"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}