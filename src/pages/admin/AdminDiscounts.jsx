import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Plus, Tag, Trash2, Edit2, Zap } from "lucide-react";
import PromoCreator from "@/components/admin/discounts/PromoCreator";
import AutomatedRules from "@/components/admin/discounts/AutomatedRules";

export default function AdminDiscounts() {
  const [discounts, setDiscounts] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("active");
  const [showCreator, setShowCreator] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    try {
      const [d, r] = await Promise.all([
        base44.entities.DiscountsPromos.list(),
        base44.entities.DiscountRedemption.list(),
      ]);
      setDiscounts(d);
      setRedemptions(r);
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const redemptionCount = (discountId) => redemptions.filter(r => r.discount_id === discountId).length;

  const isExpired = (d) => {
    if (!d.is_active) return true;
    if (d.expiration_date && new Date(d.expiration_date) < new Date()) return true;
    if (d.start_date && new Date(d.start_date) > new Date()) return true;
    return false;
  };

  const manualDiscounts = discounts.filter(d => !d.is_automated);
  const activePromos = manualDiscounts.filter(d => !isExpired(d));
  const expiredPromos = manualDiscounts.filter(d => isExpired(d));

  const handleToggleActive = async (discount) => {
    try {
      await base44.entities.DiscountsPromos.update(discount.id, { is_active: !discount.is_active });
      load();
    } catch (e) { alert("Failed to toggle."); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this promo code permanently?")) return;
    try {
      await base44.entities.DiscountsPromos.delete(id);
      load();
    } catch (e) { alert("Failed to delete."); }
  };

  const openEdit = (discount) => {
    setEditing(discount);
    setShowCreator(true);
  };

  const openNew = () => {
    setEditing(null);
    setShowCreator(true);
  };

  const onSaved = () => {
    setShowCreator(false);
    setEditing(null);
    load();
  };

  const categoryLabel = (cat) => {
    const labels = { all: "All Items", tuition: "Tuition", retail: "Retail", signup_fee: "Sign-up Fee", event: "Events" };
    return labels[cat] || cat;
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-[#C9A84C]" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs tracking-widest uppercase text-[#C9A84C] mb-2">Promo Code Engine</p>
          <h1 className="text-3xl font-bold">Discounts & Promotions</h1>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-5 py-2.5 bg-[#C9A84C] text-black font-bold text-sm tracking-wide uppercase hover:bg-[#E0C97A] transition-colors">
          <Plus size={18} /> Create Promo
        </button>
      </div>

      <div className="flex gap-1 border border-[#A8A9AD]/20 p-1 w-full sm:w-fit">
        {[
          { key: "active", label: `Active (${activePromos.length})` },
          { key: "expired", label: `Expired (${expiredPromos.length})` },
          { key: "automated", label: "Automated Rules" },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`flex-1 sm:flex-none px-4 py-2.5 text-sm font-medium tracking-wide whitespace-nowrap transition-colors ${tab === t.key ? "bg-[#C9A84C] text-black" : "text-[#A8A9AD] hover:text-white"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "automated" ? (
        <AutomatedRules />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#A8A9AD]/20 text-left">
                <th className="py-3 px-4 text-[10px] tracking-widest uppercase text-[#A8A9AD] font-medium">Code</th>
                <th className="py-3 px-4 text-[10px] tracking-widest uppercase text-[#A8A9AD] font-medium">Name</th>
                <th className="py-3 px-4 text-[10px] tracking-widest uppercase text-[#A8A9AD] font-medium">Value</th>
                <th className="py-3 px-4 text-[10px] tracking-widest uppercase text-[#A8A9AD] font-medium">Applies To</th>
                <th className="py-3 px-4 text-[10px] tracking-widest uppercase text-[#A8A9AD] font-medium">Redemptions</th>
                <th className="py-3 px-4 text-[10px] tracking-widest uppercase text-[#A8A9AD] font-medium">Expiration</th>
                <th className="py-3 px-4 text-[10px] tracking-widest uppercase text-[#A8A9AD] font-medium">Active</th>
                <th className="py-3 px-4 text-[10px] tracking-widest uppercase text-[#A8A9AD] font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(tab === "active" ? activePromos : expiredPromos).length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-[#A8A9AD]">
                  {tab === "active" ? "No active promo codes. Create one to get started." : "No expired or inactive promo codes."}
                </td></tr>
              ) : (
                (tab === "active" ? activePromos : expiredPromos).map(d => {
                  const count = redemptionCount(d.id);
                  const limit = d.usage_limit;
                  return (
                    <tr key={d.id} className="border-b border-[#A8A9AD]/10 hover:bg-white/5">
                      <td className="py-3 px-4">
                        <span className="text-sm font-mono font-bold text-[#C9A84C]">{d.promo_code || "—"}</span>
                      </td>
                      <td className="py-3 px-4 text-sm">{d.promo_name}</td>
                      <td className="py-3 px-4 text-sm">
                        {d.discount_type === "percentage" ? `${d.amount}% off` : `$${d.amount} off`}
                      </td>
                      <td className="py-3 px-4 text-sm text-[#A8A9AD]">{categoryLabel(d.applies_to)}</td>
                      <td className="py-3 px-4 text-sm">
                        <span className={limit && count >= limit ? "text-red-400" : "text-white"}>{count}</span>
                        {limit ? <span className="text-[#A8A9AD]"> / {limit}</span> : <span className="text-[#A8A9AD]"> / ∞</span>}
                      </td>
                      <td className="py-3 px-4 text-sm text-[#A8A9AD]">
                        {d.expiration_date ? new Date(d.expiration_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "No expiry"}
                      </td>
                      <td className="py-3 px-4">
                        <button onClick={() => handleToggleActive(d)} className={`w-12 h-6 rounded-full transition-colors ${d.is_active ? "bg-[#C9A84C]" : "bg-[#A8A9AD]/30"}`} title={d.is_active ? "Click to revoke" : "Click to activate"}>
                          <div className={`w-5 h-5 bg-white rounded-full transition-transform mx-0.5 ${d.is_active ? "translate-x-6" : "translate-x-0"}`} />
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEdit(d)} className="text-[#A8A9AD] hover:text-[#C9A84C] transition-colors"><Edit2 size={15} /></button>
                          <button onClick={() => handleDelete(d.id)} className="text-[#A8A9AD] hover:text-red-400 transition-colors"><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {showCreator && <PromoCreator editing={editing} onClose={() => { setShowCreator(false); setEditing(null); }} onSaved={onSaved} />}
    </div>
  );
}