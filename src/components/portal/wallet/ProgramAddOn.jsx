import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Plus, CheckCircle, Layers, TrendingDown } from "lucide-react";
import { calculateMultiProgramDiscount, resolveProgramPrice } from "@/lib/multiProgramDiscount";

export default function ProgramAddOn({ user, familyId }) {
  const [enrollments, setEnrollments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [tiers, setTiers] = useState([]);
  const [multiDiscount, setMultiDiscount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(null);
  const [confirmation, setConfirmation] = useState(null);

  useEffect(() => {
    const load = async () => {
      const [enrolls, allPrograms, allTiers, allDiscounts] = await Promise.all([
        base44.entities.Enrollment.filter({ user_id: user.id, status: "active" }).catch(() => []),
        base44.entities.Program.filter({ status: "active" }).catch(() => []),
        base44.entities.SubscriptionTier.list().catch(() => []),
        base44.entities.DiscountsPromos.filter({ is_active: true, is_automated: true }).catch(() => []),
      ]);
      setEnrollments(enrolls);
      setPrograms(allPrograms);
      setTiers(allTiers);
      setMultiDiscount(allDiscounts.find(d => d.automation_type === "multi_program") || null);
      setLoading(false);
    };
    load();
  }, [user]);

  const enrolledProgramIds = new Set(enrollments.map(e => e.program_id));
  const availablePrograms = programs.filter(p => !enrolledProgramIds.has(p.id));

  const getCurrentPrices = () => enrollments.map(e => ({
    programName: e.program,
    price: resolveProgramPrice(e, programs, tiers),
  }));

  const previewDiscount = (newProgram) => {
    const currentPrices = getCurrentPrices();
    const newPrice = newProgram.default_monthly_rate || 0;
    const allPrices = [...currentPrices, { programName: newProgram.program_name, price: newPrice }];
    const { discountAmount } = calculateMultiProgramDiscount(allPrices, multiDiscount);
    return { discountAmount, newTotal: allPrices.reduce((s, p) => s + p.price, 0) - discountAmount, currentTotal: currentPrices.reduce((s, p) => s + p.price, 0) };
  };

  const handleAdd = async (program) => {
    if (!confirm(`Add "${program.program_name}" to your monthly billing? Your next billing cycle will include this program.`)) return;
    setAdding(program.id);
    try {
      const allTiers = await base44.entities.SubscriptionTier.list();
      const defaultTier = allTiers.filter(t => t.linked_program_id === program.id && t.is_active !== false).sort((a, b) => (a.display_order || 0) - (b.display_order || 0))[0];

      await base44.entities.Enrollment.create({
        user_email: user.email,
        user_id: user.id,
        user_name: user.full_name,
        program: program.program_name,
        program_id: program.id,
        start_date: new Date().toISOString().split("T")[0],
        status: "active",
        linked_tier_id: defaultTier?.id || "",
        locked_in_price: defaultTier?.price || program.default_monthly_rate || 0,
      });

      // Update billing record with combined total + multi-program discount
      if (familyId) {
        const billings = await base44.entities.BillingRecord.filter({ family_id: familyId, status: "active" }).catch(() => []);
        const currentPrices = getCurrentPrices();
        const newPrice = defaultTier?.price || program.default_monthly_rate || 0;
        const allPrices = [...currentPrices, { programName: program.program_name, price: newPrice }];
        const { discountAmount } = calculateMultiProgramDiscount(allPrices, multiDiscount);
        const newTotal = allPrices.reduce((s, p) => s + p.price, 0) - discountAmount;
        for (const b of billings) {
          await base44.entities.BillingRecord.update(b.id, { recurring_amount: newTotal });
        }
      }

      setConfirmation({ programName: program.program_name });
      const enrolls = await base44.entities.Enrollment.filter({ user_id: user.id, status: "active" }).catch(() => []);
      setEnrollments(enrolls);
    } catch (e) { alert("Failed to add program. Please contact the academy."); }
    setAdding(null);
  };

  if (loading) return null;

  if (availablePrograms.length === 0) return null;

  return (
    <div className="border border-[#A8A9AD]/20 bg-black p-6">
      <div className="flex items-center gap-2 mb-4">
        <Layers size={18} className="text-[#C9A84C]" />
        <h2 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C]">Add Another Program</h2>
      </div>

      {confirmation ? (
        <div className="border border-[#C9A84C]/30 bg-[#C9A84C]/5 p-4 text-center">
          <CheckCircle size={24} className="mx-auto text-[#C9A84C] mb-2" />
          <p className="text-sm font-medium mb-1">{confirmation.programName} added to your membership!</p>
          <p className="text-xs text-[#A8A9AD]">Your monthly billing has been updated. Check your billing page for details.</p>
          <button onClick={() => setConfirmation(null)} className="mt-3 text-xs text-[#C9A84C] tracking-widest uppercase">Dismiss</button>
        </div>
      ) : (
        <>
          <p className="text-sm text-[#A8A9AD] mb-4">Cross-train in multiple disciplines! {multiDiscount ? "You'll automatically receive a multi-program discount on your monthly tuition." : "Add a program to expand your training."}</p>
          <div className="space-y-3">
            {availablePrograms.map(program => {
              const preview = previewDiscount(program);
              return (
                <div key={program.id} className="border border-[#A8A9AD]/20 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium">{program.program_name}</p>
                      <p className="text-xs text-[#A8A9AD]">{program.age_group} • ${program.default_monthly_rate || 0}/mo</p>
                    </div>
                    <button onClick={() => handleAdd(program)} disabled={adding === program.id} className="flex items-center gap-2 px-4 py-2 bg-[#C9A84C] text-black font-bold text-xs tracking-wide uppercase hover:bg-[#E0C97A] disabled:opacity-50">
                      {adding === program.id ? <Loader2 size={14} className="animate-spin" /> : <><Plus size={14} /> Add</>}
                    </button>
                  </div>
                  {multiDiscount && preview.discountAmount > 0 && (
                    <div className="flex items-center gap-2 text-xs text-green-400 mt-2 border-t border-[#A8A9AD]/10 pt-2">
                      <TrendingDown size={12} />
                      <span>Multi-program discount: −${preview.discountAmount.toFixed(2)}/mo • New total: ${preview.newTotal.toFixed(2)}/mo</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}