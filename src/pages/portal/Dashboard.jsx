import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { useFamily } from "@/lib/FamilyContext";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, Ticket } from "lucide-react";
import UpNextHero from "@/components/dashboard/UpNextHero";
import FamilySwitcherHeader from "@/components/dashboard/FamilySwitcherHeader";
import BottomNav from "@/components/dashboard/BottomNav";
import Fab from "@/components/dashboard/Fab";
import BeltBadge from "@/components/BeltBadge";

export default function Dashboard() {
  const { user } = useAuth();
  const { activeProfile } = useFamily();
  const [smartSlot, setSmartSlot] = useState(null);
  const profile = activeProfile || user;
  const uid = profile?.id;
  const fid = user?.family_id;

  useEffect(() => {
    let cancelled = false;
    async function loadSmartSlot() {
      if (!uid) return;
      try {
        const queries = [
          base44.entities.Payment.filter({ user_id: uid, status: "pending" }).catch(() => []),
          base44.entities.EventRegistration.filter({ user_id: uid, status: "waitlisted" }).catch(() => []),
        ];
        if (fid) {
          queries.push(base44.entities.BillingRecord.filter({ family_id: fid, status: "past_due" }).catch(() => []));
        }
        const [payments, waitlistRegs, billings] = await Promise.all(queries);
        if (cancelled) return;

        const overdue = payments.length > 0 || (billings && billings.length > 0);
        const claimSpot = waitlistRegs.some((r) => r.waitlist_position == null || r.waitlist_position <= 1);

        if (overdue) {
          setSmartSlot({ key: "pay_balance", label: "Pay Balance", icon: AlertTriangle, tone: "red", path: "/portal/billing" });
        } else if (claimSpot) {
          setSmartSlot({ key: "claim_spot", label: "Claim Spot", icon: Ticket, tone: "green", path: "/portal/events" });
        } else {
          setSmartSlot(null);
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadSmartSlot();
    return () => {
      cancelled = true;
    };
  }, [uid, fid]);

  return (
    <div className="space-y-6 pb-28 lg:pb-8">
      {/* Permission-gated household switcher */}
      <FamilySwitcherHeader />

      {/* Greeting */}
      <div>
        <p className="text-xs tracking-widest uppercase text-[#C9A84C] mb-1">Overview</p>
        <h1 className="text-3xl font-bold mb-2">{profile?.full_name || "Welcome"}</h1>
        {profile?.belt_rank && <BeltBadge rank={profile.belt_rank} size="lg" />}
      </div>

      {/* Smart slot banner (mirrors the FAB override so it's visible even when FAB is closed) */}
      {smartSlot && (
        <Link
          to={smartSlot.path}
          className={`flex items-center gap-3 px-4 py-3 border ${
            smartSlot.tone === "red"
              ? "border-red-500 bg-red-600/10 text-white"
              : "border-green-500 bg-green-600/10 text-white"
          }`}
        >
          <smartSlot.icon size={18} className={smartSlot.tone === "red" ? "text-red-400" : "text-green-400"} />
          <div className="flex-1">
            <p className="text-sm font-bold">{smartSlot.label}</p>
            <p className="text-xs text-[#A8A9AD]">
              {smartSlot.tone === "red"
                ? "You have an overdue balance — tap to pay."
                : "A spot opened up — tap to claim it."}
            </p>
          </div>
        </Link>
      )}

      {/* Dynamic Up Next hero */}
      <UpNextHero profile={profile} />

      {/* Mobile-only bottom nav + FAB */}
      <BottomNav />
      <Fab smartSlot={smartSlot} />
    </div>
  );
}