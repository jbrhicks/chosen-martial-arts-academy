import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Award, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const BADGE_ICONS = {
  star: "★",
  heart: "♥",
  shield: "🛡",
  flame: "🔥",
  trophy: "🏆",
  medal: "🏅",
  check: "✓",
  lightning: "⚡",
};

export default function BadgePanel({ student, badges = [], onBadgeAwarded }) {
  const [open, setOpen] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState("");
  const [reason, setReason] = useState("");
  const [awarding, setAwarding] = useState(false);
  const [sessionId, setSessionId] = useState("");

  const handleAward = async () => {
    if (!selectedBadge || !reason.trim()) {
      alert("Please select a badge and provide a reason.");
      return;
    }

    setAwarding(true);
    try {
      const badge = badges.find(b => b.id === selectedBadge);
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
        subject: `🏅 You Earned a Badge: ${badge.badge_name}!`,
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #C9A84C 0%, #A8A9AD 100%); padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🏅 Congratulations!</h1>
            </div>
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
              <p style="font-size: 18px; color: #333;">Hi ${student.full_name},</p>
              <p style="color: #666; line-height: 1.6;">
                You've been awarded the <strong style="color: #C9A84C;">${badge.badge_name}</strong> badge!
              </p>
              <div style="background: white; padding: 20px; border-left: 4px solid ${badge.icon_color}; margin: 20px 0;">
                <p style="color: #333; margin: 0;"><strong>Reason:</strong></p>
                <p style="color: #666; font-style: italic; margin: 10px 0 0 0;">"${reason.trim()}"</p>
              </div>
              <p style="color: #666; line-height: 1.6;">
                Keep up the great work! This badge reflects your dedication and progress at Chosen Martial Arts Academy.
              </p>
              <div style="text-align: center; margin-top: 30px;">
                <p style="color: #999; font-size: 14px;">Chosen Martial Arts Academy</p>
              </div>
            </div>
          </div>
        `,
      });

      alert(`Badge awarded to ${student.full_name}!`);
      setOpen(false);
      setSelectedBadge("");
      setReason("");
      if (onBadgeAwarded) onBadgeAwarded();
    } catch (e) {
      console.error(e);
      alert("Failed to award badge: " + e.message);
    }
    setAwarding(false);
  };

  const activeBadges = badges.filter(b => b.is_active).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

  return (
    <div className="border border-[#A8A9AD]/20 bg-black p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C] flex items-center gap-2">
          <Award size={18} />
          Award Badge
        </h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#C9A84C] text-black hover:bg-[#E0C97A] text-xs tracking-wide uppercase">
              <Award size={14} className="mr-2" /> Award Badge
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#0A0A0A] border border-[#C9A84C]/30 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <Award className="text-[#C9A84C]" />
                Award Badge to {student.full_name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label className="text-[#A8A9AD] text-xs tracking-widest uppercase">Select Badge</Label>
                <div className="grid grid-cols-2 gap-3 mt-2 max-h-64 overflow-y-auto">
                  {activeBadges.map(badge => {
                    const Icon = BADGE_ICONS[badge.icon_symbol] || "★";
                    return (
                      <button
                        key={badge.id}
                        onClick={() => setSelectedBadge(badge.id)}
                        className={`p-4 border rounded-lg text-left transition-all ${
                          selectedBadge === badge.id
                            ? "border-[#C9A84C] bg-[#C9A84C]/10"
                            : "border-[#A8A9AD]/20 hover:border-[#C9A84C]/50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                            style={{ backgroundColor: badge.icon_color + "20", color: badge.icon_color }}
                          >
                            {Icon}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{badge.badge_name}</p>
                            <p className="text-xs text-[#A8A9AD] capitalize">{badge.category}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <Label className="text-[#A8A9AD] text-xs tracking-widest uppercase">Reason for Award *</Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why this student earned this badge..."
                  className="bg-[#0A0A0A] border border-[#A8A9AD]/30 text-white mt-2 min-h-[100px]"
                />
                <p className="text-xs text-[#A8A9AD] mt-1">
                  This message will be shown to the student and parent in the notification.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleAward}
                  disabled={awarding || !selectedBadge || !reason.trim()}
                  className="flex-1 bg-[#C9A84C] text-black hover:bg-[#E0C97A]"
                >
                  {awarding ? <><Loader2 size={16} className="animate-spin mr-2" /> Awarding...</> : <><Send size={16} className="mr-2" /> Award Badge & Notify</>}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                  className="border-[#A8A9AD]/30 text-[#A8A9AD] hover:text-white"
                >
                  <X size={16} />
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <p className="text-xs text-[#A8A9AD]">
        Award badges to recognize character traits, performance, attendance, leadership, and improvement.
        Students and parents receive email notifications when badges are awarded.
      </p>
    </div>
  );
}