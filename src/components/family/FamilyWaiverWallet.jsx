import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useFamily } from "@/lib/FamilyContext";
import { Loader2, FileText, CheckCircle, PenLine, X, Users, Shield } from "lucide-react";

export default function FamilyWaiverWallet() {
  const { user } = useAuth();
  const { familyGroup, members, isPrimaryGuardian, hasFamily } = useFamily();
  const [waivers, setWaivers] = useState([]);
  const [signedWaivers, setSignedWaivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(null);
  const [signature, setSignature] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);

  const students = members.filter((m) => m.family_role === "student");
  const minors = students.filter((m) => {
    if (!m.dob) return false;
    const age = (new Date() - new Date(m.dob)) / (365.25 * 24 * 60 * 60 * 1000);
    return age < 18;
  });

  const load = async () => {
    if (!familyGroup?.id) { setLoading(false); return; }
    try {
      const [activeWaivers, mySigned] = await Promise.all([
        base44.entities.Waiver.filter({ is_active: true }).catch(() => []),
        base44.entities.FamilyWaiver.filter({ family_id: familyGroup.id }).catch(() => []),
      ]);
      setWaivers(activeWaivers);
      setSignedWaivers(mySigned);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [familyGroup?.id]);

  const startSigning = (waiver) => {
    setSigning(waiver);
    setSignature("");
    setSelectedMembers(minors.length > 0 ? minors.map((m) => m.id) : students.map((m) => m.id));
  };

  const toggleMember = (id) => {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const confirmSign = async () => {
    if (!signature.trim() || selectedMembers.length === 0) return;
    try {
      const memberNames = selectedMembers
        .map((id) => members.find((m) => m.id === id)?.full_name || "Unknown")
        .join(", ");
      await base44.entities.FamilyWaiver.create({
        family_id: familyGroup.id,
        waiver_id: signing.id,
        waiver_name: signing.waiver_name,
        waiver_type: signing.waiver_type,
        body_text: signing.body_text,
        signed_by_id: user.id,
        signed_by_name: user.full_name,
        signature_text: signature.trim(),
        signed_date: new Date().toISOString(),
        applies_to_member_ids: selectedMembers.join(","),
        applies_to_member_names: memberNames,
      });
      setSigning(null);
      setSignature("");
      load();
    } catch (e) { alert("Failed to sign waiver."); }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-[#C9A84C]" /></div>;
  }

  if (!hasFamily) {
    return <div className="text-center py-20 text-[#A8A9AD] text-sm">Create or join a family to manage waivers.</div>;
  }

  const isWaiverSigned = (waiverId) => signedWaivers.some((sw) => sw.waiver_id === waiverId);
  const getSignedWaiver = (waiverId) => signedWaivers.find((sw) => sw.waiver_id === waiverId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">Family Waiver Wallet</h2>
        <p className="text-sm text-[#A8A9AD]">Sign once to cover all minors in your household. No per-student paperwork.</p>
      </div>

      {minors.length > 0 && (
        <div className="border border-[#C9A84C]/30 bg-[#C9A84C]/5 p-4 flex items-start gap-3">
          <Shield size={18} className="text-[#C9A84C] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium">Household Coverage</p>
            <p className="text-xs text-[#A8A9AD] mt-1">
              {minors.map((m) => m.full_name).join(", ")} — signing a waiver here applies to all selected family members automatically.
            </p>
          </div>
        </div>
      )}

      {waivers.length === 0 ? (
        <div className="border border-[#A8A9AD]/20 p-8 text-center">
          <FileText size={28} className="mx-auto text-[#A8A9AD]/40 mb-2" />
          <p className="text-[#A8A9AD] text-sm">No active waivers to sign.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {waivers.map((w) => {
            const signed = isWaiverSigned(w.id);
            const sw = getSignedWaiver(w.id);
            return (
              <div key={w.id} className={`border bg-black p-5 ${signed ? "border-green-500/20" : "border-[#C9A84C]/20"}`}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="text-[9px] tracking-widest uppercase text-[#C9A84C] border border-[#C9A84C]/30 px-2 py-0.5">{w.waiver_type}</span>
                      {signed && <span className="text-[9px] tracking-widest uppercase text-green-400 flex items-center gap-1"><CheckCircle size={10} /> Signed</span>}
                    </div>
                    <h4 className="font-bold text-sm mb-2">{w.waiver_name}</h4>
                    {w.body_text && (
                      <p className="text-xs text-[#A8A9AD] whitespace-pre-wrap line-clamp-3">{w.body_text}</p>
                    )}
                    {signed && sw && (
                      <p className="text-xs text-green-400 mt-3 flex items-center gap-1">
                        <CheckCircle size={12} /> Signed by {sw.signed_by_name} on {new Date(sw.signed_date).toLocaleDateString()} — covers: {sw.applies_to_member_names}
                      </p>
                    )}
                  </div>
                  {!signed && isPrimaryGuardian && students.length > 0 && (
                    <button
                      onClick={() => startSigning(w)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-[#C9A84C] text-black font-bold text-xs tracking-widest uppercase hover:bg-[#E0C97A] transition-colors shrink-0"
                    >
                      <PenLine size={14} /> Sign for Family
                    </button>
                  )}
                  {!signed && !isPrimaryGuardian && (
                    <p className="text-xs text-[#A8A9AD] shrink-0">Only the primary guardian can sign.</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Signing modal */}
      {signing && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setSigning(null)}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto border border-[#C9A84C]/30 bg-[#0A0A0A] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Sign: {signing.waiver_name}</h3>
              <button onClick={() => setSigning(null)} className="text-[#A8A9AD] hover:text-white"><X size={18} /></button>
            </div>

            <div className="border border-[#A8A9AD]/20 p-4 mb-4 max-h-40 overflow-y-auto">
              <p className="text-xs text-[#A8A9AD] whitespace-pre-wrap">{signing.body_text || "No waiver text provided."}</p>
            </div>

            <div className="mb-4">
              <p className="text-xs tracking-widest uppercase text-[#A8A9AD] mb-2 flex items-center gap-1">
                <Users size={12} /> Applies To ({selectedMembers.length} selected)
              </p>
              <div className="space-y-1.5">
                {students.map((m) => (
                  <label key={m.id} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(m.id)}
                      onChange={() => toggleMember(m.id)}
                      className="w-4 h-4 accent-[#C9A84C]"
                    />
                    <span className="text-sm">{m.full_name}</span>
                    {m.dob && (() => {
                      const age = (new Date() - new Date(m.dob)) / (365.25 * 24 * 60 * 60 * 1000);
                      return age < 18 ? <span className="text-[10px] text-[#C9A84C] tracking-wide uppercase">Minor</span> : null;
                    })()}
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Type Your Full Name as Signature *</label>
              <input
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none"
                placeholder={user?.full_name || "Your full name"}
              />
              <p className="text-xs text-[#A8A9AD]/60 mt-1">By typing your name, you confirm you have read and agree to the waiver terms on behalf of the selected family members.</p>
            </div>

            <button
              onClick={confirmSign}
              disabled={!signature.trim() || selectedMembers.length === 0}
              className="w-full bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase py-3 hover:bg-[#E0C97A] transition-colors disabled:opacity-50"
            >
              Sign Waiver
            </button>
          </div>
        </div>
      )}
    </div>
  );
}