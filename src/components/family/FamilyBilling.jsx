import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useFamily } from "@/lib/FamilyContext";
import { Loader2, CreditCard, DollarSign, Clock } from "lucide-react";

export default function FamilyBilling() {
  const { members, isPrimaryGuardian } = useFamily();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMember, setFilterMember] = useState("all");

  useEffect(() => {
    const load = async () => {
      try {
        const allPayments = await Promise.all(
          members.map((m) => base44.entities.Payment.filter({ user_id: m.id }).catch(() => []))
        );
        const consolidated = allPayments.flat().sort((a, b) =>
          new Date(b.payment_date || b.created_date) - new Date(a.payment_date || a.created_date)
        );
        setPayments(consolidated);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    if (members.length > 0) load();
    else setLoading(false);
  }, [members]);

  const filtered = filterMember === "all" ? payments : payments.filter((p) => p.user_id === filterMember);
  const totalPaid = filtered.filter((p) => p.status === "succeeded").reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalPending = filtered.filter((p) => p.status === "pending").reduce((sum, p) => sum + (p.amount || 0), 0);

  const memberName = (id) => members.find((m) => m.id === id)?.full_name || "Unknown";

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-[#C9A84C]" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="border border-[#A8A9AD]/20 bg-black p-5">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={16} className="text-green-400" />
            <p className="text-[10px] tracking-widest uppercase text-[#A8A9AD]">Total Paid</p>
          </div>
          <p className="text-2xl font-bold text-green-400">${totalPaid.toFixed(2)}</p>
        </div>
        <div className="border border-[#A8A9AD]/20 bg-black p-5">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} className="text-[#C9A84C]" />
            <p className="text-[10px] tracking-widest uppercase text-[#A8A9AD]">Pending</p>
          </div>
          <p className="text-2xl font-bold text-[#C9A84C]">${totalPending.toFixed(2)}</p>
        </div>
        <div className="border border-[#A8A9AD]/20 bg-black p-5">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard size={16} className="text-white" />
            <p className="text-[10px] tracking-widest uppercase text-[#A8A9AD]">Transactions</p>
          </div>
          <p className="text-2xl font-bold">{filtered.length}</p>
        </div>
      </div>

      {!isPrimaryGuardian && (
        <p className="text-xs text-[#A8A9AD] border border-[#A8A9AD]/20 p-3">You have view-only access to family billing. Only the Primary Guardian can process payments.</p>
      )}

      {/* Member filter */}
      <select
        value={filterMember}
        onChange={(e) => setFilterMember(e.target.value)}
        className="bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-2 text-sm text-white focus:border-[#C9A84C] focus:outline-none"
      >
        <option value="all">All Family Members</option>
        {members.map((m) => <option key={m.id} value={m.id}>{m.full_name || "Unnamed"}</option>)}
      </select>

      {/* Ledger */}
      {filtered.length === 0 ? (
        <div className="border border-[#A8A9AD]/20 bg-black p-12 text-center">
          <CreditCard size={28} className="mx-auto text-[#A8A9AD] mb-3" />
          <p className="text-[#A8A9AD]">No transactions found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#A8A9AD]/20 text-left">
                <th className="py-3 px-4 text-[10px] tracking-widest uppercase text-[#A8A9AD] font-medium">Member</th>
                <th className="py-3 px-4 text-[10px] tracking-widest uppercase text-[#A8A9AD] font-medium">Description</th>
                <th className="py-3 px-4 text-[10px] tracking-widest uppercase text-[#A8A9AD] font-medium">Type</th>
                <th className="py-3 px-4 text-[10px] tracking-widest uppercase text-[#A8A9AD] font-medium">Amount</th>
                <th className="py-3 px-4 text-[10px] tracking-widest uppercase text-[#A8A9AD] font-medium">Date</th>
                <th className="py-3 px-4 text-[10px] tracking-widest uppercase text-[#A8A9AD] font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-[#A8A9AD]/10 hover:bg-white/5">
                  <td className="py-3 px-4 text-sm">{memberName(p.user_id)}</td>
                  <td className="py-3 px-4 text-sm text-[#A8A9AD]">{p.description || "—"}</td>
                  <td className="py-3 px-4">
                    <span className="text-[9px] tracking-widest uppercase text-[#A8A9AD] border border-[#A8A9AD]/20 px-2 py-1">{p.payment_type}</span>
                  </td>
                  <td className="py-3 px-4 text-sm font-medium">${(p.amount || 0).toFixed(2)}</td>
                  <td className="py-3 px-4 text-sm text-[#A8A9AD]">{p.payment_date ? new Date(p.payment_date).toLocaleDateString() : "—"}</td>
                  <td className="py-3 px-4">
                    <span className={`text-[9px] tracking-widest uppercase px-2 py-1 ${
                      p.status === "succeeded" ? "text-green-400" : p.status === "pending" ? "text-[#C9A84C]" : p.status === "failed" ? "text-red-400" : "text-[#A8A9AD]"
                    }`}>{p.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}