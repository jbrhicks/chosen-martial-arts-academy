import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useFamily } from "@/lib/FamilyContext";
import BeltBadge from "@/components/BeltBadge";
import DashboardHome from "@/components/family/DashboardHome";
import { Loader2, UserPlus, Users, Link2, X, Crown, Shield, GraduationCap, CreditCard, FileText, Mail } from "lucide-react";

const ROLE_CONFIG = {
  primary_guardian: { label: "Primary Guardian", icon: Crown, color: "text-[#C9A84C]" },
  secondary_guardian: { label: "Secondary Guardian", icon: Shield, color: "text-[#A8A9AD]" },
  student: { label: "Student", icon: GraduationCap, color: "text-white" },
};

export default function FamilyOverview({ onTabChange }) {
  const { user } = useAuth();
  const { familyGroup, members, isPrimaryGuardian, hasFamily, refreshFamily } = useFamily();
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [familyName, setFamilyName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [saving, setSaving] = useState(false);

  const createFamily = async (e) => {
    e.preventDefault();
    if (!familyName.trim()) return;
    setSaving(true);
    try {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const group = await base44.entities.FamilyGroup.create({
        family_name: familyName,
        primary_contact_id: user.id,
        billing_status: "none",
        cc_emails: user.email || "",
        cc_phones: user.phone || "",
        invite_code: code,
      });
      await base44.entities.User.update(user.id, { family_id: group.id, family_role: "primary_guardian" });
      await base44.auth.updateMe({ family_id: group.id, family_role: "primary_guardian" });
      setShowCreate(false);
      setFamilyName("");
      refreshFamily();
    } catch (e) { alert("Failed to create family."); }
    setSaving(false);
  };

  const joinFamily = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    setSaving(true);
    try {
      const groups = await base44.entities.FamilyGroup.filter({ invite_code: inviteCode.trim().toUpperCase() });
      if (groups.length === 0) { alert("Invalid invite code."); setSaving(false); return; }
      const group = groups[0];
      const role = group.primary_contact_id === user.id ? "primary_guardian" : "student";
      await base44.entities.User.update(user.id, { family_id: group.id, family_role: role });
      await base44.auth.updateMe({ family_id: group.id, family_role: role });
      setShowJoin(false);
      setInviteCode("");
      refreshFamily();
    } catch (e) { alert("Failed to join family."); }
    setSaving(false);
  };

  if (!hasFamily) {
    return (
      <div className="space-y-6">
        <div className="border border-[#A8A9AD]/20 bg-black p-8 text-center">
          <Users size={32} className="mx-auto text-[#C9A84C] mb-4" />
          <h2 className="text-xl font-bold mb-2">No Family Account Yet</h2>
          <p className="text-[#A8A9AD] text-sm mb-6 max-w-md mx-auto">
            Create a family group to manage multiple members, share billing, sign documents, and keep everyone informed.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-5 py-2.5 bg-[#C9A84C] text-black font-bold text-sm tracking-wide uppercase hover:bg-[#E0C97A] transition-colors">
              <UserPlus size={16} /> Create Family
            </button>
            <button onClick={() => setShowJoin(true)} className="flex items-center gap-2 px-5 py-2.5 border border-[#C9A84C]/40 text-[#C9A84C] font-bold text-sm tracking-wide uppercase hover:bg-[#C9A84C]/10 transition-colors">
              <Link2 size={16} /> Join with Code
            </button>
          </div>
        </div>

        {showCreate && (
          <Modal title="Create Family" onClose={() => setShowCreate(false)}>
            <form onSubmit={createFamily} className="space-y-4">
              <div>
                <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Family Name *</label>
                <input
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none"
                  placeholder="e.g. The Smith Family"
                  required
                />
              </div>
              <p className="text-xs text-[#A8A9AD]">You will be the Primary Guardian with full access to manage the family group.</p>
              <button type="submit" disabled={saving} className="w-full bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase py-3 hover:bg-[#E0C97A] transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                {saving ? <Loader2 size={16} className="animate-spin" /> : "Create Family"}
              </button>
            </form>
          </Modal>
        )}

        {showJoin && (
          <Modal title="Join Family" onClose={() => setShowJoin(false)}>
            <form onSubmit={joinFamily} className="space-y-4">
              <div>
                <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Invite Code *</label>
                <input
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none uppercase tracking-widest"
                  placeholder="Enter 6-character code"
                  required
                />
              </div>
              <p className="text-xs text-[#A8A9AD]">Enter the code provided by your family's Primary Guardian.</p>
              <button type="submit" disabled={saving} className="w-full bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase py-3 hover:bg-[#E0C97A] transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                {saving ? <Loader2 size={16} className="animate-spin" /> : "Join Family"}
              </button>
            </form>
          </Modal>
        )}
      </div>
    );
  }

  return <DashboardHome onTabChange={onTabChange} />;
}

function QuickAction({ icon: Icon, label, desc, onClick }) {
  return (
    <button onClick={onClick} className="group border border-[#A8A9AD]/20 p-4 text-left hover:border-[#C9A84C]/40 transition-colors">
      <div className="w-9 h-9 border border-[#C9A84C]/30 flex items-center justify-center mb-3 group-hover:bg-[#C9A84C] transition-colors">
        <Icon size={16} className="text-[#C9A84C] group-hover:text-black transition-colors" />
      </div>
      <h4 className="font-bold text-sm mb-0.5">{label}</h4>
      <p className="text-xs text-[#A8A9AD]">{desc}</p>
    </button>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-md border border-[#C9A84C]/30 bg-[#0A0A0A] p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="text-[#A8A9AD] hover:text-white"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}