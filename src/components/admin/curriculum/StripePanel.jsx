import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Award, Plus } from "lucide-react";

export default function StripePanel({ student, rankId, stripes, onUpdate }) {
  const [awarding, setAwarding] = useState(false);
  const [notes, setNotes] = useState("");

  const handleAward = async () => {
    setAwarding(true);
    try {
      const nextStripe = (stripes?.length || 0) + 1;
      await base44.entities.StripeAward.create({
        student_id: student.id,
        student_name: student.full_name,
        rank_id: rankId,
        stripe_number: nextStripe,
        awarded_date: new Date().toISOString().split("T")[0],
        notes: notes || undefined,
      });
      setNotes("");
      onUpdate();
    } catch (e) { alert("Failed to award stripe."); }
    setAwarding(false);
  };

  const stripeCount = stripes?.length || 0;

  return (
    <div className="border border-[#A8A9AD]/20 bg-black p-5">
      <div className="flex items-center gap-2 mb-4">
        <Award size={16} className="text-[#C9A84C]" />
        <h3 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C]">Stripes Awarded</h3>
      </div>
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 h-8 bg-[#1a1a1a] border border-[#A8A9AD]/20 flex items-center justify-center gap-1 px-2">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className={`w-1.5 h-6 ${n <= stripeCount ? "bg-[#C9A84C]" : "bg-[#A8A9AD]/10"}`} />
          ))}
        </div>
        <span className="text-sm font-bold text-[#C9A84C]">{stripeCount}/4</span>
      </div>
      {stripeCount > 0 && (
        <div className="space-y-1 mb-4">
          {stripes.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2 text-xs">
              <span className="text-[#C9A84C] font-bold">Stripe {s.stripe_number}</span>
              <span className="text-[#A8A9AD]">{new Date(s.awarded_date).toLocaleDateString()}</span>
              {s.notes && <span className="text-[#A8A9AD] truncate">— {s.notes}</span>}
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2">
        <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Note (optional)..." className="flex-1 bg-transparent border border-[#A8A9AD]/20 px-3 py-2 text-xs text-white focus:border-[#C9A84C] focus:outline-none" />
        <button onClick={handleAward} disabled={awarding} className="flex items-center gap-1 px-3 py-2 bg-[#C9A84C] text-black font-bold text-xs tracking-wide uppercase hover:bg-[#E0C97A] transition-colors disabled:opacity-50">
          {awarding ? <Loader2 size={14} className="animate-spin" /> : <><Plus size={14} /> Stripe</>}
        </button>
      </div>
    </div>
  );
}