import { useEffect, useState } from "react";
import { useSearchParams, Navigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Loader2, CheckCircle, X, Gift, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function GuestPassLanding() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [loading, setLoading] = useState(true);
  const [passData, setPassData] = useState(null);
  const [invalid, setInvalid] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    if (!token) {
      setInvalid(true);
      setLoading(false);
      return;
    }
    validatePass();
  }, [token]);

  const validatePass = async () => {
    try {
      const passes = await base44.entities.ReferralsGuestPass.filter({ pass_token: token });
      if (passes.length === 0) {
        setInvalid(true);
      } else {
        const pass = passes[0];
        if (pass.pass_status !== "generated") {
          setInvalid(true);
        } else {
          setPassData(pass);
        }
      }
    } catch (e) {
      console.error(e);
      setInvalid(true);
    }
    setLoading(false);
  };

  const handleClaim = async () => {
    setClaiming(true);
    try {
      await base44.entities.ReferralsGuestPass.update(passData.id, {
        guest_first_name: formData.first_name,
        guest_email: formData.email,
        guest_phone: formData.phone,
        pass_status: "claimed",
        date_claimed: new Date().toISOString(),
      });

      const lead = await base44.entities.Lead.create({
        first_name: formData.first_name,
        last_name: "",
        email: formData.email,
        phone: formData.phone,
        source: "referral_guest_pass",
        status: "new",
        notes: `Referred by ${passData.referring_student_name} via guest pass ${token}`,
      });

      await base44.entities.ReferralsGuestPass.update(passData.id, {
        linked_lead_id: lead.id,
      });

      setClaimed(true);
    } catch (e) {
      alert("Failed to claim: " + e.message);
    }
    setClaiming(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-[#C9A84C]" />
      </div>
    );
  }

  if (!token || invalid) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] p-8">
        <div className="max-w-md mx-auto text-center">
          <div className="w-20 h-20 border-4 border-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <X size={40} className="text-red-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Pass Not Valid</h1>
          <p className="text-[#A8A9AD] mb-8">
            This VIP Guest Pass has already been redeemed or is invalid.
          </p>
          <p className="text-white mb-2">But you can still try a class!</p>
          <a href="/trial-booking">
            <Button className="bg-[#C9A84C] text-black hover:bg-[#E0C97A]">
              Book a Free Trial
            </Button>
          </a>
        </div>
      </div>
    );
  }

  if (claimed) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] p-8">
        <div className="max-w-md mx-auto text-center">
          <div className="w-20 h-20 border-4 border-[#C9A84C] rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-[#C9A84C]" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Pass Claimed!</h1>
          <p className="text-xl text-[#C9A84C] mb-6">Welcome, {formData.first_name}!</p>
          <p className="text-[#A8A9AD] mb-8">
            You've successfully claimed your VIP Guest Pass. We'll be in touch soon to schedule your first class!
          </p>
          <div className="border border-[#A8A9AD]/20 p-6 bg-[#1a1a1a]">
            <p className="text-sm text-[#A8A9AD]">Referred by</p>
            <p className="text-lg font-bold text-white">{passData.referring_student_name}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] p-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="w-20 h-20 border-4 border-[#C9A84C] rounded-full flex items-center justify-center mx-auto mb-6">
            <Gift size={40} className="text-[#C9A84C]" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">VIP Guest Pass</h1>
          <p className="text-xl text-[#C9A84C] mb-4">You've been invited!</p>
          <p className="text-[#A8A9AD]">
            {passData.referring_student_name} wants you to train with them at Chosen Martial Arts
          </p>
        </div>

        <div className="border border-[#A8A9AD]/20 p-6 bg-[#1a1a1a] mb-6">
          <h3 className="text-lg font-bold text-white mb-4">Claim Your Free Pass</h3>
          <div className="space-y-4">
            <div>
              <Label className="text-white">First Name</Label>
              <Input
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="bg-[#0A0A0A] border border-[#A8A9AD]/30 text-white"
                placeholder="Your first name"
              />
            </div>
            <div>
              <Label className="text-white">Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-[#0A0A0A] border border-[#A8A9AD]/30 text-white"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <Label className="text-white">Phone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="bg-[#0A0A0A] border border-[#A8A9AD]/30 text-white"
                placeholder="(555) 123-4567"
              />
            </div>
            <Button
              onClick={handleClaim}
              disabled={claiming || !formData.first_name || !formData.email}
              className="w-full bg-[#C9A84C] text-black hover:bg-[#E0C97A]"
            >
              {claiming ? <Loader2 size={18} className="animate-spin" /> : "Claim My Free Pass"}
            </Button>
          </div>
        </div>

        <p className="text-xs text-[#A8A9AD] text-center">
          This is a single-use pass. Once claimed, it cannot be used again.
        </p>
      </div>
    </div>
  );
}