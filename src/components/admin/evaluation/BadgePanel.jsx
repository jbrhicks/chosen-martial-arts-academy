import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Award, X, Send, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function BadgePanel({ student, sessionId, onBadgeAwarded }) {
  const [open, setOpen] = useState(false);
  const [badges, setBadges] = useState([]);
  const [selectedBadge, setSelectedBadge] = useState("");
  const [reason, setReason] = useState("");
  const [awarding, setAwarding] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadBadges = async () => {
    try {
      const allBadges = await base44.entities.Badge.filter({ is_active: true }).catch(() => []);
      allBadges.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
      setBadges(allBadges);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleOpen = (isOpen) => {
    setOpen(isOpen);
    if (isOpen) {
      setLoading(true);
      loadBadges();
    }
  };

  const handleAward = async () => {
    if (!selectedBadge || !reason.trim()) {
      alert("Please select a badge and provide a reason.");
      return;
    }

    setAwarding(true);
    try {
      const badge = badges.find((b) => b.id === selectedBadge);
      if (!badge) throw new Error("Badge not found");

      const user = await base44.auth.me();

      await base44.entities.StudentBadge.create({
        student_id: student.id,
        student_name: student.full_name,
        student_email: student.email,
        badge_id: badge.id,
        badge_name: badge.badge_name,
        badge_category: badge.category,
        badge_icon_color: badge.icon_color,
        badge_icon_symbol: badge.icon_symbol,
        points_value: badge.points_value,
        awarded_by_id: user.id,
        awarded_by_name: user.full_name,
        reason: reason.trim(),
        session_id: sessionId || undefined,
        awarded_date: new Date().toISOString(),
      });

      // Send notification email to student
      await base44.integrations.Core.SendEmail({
        to: student.email,
        subject: `🏅 You Earned a Badge: ${badge.badge_name}`,
        body: `Congratulations ${student.full_name}!\n\nYou've been awarded the "${badge.badge_name}" badge!\n\nReason: ${reason}\n\nKeep up the great work!\n\n- ${user.full_name}`,
      });

      if (onBadgeAwarded) onBadgeAwarded();
      setOpen(false);
      setReason("");
      setSelectedBadge("");
    } catch (e) {
      alert("Failed to award badge: " + e.message);
    }
    setAwarding(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#C9A84C] text-black font-bold text-xs tracking-widest uppercase hover:bg-[#E0C97A] px-4 py-2">
          <Award size={16} className="mr-2" />
          Award Badge
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#0A0A0A] border border-[#A8A9AD]/20 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Award size={20} className="text-[#C9A84C]" />
            Award Badge to {student.full_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <Label className="text-xs tracking-widest uppercase text-[#A8A9AD]">Select Badge</Label>
            {loading ? (
              <div className="flex justify-center py-4"><Loader2 size={20} className="animate-spin text-[#C9A84C]" /></div>
            ) : (
              <Select value={selectedBadge} onValueChange={setSelectedBadge}>
                <SelectTrigger className="bg-[#0A0A0A] border border-[#A8A9AD]/30 text-white">
                  <SelectValue placeholder="Choose a badge..." />
                </SelectTrigger>
                <SelectContent className="bg-[#0A0A0A] border border-[#A8A9AD]/30">
                  {badges.map((badge) => (
                    <SelectItem key={badge.id} value={badge.id} className="text-white">
                      {badge.badge_name} ({badge.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div>
            <Label className="text-xs tracking-widest uppercase text-[#A8A9AD]">Reason for Award</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this student earned this badge..."
              className="bg-[#0A0A0A] border border-[#A8A9AD]/30 text-white min-h-[100px]"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleAward}
              disabled={awarding || !selectedBadge || !reason.trim()}
              className="flex-1 bg-[#C9A84C] text-black font-bold text-xs tracking-widest uppercase hover:bg-[#E0C97A]"
            >
              {awarding ? <Loader2 size={16} className="animate-spin" /> : <><Send size={14} className="mr-2" /> Award Badge</>}
            </Button>
            <Button
              onClick={() => setOpen(false)}
              variant="outline"
              className="border-[#A8A9AD]/30 text-[#A8A9AD] hover:text-white"
            >
              <X size={16} />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}