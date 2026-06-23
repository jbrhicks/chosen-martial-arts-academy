import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Share2, Gift, Users, TrendingUp, Copy, CheckCircle, Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { useFamily } from "@/lib/FamilyContext";

export default function ReferralHub() {
  const { user } = useAuth();
  const { familyMembers } = useFamily();
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState([]);
  const [guestPasses, setGuestPasses] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [copiedToken, setCopiedToken] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [activeCampaigns, passes, earnedRewards] = await Promise.all([
        base44.entities.ReferralCampaign.filter({ is_active: true }),
        base44.entities.ReferralsGuestPass.filter({ referring_student_id: user.id }),
        base44.entities.ReferralReward.filter({ student_id: user.id }),
      ]);

      activeCampaigns.sort((a, b) => a.required_referrals - b.required_referrals);
      passes.sort((a, b) => new Date(b.date_created) - new Date(a.date_created));
      
      setCampaigns(activeCampaigns);
      setGuestPasses(passes);
      setRewards(earnedRewards);

      if (familyMembers && familyMembers.length > 0) {
        setSelectedStudent(familyMembers[0]);
      } else {
        setSelectedStudent(user);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const generateGuestPass = async () => {
    setGenerating(true);
    try {
      const token = `GP-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const studentName = selectedStudent?.full_name || user.full_name;
      
      await base44.entities.ReferralsGuestPass.create({
        referring_student_id: selectedStudent?.id || user.id,
        referring_student_name: studentName,
        pass_token: token,
        pass_status: "generated",
        date_created: new Date().toISOString(),
      });

      const shareUrl = `${window.location.origin}/guest-pass?token=${token}`;
      const shareText = `Hey! I wanted to invite you to train with me for free at Chosen Martial Arts. Here is your single-use VIP Guest Pass: ${shareUrl}`;

      if (navigator.share) {
        await navigator.share({
          title: "VIP Guest Pass",
          text: shareText,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        setCopiedToken(token);
        setTimeout(() => setCopiedToken(null), 3000);
      }

      loadData();
    } catch (e) {
      alert("Failed to generate pass: " + e.message);
    }
    setGenerating(false);
  };

  const stats = {
    passesSent: guestPasses.length,
    friendsAttended: guestPasses.filter((p) => ["attended", "enrolled"].includes(p.pass_status)).length,
    rewardsEarned: rewards.filter((r) => r.fulfillment_status === "fulfilled").length,
  };

  const progressData = campaigns.map((campaign) => {
    const eligiblePasses = guestPasses.filter((p) => ["attended", "enrolled"].includes(p.pass_status));
    const progress = Math.min(eligiblePasses.length / campaign.required_referrals, 1);
    const isUnlocked = eligiblePasses.length >= campaign.required_referrals;
    return { ...campaign, progress, isUnlocked };
  });

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-[#C9A84C]" /></div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs tracking-widest uppercase text-[#C9A84C] mb-2">Bring a Buddy</p>
        <h1 className="text-3xl font-bold">Referral Hub</h1>
        <p className="text-[#A8A9AD] text-sm mt-1">Invite friends and earn rewards!</p>
      </div>

      {familyMembers && familyMembers.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#A8A9AD]">Viewing:</span>
          <select
            value={selectedStudent?.id || ""}
            onChange={(e) => setSelectedStudent(familyMembers.find((m) => m.id === e.target.value))}
            className="bg-[#0A0A0A] border border-[#A8A9AD]/30 text-white px-3 py-2 rounded"
          >
            {familyMembers.map((member) => (
              <option key={member.id} value={member.id}>{member.full_name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div className="border border-[#A8A9AD]/20 p-6 bg-[#0A0A0A]">
          <div className="flex items-center gap-3 mb-2">
            <Share2 size={20} className="text-[#C9A84C]" />
            <p className="text-xs text-[#A8A9AD] uppercase tracking-widest">Passes Sent</p>
          </div>
          <p className="text-3xl font-bold">{stats.passesSent}</p>
        </div>
        <div className="border border-[#A8A9AD]/20 p-6 bg-[#0A0A0A]">
          <div className="flex items-center gap-3 mb-2">
            <Users size={20} className="text-green-400" />
            <p className="text-xs text-[#A8A9AD] uppercase tracking-widest">Friends Attended</p>
          </div>
          <p className="text-3xl font-bold text-green-400">{stats.friendsAttended}</p>
        </div>
        <div className="border border-[#A8A9AD]/20 p-6 bg-[#0A0A0A]">
          <div className="flex items-center gap-3 mb-2">
            <Gift size={20} className="text-blue-400" />
            <p className="text-xs text-[#A8A9AD] uppercase tracking-widest">Rewards Earned</p>
          </div>
          <p className="text-3xl font-bold text-blue-400">{stats.rewardsEarned}</p>
        </div>
      </div>

      <div className="border border-[#A8A9AD]/20 p-6 bg-[#0A0A0A]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold">Generate Guest Pass</h3>
            <p className="text-sm text-[#A8A9AD]">Send a free VIP pass to a friend</p>
          </div>
          <Button
            onClick={generateGuestPass}
            disabled={generating}
            className="bg-[#C9A84C] text-black hover:bg-[#E0C97A] px-6"
          >
            {generating ? <Loader2 size={18} className="animate-spin" /> : <Share2 size={18} className="mr-2" />}
            {generating ? "Generating..." : "Text a Guest Pass"}
          </Button>
        </div>
        {copiedToken && (
          <div className="flex items-center gap-2 text-green-400 text-sm">
            <CheckCircle size={16} />
            Link copied to clipboard!
          </div>
        )}
      </div>

      <div>
        <h3 className="text-xl font-bold mb-4">Active Reward Campaigns</h3>
        <div className="grid gap-4">
          {progressData.map((campaign) => (
            <div key={campaign.id} className={`border p-6 ${campaign.isUnlocked ? "border-[#C9A84C]/40 bg-[#C9A84C]/5" : "border-[#A8A9AD]/20 bg-[#0A0A0A]"}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-16 h-16 rounded-lg flex items-center justify-center text-3xl ${campaign.isUnlocked ? "" : "grayscale opacity-50"}`}
                    style={{ backgroundColor: `${campaign.icon_color}20`, color: campaign.icon_color }}
                  >
                    {campaign.icon_symbol}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold">{campaign.campaign_name}</h4>
                    <p className="text-sm text-[#A8A9AD]">{campaign.reward_description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs">
                      <span className="text-[#A8A9AD]">
                        {campaign.required_referrals} referral{campaign.required_referrals > 1 ? "s" : ""} required
                      </span>
                      {campaign.reward_type === "tuition_credit" && campaign.credit_amount && (
                        <span className="text-green-400 font-bold">${campaign.credit_amount} credit</span>
                      )}
                    </div>
                  </div>
                </div>
                {campaign.isUnlocked ? (
                  <Unlock size={24} className="text-[#C9A84C]" />
                ) : (
                  <Lock size={24} className="text-[#A8A9AD]" />
                )}
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-[#A8A9AD]">Progress</span>
                  <span className="text-white font-bold">
                    {Math.min(guestPasses.filter((p) => ["attended", "enrolled"].includes(p.pass_status)).length, campaign.required_referrals)} / {campaign.required_referrals}
                  </span>
                </div>
                <div className="h-2 bg-[#A8A9AD]/20 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${campaign.isUnlocked ? "bg-[#C9A84C]" : "bg-[#A8A9AD]"}`}
                    style={{ width: `${campaign.progress * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
          {campaigns.length === 0 && (
            <div className="border border-[#A8A9AD]/20 p-12 text-center bg-[#0A0A0A]">
              <p className="text-[#A8A9AD]">No active reward campaigns at this time.</p>
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <TrendingUp size={20} className="text-[#C9A84C]" />
          My Passes
        </h3>
        <div className="space-y-3">
          {guestPasses.map((pass) => (
            <div key={pass.id} className="border border-[#A8A9AD]/20 p-4 bg-[#0A0A0A]">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <p className="font-bold">
                      {pass.guest_first_name || "Guest Pass"}
                    </p>
                    <span className={`px-2 py-0.5 text-xs uppercase tracking-wider rounded ${
                      pass.pass_status === "enrolled" ? "bg-green-900/30 text-green-400" :
                      pass.pass_status === "attended" ? "bg-blue-900/30 text-blue-400" :
                      pass.pass_status === "claimed" ? "bg-yellow-900/30 text-yellow-400" :
                      "bg-[#A8A9AD]/20 text-[#A8A9AD]"
                    }`}>
                      {pass.pass_status}
                    </span>
                  </div>
                  <p className="text-sm text-[#A8A9AD]">
                    Created {new Date(pass.date_created).toLocaleDateString()}
                  </p>
                  {pass.guest_email && <p className="text-xs text-[#A8A9AD] mt-1">{pass.guest_email}</p>}
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#A8A9AD]">Token</p>
                  <p className="text-sm font-mono text-[#C9A84C]">{pass.pass_token}</p>
                </div>
              </div>
            </div>
          ))}
          {guestPasses.length === 0 && (
            <div className="border border-[#A8A9AD]/20 p-12 text-center bg-[#0A0A0A]">
              <Share2 size={48} className="mx-auto mb-4 text-[#A8A9AD]" />
              <p className="text-[#A8A9AD]">No guest passes sent yet. Generate your first one!</p>
            </div>
          )}
        </div>
      </div>

      {rewards.length > 0 && (
        <div>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Gift size={20} className="text-blue-400" />
            My Rewards
          </h3>
          <div className="space-y-3">
            {rewards.map((reward) => (
              <div key={reward.id} className="border border-[#A8A9AD]/20 p-4 bg-[#0A0A0A]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold">{reward.campaign_name}</p>
                    <p className="text-sm text-[#A8A9AD]">{reward.reward_description}</p>
                    <p className="text-xs text-[#A8A9AD] mt-1">
                      Earned {new Date(reward.date_earned).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 text-xs uppercase tracking-wider rounded ${
                    reward.fulfillment_status === "fulfilled" 
                      ? "bg-green-900/30 text-green-400" 
                      : "bg-yellow-900/30 text-yellow-400"
                  }`}>
                    {reward.fulfillment_status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}