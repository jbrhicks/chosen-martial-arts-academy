import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Gift, Users, TrendingUp, CheckCircle, Clock, DollarSign, Package, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function AdminReferralTracking() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [passes, setPasses] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [selectedReward, setSelectedReward] = useState(null);
  const [showFulfillModal, setShowFulfillModal] = useState(false);
  const [fulfilling, setFulfilling] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [allPasses, allRewards, allCampaigns] = await Promise.all([
        base44.entities.ReferralsGuestPass.list(),
        base44.entities.ReferralReward.list(),
        base44.entities.ReferralCampaign.list(),
      ]);

      allPasses.sort((a, b) => new Date(b.date_created) - new Date(a.date_created));
      allRewards.sort((a, b) => new Date(b.date_earned) - new Date(a.date_earned));
      
      setPasses(allPasses);
      setRewards(allRewards);
      setCampaigns(allCampaigns);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleFulfillReward = async () => {
    setFulfilling(true);
    try {
      await base44.entities.ReferralReward.update(selectedReward.id, {
        fulfillment_status: "fulfilled",
        date_fulfilled: new Date().toISOString(),
        fulfilled_by_id: (await base44.auth.me()).id,
        fulfilled_by_name: (await base44.auth.me()).full_name,
      });

      if (selectedReward.reward_type === "tuition_credit" && selectedReward.credit_amount) {
        const campaign = campaigns.find((c) => c.id === selectedReward.linked_campaign_id);
        if (campaign?.auto_deposit_credit) {
          const billingRecords = await base44.entities.BillingRecord.filter({ user_id: selectedReward.student_id });
          if (billingRecords.length > 0) {
            const currentCredit = billingRecords[0].wallet_credit || 0;
            await base44.entities.BillingRecord.update(billingRecords[0].id, {
              wallet_credit: currentCredit + selectedReward.credit_amount,
            });
          } else {
            await base44.entities.BillingRecord.create({
              user_id: selectedReward.student_id,
              user_email: (await base44.entities.User.get(selectedReward.student_id)).email,
              billing_month: new Date().toISOString().slice(0, 7),
              wallet_credit: selectedReward.credit_amount,
            });
          }
        }
      }

      setShowFulfillModal(false);
      setSelectedReward(null);
      loadData();
    } catch (e) {
      alert("Failed to fulfill: " + e.message);
    }
    setFulfilling(false);
  };

  const stats = {
    totalPasses: passes.length,
    claimed: passes.filter((p) => p.pass_status === "claimed").length,
    attended: passes.filter((p) => p.pass_status === "attended").length,
    enrolled: passes.filter((p) => p.pass_status === "enrolled").length,
    pendingRewards: rewards.filter((r) => r.fulfillment_status === "pending").length,
  };

  const conversionRate = stats.totalPasses > 0 
    ? Math.round(((stats.attended + stats.enrolled) / stats.totalPasses) * 100) 
    : 0;

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-[#C9A84C]" /></div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs tracking-widest uppercase text-[#C9A84C] mb-2">Referral System</p>
        <h1 className="text-3xl font-bold">Referral Tracking</h1>
        <p className="text-[#A8A9AD] text-sm mt-1">Monitor guest passes and reward fulfillment.</p>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <div className="border border-[#A8A9AD]/20 p-4 bg-[#0A0A0A]">
          <p className="text-xs text-[#A8A9AD] uppercase tracking-widest">Total Passes</p>
          <p className="text-2xl font-bold">{stats.totalPasses}</p>
        </div>
        <div className="border border-[#A8A9AD]/20 p-4 bg-[#0A0A0A]">
          <p className="text-xs text-[#A8A9AD] uppercase tracking-widest">Claimed</p>
          <p className="text-2xl font-bold text-yellow-400">{stats.claimed}</p>
        </div>
        <div className="border border-[#A8A9AD]/20 p-4 bg-[#0A0A0A]">
          <p className="text-xs text-[#A8A9AD] uppercase tracking-widest">Attended</p>
          <p className="text-2xl font-bold text-blue-400">{stats.attended}</p>
        </div>
        <div className="border border-[#A8A9AD]/20 p-4 bg-[#0A0A0A]">
          <p className="text-xs text-[#A8A9AD] uppercase tracking-widest">Enrolled</p>
          <p className="text-2xl font-bold text-green-400">{stats.enrolled}</p>
        </div>
        <div className="border border-[#A8A9AD]/20 p-4 bg-[#0A0A0A]">
          <p className="text-xs text-[#A8A9AD] uppercase tracking-widest">Conv. Rate</p>
          <p className="text-2xl font-bold text-[#C9A84C]">{conversionRate}%</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Users size={20} className="text-[#C9A84C]" />
            Guest Pass Activity
          </h3>
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {passes.map((pass) => (
              <div key={pass.id} className="border border-[#A8A9AD]/20 p-4 bg-[#0A0A0A]">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-bold">{pass.referring_student_name}</p>
                    <p className="text-sm text-[#A8A9AD]">
                      {pass.guest_first_name || "Guest"} {pass.guest_email && `(${pass.guest_email})`}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs uppercase tracking-wider rounded ${
                    pass.pass_status === "enrolled" ? "bg-green-900/30 text-green-400" :
                    pass.pass_status === "attended" ? "bg-blue-900/30 text-blue-400" :
                    pass.pass_status === "claimed" ? "bg-yellow-900/30 text-yellow-400" :
                    "bg-[#A8A9AD]/20 text-[#A8A9AD]"
                  }`}>
                    {pass.pass_status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-[#A8A9AD]">
                  <span>Token: {pass.pass_token}</span>
                  <span>{new Date(pass.date_created).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
            {passes.length === 0 && (
              <div className="border border-[#A8A9AD]/20 p-12 text-center bg-[#0A0A0A]">
                <p className="text-[#A8A9AD]">No guest passes generated yet.</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Gift size={20} className="text-blue-400" />
              Reward Fulfillment Queue
            </h3>
            {stats.pendingRewards > 0 && (
              <span className="px-2 py-1 text-xs bg-yellow-900/30 text-yellow-400 rounded">
                {stats.pendingRewards} pending
              </span>
            )}
          </div>
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {rewards.map((reward) => (
              <div key={reward.id} className="border border-[#A8A9AD]/20 p-4 bg-[#0A0A0A]">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                      style={{ backgroundColor: "#C9A84C20" }}>
                      {reward.reward_type === "tuition_credit" ? <DollarSign size={18} className="text-green-400" /> :
                       reward.reward_type === "physical_item" ? <Package size={18} className="text-blue-400" /> :
                       <Calendar size={18} className="text-purple-400" />}
                    </div>
                    <div>
                      <p className="font-bold">{reward.student_name}</p>
                      <p className="text-sm text-[#A8A9AD]">{reward.campaign_name}</p>
                      <p className="text-xs text-[#A8A9AD] mt-1">
                        {reward.reward_type === "tuition_credit" && reward.credit_amount && `$${reward.credit_amount} credit`}
                        {reward.reward_type === "physical_item" && "Physical item"}
                        {reward.reward_type === "custom_event" && "Event invitation"}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs uppercase tracking-wider rounded ${
                    reward.fulfillment_status === "fulfilled" 
                      ? "bg-green-900/30 text-green-400" 
                      : "bg-yellow-900/30 text-yellow-400"
                  }`}>
                    {reward.fulfillment_status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-[#A8A9AD] mt-3">
                  <span>Earned: {new Date(reward.date_earned).toLocaleDateString()}</span>
                  {reward.fulfillment_status === "pending" && (
                    <Button
                      onClick={() => {
                        setSelectedReward(reward);
                        setShowFulfillModal(true);
                      }}
                      size="sm"
                      className="bg-[#C9A84C] text-black hover:bg-[#E0C97A]"
                    >
                      <CheckCircle size={14} className="mr-1" />
                      Mark Fulfilled
                    </Button>
                  )}
                  {reward.fulfillment_status === "fulfilled" && reward.date_fulfilled && (
                    <span>Fulfilled: {new Date(reward.date_fulfilled).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            ))}
            {rewards.length === 0 && (
              <div className="border border-[#A8A9AD]/20 p-12 text-center bg-[#0A0A0A]">
                <p className="text-[#A8A9AD]">No rewards earned yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showFulfillModal && selectedReward && (
        <Dialog open={showFulfillModal} onOpenChange={setShowFulfillModal}>
          <DialogContent className="bg-[#0A0A0A] border border-[#A8A9AD]/20">
            <DialogHeader>
              <DialogTitle className="text-white">
                Mark Reward as Fulfilled?
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <p className="text-sm text-[#A8A9AD]">
                Confirm that <strong className="text-white">{selectedReward.student_name}</strong> has received their reward:
              </p>
              <div className="border border-[#A8A9AD]/20 p-4 bg-[#1a1a1a]">
                <p className="font-bold text-white">{selectedReward.campaign_name}</p>
                <p className="text-sm text-[#A8A9AD]">{selectedReward.reward_description}</p>
                {selectedReward.reward_type === "tuition_credit" && selectedReward.credit_amount && (
                  <p className="text-sm text-green-400 mt-2">Amount: ${selectedReward.credit_amount}</p>
                )}
              </div>
              {selectedReward.reward_type === "tuition_credit" && (
                <p className="text-xs text-[#A8A9AD]">
                  This will {campaigns.find((c) => c.id === selectedReward.linked_campaign_id)?.auto_deposit_credit ? "automatically deposit" : "not affect"} the student's wallet balance.
                </p>
              )}
            </div>

            <DialogFooter className="mt-6">
              <Button
                onClick={() => setShowFulfillModal(false)}
                variant="outline"
                className="border-[#A8A9AD]/30 text-[#A8A9AD]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleFulfillReward}
                disabled={fulfilling}
                className="bg-[#C9A84C] text-black hover:bg-[#E0C97A]"
              >
                {fulfilling ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} className="mr-2" />}
                {fulfilling ? "Processing..." : "Mark as Fulfilled"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}