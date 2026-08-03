import {
  LayoutDashboard, UserPlus, Users, UserSearch, ShieldAlert, Tag, TrendingUp,
  BarChart3, CreditCard, Video, BookOpen, ClipboardList, ListChecks, ClipboardCheck,
  Award, Tablet, MessageSquare, Trophy, Mail, Bell, Calendar, CalendarDays,
  UserCheck, Inbox, FormInput,
} from "lucide-react";

export const DEFAULT_GROUPS = [
  {
    id: "leads-referrals",
    label: "Leads & Referrals",
    icon: UserPlus,
    items: [
      { label: "Leads", path: "/admin/leads", icon: UserPlus },
      { label: "Age Overrides", path: "/admin/exception-requests", icon: ShieldAlert },
      { label: "Referral Campaigns", path: "/admin/referral-campaigns", icon: Tag },
      { label: "Referral Tracking", path: "/admin/referral-tracking", icon: TrendingUp },
    ],
  },
  {
    id: "people",
    label: "People",
    icon: Users,
    items: [
      { label: "Users", path: "/admin/users", icon: Users },
      { label: "Profile Manager", path: "/admin/profile-manager", icon: UserSearch },
      { label: "Onboarding", path: "/admin/onboarding", icon: UserPlus },
      { label: "Membership Requests", path: "/admin/membership-requests", icon: Inbox },
      { label: "Custom Fields", path: "/admin/custom-fields", icon: FormInput },
    ],
  },
  {
    id: "finance",
    label: "Programs & Finance",
    icon: BarChart3,
    items: [
      { label: "Programs & Finance", path: "/admin/programs", icon: BarChart3 },
      { label: "Billing", path: "/admin/billing", icon: CreditCard },
      { label: "Discounts", path: "/admin/discounts", icon: Tag },
    ],
  },
  {
    id: "curriculum",
    label: "Curriculum",
    icon: BookOpen,
    items: [
      { label: "Curriculum", path: "/admin/curriculum", icon: Video },
      { label: "Curriculum Builder", path: "/admin/curriculum-builder", icon: BookOpen },
      { label: "Lesson Plans", path: "/admin/lesson-plans", icon: ClipboardList },
      { label: "Progress", path: "/admin/progress", icon: TrendingUp },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    icon: ClipboardCheck,
    items: [
      { label: "Evaluation", path: "/admin/evaluation", icon: ListChecks },
      { label: "Attendance", path: "/admin/attendance", icon: ClipboardCheck },
      { label: "Badges", path: "/admin/badges", icon: Award },
    ],
  },
  {
    id: "communication",
    label: "Communication",
    icon: MessageSquare,
    items: [
      { label: "Community", path: "/admin/community", icon: MessageSquare },
      { label: "Challenges", path: "/admin/family-challenges", icon: Trophy },
      { label: "Inbox", path: "/admin/inbox", icon: MessageSquare },
      { label: "Broadcasts", path: "/admin/broadcasts", icon: Mail },
      { label: "Notification Settings", path: "/admin/notification-settings", icon: Bell },
    ],
  },
  {
    id: "events-schedule",
    label: "Events & Schedule",
    icon: Calendar,
    items: [
      { label: "Events", path: "/admin/events", icon: Calendar },
      { label: "Event Check-In", path: "/admin/event-checkin", icon: UserCheck },
      { label: "Schedule", path: "/admin/schedule", icon: CalendarDays },
    ],
  },
];

export const STANDALONE_ITEMS = [
  { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
  { label: "Front Desk Kiosk", path: "/front-desk", icon: Tablet, external: true },
];

export const DEFAULT_GROUP_ORDER = DEFAULT_GROUPS.map((g) => g.id);

// Build breadcrumb path lookup
const _pathLookup = {};
STANDALONE_ITEMS.forEach((item) => {
  _pathLookup[item.path] = { groupLabel: null, itemLabel: item.label };
});
DEFAULT_GROUPS.forEach((group) => {
  group.items.forEach((item) => {
    _pathLookup[item.path] = { groupLabel: group.label, itemLabel: item.label };
  });
});

export function getBreadcrumb(path) {
  return _pathLookup[path] || null;
}

export function getAllItems() {
  const all = [...STANDALONE_ITEMS];
  DEFAULT_GROUPS.forEach((g) => g.items.forEach((i) => all.push(i)));
  return all;
}