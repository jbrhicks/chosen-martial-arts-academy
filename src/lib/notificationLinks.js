import moment from "moment";
import {
  MessageCircle, MessageSquare, Calendar, Award, Megaphone,
  UserPlus, UserCheck, CreditCard, LifeBuoy, Users, Bell,
} from "lucide-react";

// Maps a Notification's target_type + target_id to an in-app route (deep link).
// Storing route params (not full URLs) keeps links resilient to domain/path changes.
export function getNotificationLink(notification, isAdmin) {
  const t = notification.target_type;
  const id = notification.target_id;
  const qs = (k, v) => (v ? `?${k}=${encodeURIComponent(v)}` : "");

  if (isAdmin) {
    switch (t) {
      case "lead": return `/admin/leads${qs("highlight", id)}`;
      case "event": return `/admin/events${qs("event", id)}`;
      case "thread": return `/admin/inbox${qs("threadId", id)}`;
      case "profile": return `/admin/profile-manager${qs("userId", id)}`;
      case "billing": return "/admin/billing";
      case "membership":
      case "account_request": return `/admin/membership-requests${qs("request", id)}`;
      case "message": return "/admin/inbox";
      case "curriculum": return "/admin/curriculum";
      case "post": return "/admin/community";
      default: return "/admin";
    }
  }

  switch (t) {
    case "event": return `/portal/events${qs("event", id)}`;
    case "thread": return `/portal/messages${qs("threadId", id)}`;
    case "curriculum": return "/portal/curriculum";
    case "post": return `/portal/community${qs("post", id)}`;
    case "message": return "/portal/messages";
    default: return "/portal";
  }
}

export const NOTIFICATION_ICON = {
  dm: MessageCircle,
  message: MessageCircle,
  post_comment: MessageSquare,
  new_event: Calendar,
  rank_up: Award,
  announcement: Megaphone,
  new_lead: UserPlus,
  enrollment: UserCheck,
  account_request: CreditCard,
  support: LifeBuoy,
  new_post: Users,
};

export function getNotificationIcon(type) {
  return NOTIFICATION_ICON[type] || Bell;
}

export function formatNotificationTime(date) {
  if (!date) return "";
  return moment(date).fromNow();
}