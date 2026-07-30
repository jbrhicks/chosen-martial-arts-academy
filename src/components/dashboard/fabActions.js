import { MessageCircle, Clock, Gift, QrCode, Trophy, Video, TrendingUp, CheckCircle, CreditCard, Calendar } from "lucide-react";

export const FAB_ACTIONS = {
  message_front_desk: { key: "message_front_desk", label: "Message Front Desk", icon: MessageCircle, group: "Universal", path: "/portal/messages" },
  report_absence: { key: "report_absence", label: "Report Absence / Running Late", icon: Clock, group: "Universal", path: "/portal/messages" },
  send_buddy_pass: { key: "send_buddy_pass", label: 'Send "Buddy Pass" Referral', icon: Gift, group: "Universal", path: "/portal/referrals" },
  show_barcode: { key: "show_barcode", label: "Show Check-In Barcode/PIN", icon: QrCode, group: "Universal", action: "show_barcode" },
  log_challenge: { key: "log_challenge", label: "Log Challenge Points", icon: Trophy, group: "Training", path: "/portal/progress" },
  upload_form_video: { key: "upload_form_video", label: 'Upload "Check My Form" Video', icon: Video, group: "Training", path: "/portal/curriculum" },
  view_belt_req: { key: "view_belt_req", label: "View Next Belt Requirements", icon: TrendingUp, group: "Training", path: "/portal/journey" },
  verify_child_points: { key: "verify_child_points", label: "Verify Child's Challenge Points", icon: CheckCircle, group: "Parent", path: "/portal/progress" },
  pay_invoice: { key: "pay_invoice", label: "Pay Open Invoice", icon: CreditCard, group: "Parent", path: "/portal/billing" },
  book_event: { key: "book_event", label: "Book Event / Camp", icon: Calendar, group: "Parent", path: "/portal/events" },
};

export const GUARDIAN_DEFAULT = ["message_front_desk", "report_absence", "pay_invoice"];
export const STUDENT_DEFAULT = ["log_challenge", "view_belt_req", "show_barcode"];

export function getDefaultActionKeys(familyRole) {
  if (familyRole === "primary_guardian" || familyRole === "secondary_guardian") return GUARDIAN_DEFAULT;
  return STUDENT_DEFAULT;
}

export function resolveActions(actionStr, familyRole) {
  if (actionStr) {
    const keys = actionStr.split(",").map((s) => s.trim()).filter(Boolean);
    const valid = keys.filter((k) => FAB_ACTIONS[k]);
    if (valid.length > 0) return valid.map((k) => FAB_ACTIONS[k]);
  }
  return getDefaultActionKeys(familyRole).map((k) => FAB_ACTIONS[k]);
}

export const ACTION_GROUPS = ["Universal", "Training", "Parent"];