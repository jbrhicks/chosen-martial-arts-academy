import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Users, Plus, Loader2, Crown } from "lucide-react";

export default function FamilyManager({ user, family, familyMembers, onRefresh, logActivity }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingSplit, setEditingSplit] = useState(false);
  const [splitForm, setSplitForm] = useState({
    split_billing_enabled: family?.split_billing_enabled || false,
    secondary_contact_name: family?.secondary_contact_name || "",
    secondary_contact_phone: family?.secondary_contact_phone || "",
    secondary_household_address: family?.secondary_household_address || "",
    send_to_both_households: family?.send_to_both_households ?? true,
  });

  const handleInvite = async () => {
    if (!newEmail || !family) return;
    setSaving(true);
    try {
      await base44.users.inviteUser(newEmail, "user");
      await logActivity("note", `Invited new family member: ${newName || newEmail}`);
      setNewEmail(""); setNewName(""); setShowAdd(false);
      onRefresh();
    } catch (e) { alert("Failed to invite: " + e.message); }
    setSaving(false);
  };

  const makePrimary = async (memberId) => {
    if (!family || !confirm("Change the Primary Guardian? Future billing receipts and SMS will route to the new guardian.")) return;
    try {
      await base44.entities.FamilyGroup.update(family.id, { primary_contact_id: memberId });
      const member = familyMembers.find(m => m.id === memberId);
      await logActivity("edit", `Changed Primary Guardian to ${member?.full_name || "unknown"}`);
      onRefresh();
    } catch (e) { alert("Failed: " + e.message); }
  };

  const saveSplit = async () => {
    setSaving(true);
    try {
      await base44.entities.FamilyGroup.update(family.id, splitForm);
      await logActivity("edit", "Updated split-household / custody settings");
      setEditingSplit(false);
      onRefresh();
    } catch (e) { alert("Failed: " + e.message); }
    setSaving(false);
  };

  const inputClass = "w-full bg-transparent border border-[#A8A9AD]/30 px-3 py-2 text-sm text-white focus:border-[#C9A84C] focus:outline-none transition-colors";

  if (!family) {
    return (
      <div className="border border-[#A8A9AD]/20 bg-black p-8 text-center">
        <Users size={32} className="text-[#A8A9AD] mx-auto mb-3" />
        <p className="text-[#A8A9AD]">This student is not linked to a family group.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border border-[#A8A9AD]/20 bg-black p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C]">Family Group: {family.family_name}</h3>
          <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1 text-xs text-[#C9A84C] hover:text-[#E0C97A] font-medium">
            <Plus size={14} /> Add Sibling / Member
          </button>
        </div>
        {showAdd && (
          <div className="mb-4 p-4 border border-[#C9A84C]/30 bg-[#C9A84C]/5 space-y-3">
            <input className={inputClass} placeholder="New member name" value={newName} onChange={e => setNewName(e.target.value)} />
            <input className={inputClass} placeholder="Email address (invitation will be sent)" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
            <button onClick={handleInvite} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-[#C9A84C] text-black font-bold text-xs uppercase tracking-wide hover:bg-[#E0C97A] disabled:opacity-50">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Send Invite
            </button>
          </div>
        )}
        <div className="space-y-2">
          {familyMembers.map(m => {
            const isPrimary = m.id === family.primary_contact_id;
            return (
              <div key={m.id} className={`flex items-center gap-3 p-3 border ${isPrimary ? "border-[#C9A84C]/40 bg-[#C9A84C]/5" : "border-[#A8A9AD]/20"}`}>
                <div className="w-10 h-10 bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center shrink-0">
                  <span className="text-[#C9A84C] font-bold">{m.full_name?.charAt(0) || "?"}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{m.full_name || "Unnamed"}</p>
                  <p className="text-xs text-[#A8A9AD] truncate">{m.email} · {m.belt_rank || "No belt"}</p>
                </div>
                {isPrimary ? (
                  <span className="flex items-center gap-1 text-xs text-[#C9A84C] font-bold"><Crown size={14} /> Primary</span>
                ) : (
                  <button onClick={() => makePrimary(m.id)} className="text-xs text-[#A8A9AD] hover:text-[#C9A84C]">Make Primary</button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="border border-[#A8A9AD]/20 bg-black p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C]">Split Household / Custody</h3>
          <button onClick={() => setEditingSplit(!editingSplit)} className="text-xs text-[#C9A84C] hover:text-[#E0C97A]">{editingSplit ? "Cancel" : "Edit"}</button>
        </div>
        {editingSplit ? (
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={splitForm.split_billing_enabled} onChange={e => setSplitForm({...splitForm, split_billing_enabled: e.target.checked})} /> Enable split billing</label>
            <input className={inputClass} placeholder="Secondary contact name" value={splitForm.secondary_contact_name} onChange={e => setSplitForm({...splitForm, secondary_contact_name: e.target.value})} />
            <input className={inputClass} placeholder="Secondary contact phone" value={splitForm.secondary_contact_phone} onChange={e => setSplitForm({...splitForm, secondary_contact_phone: e.target.value})} />
            <input className={inputClass} placeholder="Secondary household address" value={splitForm.secondary_household_address} onChange={e => setSplitForm({...splitForm, secondary_household_address: e.target.value})} />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={splitForm.send_to_both_households} onChange={e => setSplitForm({...splitForm, send_to_both_households: e.target.checked})} /> Send communications to both households</label>
            <button onClick={saveSplit} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-[#C9A84C] text-black font-bold text-xs uppercase tracking-wide hover:bg-[#E0C97A] disabled:opacity-50">
              {saving ? <Loader2 size={14} className="animate-spin" /> : null} Save
            </button>
          </div>
        ) : (
          <div className="space-y-1 text-sm">
            <p className="text-[#A8A9AD]">Split Billing: <span className="text-white">{family.split_billing_enabled ? "Enabled" : "Disabled"}</span></p>
            {family.secondary_contact_name && <p className="text-[#A8A9AD]">Secondary Contact: <span className="text-white">{family.secondary_contact_name}</span></p>}
            {family.secondary_contact_phone && <p className="text-[#A8A9AD]">Secondary Phone: <span className="text-white">{family.secondary_contact_phone}</span></p>}
            {family.secondary_household_address && <p className="text-[#A8A9AD]">Secondary Address: <span className="text-white">{family.secondary_household_address}</span></p>}
            <p className="text-[#A8A9AD]">Send to Both Households: <span className="text-white">{family.send_to_both_households ? "Yes" : "No"}</span></p>
          </div>
        )}
      </div>
    </div>
  );
}