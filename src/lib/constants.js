// Belt rank progression — lowest to highest
export const BELT_RANKS = [
  "White",
  "White w/ Black Stripe",
  "Orange",
  "Orange w/ White Stripe",
  "Green",
  "Green w/ White Stripe",
  "Brown",
  "Brown w/ White Stripe",
  "Red",
  "Red w/ White Stripe",
  "Blue",
  "1st Degree Black Belt",
  "2nd Degree Black Belt",
  "3rd Degree Black Belt",
  "4th Degree Master",
];

// Visual representation for each belt rank
export const BELT_STYLES = {
  "White": { bg: "#F5F5F5", text: "#1A1A1A", stripe: null, label: "White" },
  "White w/ Black Stripe": { bg: "#F5F5F5", text: "#1A1A1A", stripe: "#1A1A1A", label: "White" },
  "Orange": { bg: "#E8843A", text: "#FFFFFF", stripe: null, label: "Orange" },
  "Orange w/ White Stripe": { bg: "#E8843A", text: "#FFFFFF", stripe: "#FFFFFF", label: "Orange" },
  "Green": { bg: "#3B7A3B", text: "#FFFFFF", stripe: null, label: "Green" },
  "Green w/ White Stripe": { bg: "#3B7A3B", text: "#FFFFFF", stripe: "#FFFFFF", label: "Green" },
  "Brown": { bg: "#7A4A2B", text: "#FFFFFF", stripe: null, label: "Brown" },
  "Brown w/ White Stripe": { bg: "#7A4A2B", text: "#FFFFFF", stripe: "#FFFFFF", label: "Brown" },
  "Red": { bg: "#C53030", text: "#FFFFFF", stripe: null, label: "Red" },
  "Red w/ White Stripe": { bg: "#C53030", text: "#FFFFFF", stripe: "#FFFFFF", label: "Red" },
  "Blue": { bg: "#2B5CA0", text: "#FFFFFF", stripe: null, label: "Blue" },
  "1st Degree Black Belt": { bg: "#0A0A0A", text: "#FFFFFF", stripe: "#C9A84C", label: "1st Degree" },
  "2nd Degree Black Belt": { bg: "#0A0A0A", text: "#FFFFFF", stripe: "#C9A84C", label: "2nd Degree" },
  "3rd Degree Black Belt": { bg: "#0A0A0A", text: "#FFFFFF", stripe: "#C9A84C", label: "3rd Degree" },
  "4th Degree Master": { bg: "#0A0A0A", text: "#FFFFFF", stripe: "#C9A84C", label: "Master" },
  "All Ranks": { bg: "#C9A84C", text: "#000000", stripe: null, label: "All Ranks" },
};

// Returns true if the user's rank is high enough to access content requiring `requiredRank`
export function canAccessRank(userRank, requiredRank) {
  if (!requiredRank) return false;
  if (requiredRank === "All Ranks") return true;
  if (!userRank) return false;
  const userIndex = BELT_RANKS.indexOf(userRank);
  const requiredIndex = BELT_RANKS.indexOf(requiredRank);
  if (userIndex === -1 || requiredIndex === -1) return false;
  return userIndex >= requiredIndex;
}

export function getRankIndex(rank) {
  return BELT_RANKS.indexOf(rank);
}

// Theme colors
export const COLORS = {
  black: "#0A0A0A",
  white: "#FFFFFF",
  gold: "#C9A84C",
  goldLight: "#E0C97A",
  silver: "#A8A9AD",
  silverLight: "#D1D2D6",
};

export const AGE_PRESETS = [
  { value: "All Ages", label: "All Ages", minAge: 0, maxAge: 99, color: "#C9A84C" },
  { value: "Youth", label: "Youth (4-12)", minAge: 4, maxAge: 12, color: "#2B5CA0" },
  { value: "Teen/Adult", label: "Teen/Adult (13+)", minAge: 13, maxAge: 99, color: "#1E293B" },
  { value: "Custom", label: "Custom Range", minAge: 0, maxAge: 0, color: "#7A4A2B" },
];

export const CLASS_COLOR_PRESETS = [
  { label: "Gold", value: "#C9A84C" },
  { label: "Blue", value: "#2B5CA0" },
  { label: "Green", value: "#3B7A3B" },
  { label: "Orange", value: "#E8843A" },
  { label: "Purple", value: "#7C3AED" },
  { label: "Red", value: "#C53030" },
  { label: "Dark", value: "#1E293B" },
  { label: "Brown", value: "#7A4A2B" },
];

export const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export const EVENT_TYPES = {
  tournament: { label: "Tournament", icon: "Trophy" },
  seminar: { label: "Seminar", icon: "GraduationCap" },
  belt_test: { label: "Belt Test", icon: "Award" },
  workshop: { label: "Workshop", icon: "Users" },
  social: { label: "Social", icon: "PartyPopper" },
};

// Converts "HH:MM" (24-hour) to "h:MM AM/PM" (12-hour)
export function formatTime(time) {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  if (isNaN(h)) return time;
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

export const PAYMENT_TYPES = {
  subscription: { label: "Monthly Tuition", icon: "CreditCard" },
  retail: { label: "Retail Purchase", icon: "ShoppingBag" },
  testing: { label: "Belt Testing Fee", icon: "Award" },
  custom: { label: "Custom Charge", icon: "DollarSign" },
  event: { label: "Event Registration", icon: "Calendar" },
};