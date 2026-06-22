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
};

// Returns true if the user's rank is high enough to access content requiring `requiredRank`
export function canAccessRank(userRank, requiredRank) {
  if (!userRank || !requiredRank) return false;
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

export const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export const EVENT_TYPES = {
  tournament: { label: "Tournament", icon: "Trophy" },
  seminar: { label: "Seminar", icon: "GraduationCap" },
  belt_test: { label: "Belt Test", icon: "Award" },
  workshop: { label: "Workshop", icon: "Users" },
  social: { label: "Social", icon: "PartyPopper" },
};

export const PAYMENT_TYPES = {
  subscription: { label: "Monthly Tuition", icon: "CreditCard" },
  retail: { label: "Retail Purchase", icon: "ShoppingBag" },
  testing: { label: "Belt Testing Fee", icon: "Award" },
  custom: { label: "Custom Charge", icon: "DollarSign" },
  event: { label: "Event Registration", icon: "Calendar" },
};