import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { PAYMENT_TYPES } from "@/lib/constants";
import { Loader2, CreditCard, CheckCircle, XCircle, Clock } from "lucide-react";

export default function Billing() {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Payment.filter({ user_id: user?.id })
      .then((data) => {
        setPayments(data.sort((a, b) => new Date(b.payment_date || b.created_date || 0) - new Date(a.payment_date || a.created_date || 0)));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user]);

  const totalPaid = payments.filter((p) => p.status === "succeeded").reduce((sum, p) => sum + (p.amount || 0), 0);

  const statusIcon = (status) => {
    switch (status) {
      case "succeeded": return <CheckCircle size={16} className="text-green-400" />;
      case "failed": return <XCircle size={16} className="text-red-400" />;
      case "pending": return <Clock size={16} className="text-[#C9A84C]" />;
      case "refunded": return <Clock size={16} className="text-[#A8A9AD]" />;
      default: return <Clock size={16} className="text-[#A8A9AD]" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs tracking-widest uppercase text-[#C9A84C] mb-2">Payment History</p>
        <h1 className="text-3xl font-bold">Billing</h1>
        <p className="text-[#A8A9AD] text-sm mt-1">Your tuition and purchase records.</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-[#A8A9AD]/20 border border-[#A8A9AD]/20">
        <div className="bg-[#0A0A0A] p-6">
          <p className="text-[10px] tracking-widest uppercase text-[#A8A9AD] mb-1">Total Paid</p>
          <p className="text-2xl font-bold text-[#C9A84C]">${totalPaid.toFixed(2)}</p>
        </div>
        <div className="bg-[#0A0A0A] p-6">
          <p className="text-[10px] tracking-widest uppercase text-[#A8A9AD] mb-1">Transactions</p>
          <p className="text-2xl font-bold">{payments.length}</p>
        </div>
        <div className="bg-[#0A0A0A] p-6">
          <p className="text-[10px] tracking-widest uppercase text-[#A8A9AD] mb-1">Subscription</p>
          <p className="text-2xl font-bold capitalize">{user?.subscription_status || "None"}</p>
        </div>
      </div>

      {/* Payment list */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-[#C9A84C]" /></div>
      ) : payments.length === 0 ? (
        <div className="border border-[#A8A9AD]/20 p-12 text-center">
          <CreditCard size={32} className="text-[#A8A9AD] mx-auto mb-3" />
          <p className="text-[#A8A9AD]">No payment history yet.</p>
        </div>
      ) : (
        <div className="space-y-px bg-[#A8A9AD]/20 border border-[#A8A9AD]/20">
          {payments.map((payment) => {
            const typeInfo = PAYMENT_TYPES[payment.payment_type] || PAYMENT_TYPES.custom;
            return (
              <div key={payment.id} className="bg-[#0A0A0A] p-5 flex items-center gap-4">
                <div className="shrink-0">{statusIcon(payment.status)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{payment.description || typeInfo.label}</p>
                  <p className="text-xs text-[#A8A9AD] mt-0.5">
                    {typeInfo.label} · {new Date(payment.payment_date || payment.created_date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-sm">${(payment.amount || 0).toFixed(2)}</p>
                  <p className="text-[10px] tracking-widest uppercase text-[#A8A9AD] capitalize">{payment.status}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="border border-[#A8A9AD]/20 p-6 text-center">
        <p className="text-sm text-[#A8A9AD] mb-3">Questions about your billing?</p>
        <p className="text-sm text-white">Contact us at <span className="text-[#C9A84C]">(555) 123-4567</span> or <span className="text-[#C9A84C]">info@chosenmartialarts.com</span></p>
      </div>
    </div>
  );
}