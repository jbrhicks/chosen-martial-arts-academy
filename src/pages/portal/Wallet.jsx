import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { CreditCard, Plus, Trash2, Loader2, AlertCircle, Star } from "lucide-react";
import AddCardModal from "@/components/portal/wallet/AddCardModal";
import ManageMembership from "@/components/portal/wallet/ManageMembership";
import TierChangeRequest from "@/components/portal/wallet/TierChangeRequest";

export default function Wallet() {
  const { user } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [hasActiveMembership, setHasActiveMembership] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAddCard, setShowAddCard] = useState(false);
  const [familyId, setFamilyId] = useState(null);

  const load = async () => {
    let fId = user?.family_id;
    if (!fId) {
      const families = await base44.entities.FamilyGroup.filter({ primary_contact_id: user.id }).catch(() => []);
      fId = families[0]?.id;
    }
    setFamilyId(fId);
    if (fId) {
      const methods = await base44.entities.PaymentMethod.filter({ family_id: fId }).catch(() => []);
      setPaymentMethods(methods);
      const enrollments = await base44.entities.Enrollment.filter({ user_id: user.id, status: "active" }).catch(() => []);
      setHasActiveMembership(enrollments.length > 0);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const handleSetDefault = async (id) => {
    for (const m of paymentMethods) {
      if (m.is_default && m.id !== id) {
        await base44.entities.PaymentMethod.update(m.id, { is_default: false });
      }
    }
    await base44.entities.PaymentMethod.update(id, { is_default: true });
    load();
  };

  const handleDelete = async (id) => {
    if (hasActiveMembership && paymentMethods.length <= 1) {
      alert("You cannot delete your only payment method while you have an active membership. Please add a new card first.");
      return;
    }
    if (!confirm("Remove this payment method?")) return;
    await base44.entities.PaymentMethod.delete(id);
    load();
  };

  const brandLabel = (brand) => {
    const labels = { Visa: "VISA", Mastercard: "MC", Amex: "AMEX", Discover: "DISC" };
    return labels[brand] || "CARD";
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs tracking-widest uppercase text-[#C9A84C] mb-2">Account Settings</p>
        <h1 className="text-3xl font-bold">Digital Wallet</h1>
        <p className="text-sm text-[#A8A9AD] mt-1">Manage your saved payment methods and membership status.</p>
      </div>

      <div className="border border-[#A8A9AD]/20 bg-black p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C]">Saved Cards</h2>
          <button onClick={() => setShowAddCard(true)} className="flex items-center gap-2 px-4 py-2 bg-[#C9A84C] text-black font-bold text-xs tracking-wide uppercase hover:bg-[#E0C97A]">
            <Plus size={16} /> Add New Card
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-[#C9A84C]" /></div>
        ) : !familyId ? (
          <div className="text-center py-12">
            <AlertCircle size={32} className="mx-auto text-[#A8A9AD]/40 mb-3" />
            <p className="text-sm text-[#A8A9AD]">No family account found. Please contact the academy to set up your account.</p>
          </div>
        ) : paymentMethods.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard size={32} className="mx-auto text-[#A8A9AD]/40 mb-3" />
            <p className="text-sm text-[#A8A9AD]">No payment methods on file. Add a card to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {paymentMethods.map(method => (
              <div key={method.id} className="flex items-center gap-4 border border-[#A8A9AD]/20 p-4">
                <div className="w-14 h-9 border border-[#A8A9AD]/30 flex items-center justify-center text-xs font-bold tracking-wider">
                  {brandLabel(method.card_brand)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">•••• {method.last4}</p>
                  <p className="text-xs text-[#A8A9AD]">{method.cardholder_name} • Exp {method.expiration_date ? new Date(method.expiration_date).toLocaleDateString("en-US", { month: "2-digit", year: "2-digit" }) : "—"}</p>
                </div>
                {method.is_default ? (
                  <span className="flex items-center gap-1 text-xs tracking-widest uppercase text-[#C9A84C] font-medium">
                    <Star size={12} fill="currentColor" /> Default
                  </span>
                ) : (
                  <button onClick={() => handleSetDefault(method.id)} className="text-xs text-[#A8A9AD] hover:text-[#C9A84C] tracking-wide">Set Default</button>
                )}
                <button onClick={() => handleDelete(method.id)} className="text-[#A8A9AD] hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        )}

        {hasActiveMembership && paymentMethods.length <= 1 && !loading && familyId && (
          <div className="mt-4 flex items-center gap-2 text-xs text-[#A8A9AD] border-t border-[#A8A9AD]/20 pt-4">
            <AlertCircle size={14} className="text-[#C9A84C] shrink-0" />
            You must keep at least one payment method on file while your membership is active.
          </div>
        )}
      </div>

      <ManageMembership user={user} familyId={familyId} />
      <TierChangeRequest user={user} familyId={familyId} />

      {showAddCard && <AddCardModal familyId={familyId} existingMethods={paymentMethods} onClose={() => setShowAddCard(false)} onSaved={() => { setShowAddCard(false); load(); }} />}
    </div>
  );
}