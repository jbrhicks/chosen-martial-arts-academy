import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Loader2, Mail, Check, X } from "lucide-react";

export default function PendingFamilyInvitations({ onResponded }) {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");

  const load = async () => {
    if (!user?.id) { setLoading(false); return; }
    try {
      const invites = await base44.entities.FamilyInvitation.filter({
        invitee_id: user.id,
        status: "pending",
      });
      setInvitations(invites);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [user?.id]);

  const respond = async (invitationId, action) => {
    setBusy(invitationId + action);
    try {
      await base44.functions.invoke("respondFamilyInvitation", { invitation_id: invitationId, action });
      await load();
      if (action === "accept") {
        // Full reload to sync auth context after family_id change
        onResponded?.();
      }
    } catch (e) { alert(e?.message || "Failed to respond."); }
    setBusy("");
  };

  if (loading) return <div className="flex justify-center py-4"><Loader2 size={20} className="animate-spin text-[#C9A84C]" /></div>;
  if (invitations.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Mail size={18} className="text-[#C9A84C]" />
        <h3 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C]">Pending Family Invitations</h3>
      </div>
      <p className="text-xs text-[#A8A9AD] mb-3">You've been invited to join a family group. Accept to link your account.</p>

      {invitations.map((inv) => (
        <div key={inv.id} className="border border-[#C9A84C]/30 bg-[#C9A84C]/5 p-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="text-sm font-bold">{inv.family_name}</p>
              <p className="text-xs text-[#A8A9AD] mt-0.5">From: {inv.inviter_name}</p>
              <p className="text-xs text-[#C9A84C] mt-1">Role: {inv.proposed_role === "student" ? "Student / Child" : "Secondary Guardian"}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => respond(inv.id, "accept")}
                disabled={busy === inv.id + "accept"}
                className="flex items-center gap-1.5 px-4 py-2 bg-green-500/20 border border-green-500/40 text-green-400 text-xs tracking-widest uppercase font-bold hover:bg-green-500/30 disabled:opacity-50"
              >
                {busy === inv.id + "accept" ? <Loader2 size={14} className="animate-spin" /> : <><Check size={14} /> Accept</>}
              </button>
              <button
                onClick={() => respond(inv.id, "decline")}
                disabled={busy === inv.id + "decline"}
                className="flex items-center gap-1.5 px-4 py-2 border border-[#A8A9AD]/30 text-[#A8A9AD] text-xs tracking-widest uppercase font-bold hover:text-white hover:border-[#A8A9AD] disabled:opacity-50"
              >
                {busy === inv.id + "decline" ? <Loader2 size={14} className="animate-spin" /> : <><X size={14} /> Decline</>}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}