import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useFamily } from "@/lib/FamilyContext";
import { Loader2, Copy, RefreshCw, Link2, UserPlus, Check, Mail } from "lucide-react";

export default function FamilyInvite() {
  const { familyGroup, members, refreshFamily } = useFamily();
  const [regenerating, setRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [linkEmail, setLinkEmail] = useState("");
  const [linkRole, setLinkRole] = useState("student");
  const [linking, setLinking] = useState(false);

  const inviteCode = familyGroup?.invite_code;
  const inviteUrl = `${window.location.origin}/register?family=${inviteCode}`;

  const copyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const regenerateCode = async () => {
    if (!confirm("Generate a new invite code? The old code will stop working.")) return;
    setRegenerating(true);
    try {
      const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      await base44.entities.FamilyGroup.update(familyGroup.id, { invite_code: newCode });
      refreshFamily();
    } catch (e) { alert("Failed to regenerate code."); }
    setRegenerating(false);
  };

  const linkExisting = async (e) => {
    e.preventDefault();
    if (!linkEmail.trim()) return;
    setLinking(true);
    try {
      const res = await base44.functions.invoke("linkFamilyMember", {
        email: linkEmail.trim().toLowerCase(),
        family_id: familyGroup.id,
        family_role: linkRole,
      });
      const data = res.data || res;
      if (!data.success) {
        alert(data.error || "Failed to link user.");
        setLinking(false);
        return;
      }
      alert(data.message || `Invitation sent. They'll need to accept it from their Family page.`);
      setLinkEmail("");
      refreshFamily();
    } catch (e) {
      alert(e?.message?.includes("already") ? (e.message.includes("invitation") ? "An invitation has already been sent to this user." : "This user is already in a family group.") : "Failed to send invitation. Make sure they've registered an account first.");
    }
    setLinking(false);
  };

  return (
    <div className="space-y-8">
      {/* Invite Code */}
      <div className="border border-[#C9A84C]/30 bg-[#C9A84C]/5 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Link2 size={18} className="text-[#C9A84C]" />
          <h3 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C]">Family Invite Code</h3>
        </div>
        <p className="text-xs text-[#A8A9AD] mb-4">Share this code with family members. They can use it during registration or on the Family page to join your group.</p>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px] bg-black border border-[#A8A9AD]/30 px-6 py-4 text-center">
            <span className="text-2xl font-bold tracking-[0.3em] text-[#C9A84C]">{inviteCode || "—"}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={copyCode} className="flex items-center gap-2 px-4 py-3 border border-[#A8A9AD]/30 text-sm font-medium hover:border-[#C9A84C] hover:text-[#C9A84C] transition-colors">
              {copied ? <><Check size={16} /> Copied</> : <><Copy size={16} /> Copy</>}
            </button>
            <button onClick={regenerateCode} disabled={regenerating} className="flex items-center gap-2 px-4 py-3 border border-[#A8A9AD]/30 text-sm font-medium hover:border-[#C9A84C] hover:text-[#C9A84C] transition-colors disabled:opacity-50">
              {regenerating ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            </button>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-[#A8A9AD]/20">
          <p className="text-xs text-[#A8A9AD] mb-2">Registration link with code pre-filled:</p>
          <div className="bg-black border border-[#A8A9AD]/20 px-4 py-2.5">
            <span className="text-xs text-[#A8A9AD] font-mono break-all">{inviteUrl}</span>
          </div>
        </div>
      </div>

      {/* Link existing user */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <UserPlus size={18} className="text-[#C9A84C]" />
          <h3 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C]">Invite Existing Account</h3>
        </div>
        <p className="text-xs text-[#A8A9AD] mb-4">If someone already has an account, send them an invitation. They must accept it before being linked to your family.</p>
        <form onSubmit={linkExisting} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Email Address *</label>
            <input
              type="email"
              value={linkEmail}
              onChange={(e) => setLinkEmail(e.target.value)}
              className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none"
              placeholder="familymember@email.com"
              required
            />
          </div>
          <div>
            <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Role</label>
            <select
              value={linkRole}
              onChange={(e) => setLinkRole(e.target.value)}
              className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none"
            >
              <option value="student">Student / Child</option>
              <option value="secondary_guardian">Secondary Guardian</option>
            </select>
          </div>
          <button type="submit" disabled={linking} className="flex items-center gap-2 px-5 py-2.5 bg-[#C9A84C] text-black font-bold text-sm tracking-wide uppercase hover:bg-[#E0C97A] transition-colors disabled:opacity-50">
            {linking ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />} Send Invitation
          </button>
        </form>
      </div>

      {/* How it works */}
      <div className="border border-[#A8A9AD]/20 bg-black p-6">
        <h4 className="text-sm font-bold mb-3">How Invites Work</h4>
        <div className="space-y-2 text-xs text-[#A8A9AD]">
          <p>1. Share the invite code or registration link with your family member.</p>
          <p>2. They register a new account (or log in if they already have one).</p>
          <p>3. They go to Family → Join with Code and enter the code.</p>
          <p>4. Or, use "Invite Existing Account" above to send an invitation by email — they must accept it before being linked.</p>
          <p>5. Once they accept, they appear in your family group and can be managed from the Overview tab.</p>
        </div>
      </div>
    </div>
  );
}