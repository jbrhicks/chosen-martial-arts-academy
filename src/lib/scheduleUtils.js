import { DAYS_OF_WEEK } from "@/lib/constants";

export const SCHEDULE_TYPES = ["Weekly", "Bi-Weekly", "Monthly", "Monthly Pattern", "Limited-Series", "Custom-Dates"];

export const WEEK_OCCURRENCES = [
  { value: "1", label: "1st" },
  { value: "2", label: "2nd" },
  { value: "3", label: "3rd" },
  { value: "4", label: "4th" },
  { value: "5", label: "Last" },
];

// Map JS getDay() (0=Sun..6=Sat) to DAYS_OF_WEEK index (0=Mon..6=Sun)
function dayNameFromDate(date) {
  return DAYS_OF_WEEK[(date.getDay() + 6) % 7];
}

// Which occurrence of its weekday is this date in the month (1-5)
export function getWeekdayOccurrence(date) {
  return Math.ceil(date.getDate() / 7);
}

// Is this the last occurrence of this weekday in the month?
export function isLastWeekdayOfMonth(date) {
  const next = new Date(date);
  next.setDate(next.getDate() + 7);
  return next.getMonth() !== date.getMonth();
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function parseDate(value) {
  if (value instanceof Date) return value;
  return new Date(value + "T00:00:00");
}

function isWithinSeries(cls, date) {
  if (!cls.series_start_date && !cls.series_end_date) return true;
  const check = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (cls.series_start_date) {
    const start = parseDate(cls.series_start_date);
    if (check < start) return false;
  }
  if (cls.series_end_date) {
    const end = parseDate(cls.series_end_date);
    if (check > end) return false;
  }
  return true;
}

// Determine if a class occurs on a specific date
export function classOccursOnDate(cls, date, customDates = []) {
  if (!cls || !date) return false;
  const d = date instanceof Date ? date : parseDate(date);
  const dayName = dayNameFromDate(d);

  switch (cls.schedule_type) {
    case "Custom-Dates":
      return customDates.some(cd => cd.class_id === cls.id && cd.specific_date && isSameDay(parseDate(cd.specific_date), d));
    case "Bi-Weekly":
    case "Monthly": {
      if (cls.day_of_week !== dayName) return false;
      if (!isWithinSeries(cls, d)) return false;
      const weeks = (cls.pattern_weeks || "").split(",").map(w => w.trim()).filter(Boolean);
      if (weeks.includes("5") && isLastWeekdayOfMonth(d)) return true;
      return weeks.includes(String(getWeekdayOccurrence(d)));
    }
    case "Monthly Pattern": {
      if (!isWithinSeries(cls, d)) return false;
      const patterns = (cls.monthly_pattern || "").split(",").map(p => p.trim()).filter(Boolean);
      const occurrence = getWeekdayOccurrence(d);
      const isLast = isLastWeekdayOfMonth(d);
      return patterns.some(p => {
        const [week, day] = p.split("-");
        if (day !== dayName) return false;
        if (week === "5") return isLast;
        return String(occurrence) === week;
      });
    }
    case "Limited-Series":
    case "Weekly":
    default:
      return cls.day_of_week === dayName && isWithinSeries(cls, d);
  }
}

// Badge label + color for non-weekly schedule types
export function getScheduleBadge(cls) {
  switch (cls.schedule_type) {
    case "Bi-Weekly":
      return { label: "Meets Bi-Weekly", color: "#E8843A" };
    case "Monthly":
      return { label: "Monthly", color: "#2B5CA0" };
    case "Monthly Pattern":
      return { label: "Monthly Pattern", color: "#6B21A8" };
    case "Limited-Series":
      return { label: "Limited Series", color: "#C53030" };
    case "Custom-Dates":
      return { label: "Pop-Up Class", color: "#7A4A2B" };
    default:
      return null;
  }
}

// For Limited-Series: "Week X of Y" countdown
export function getSeriesCountdown(cls, date, customDates = []) {
  if (cls.schedule_type !== "Limited-Series" || !cls.series_start_date || !cls.series_end_date) return null;
  const start = parseDate(cls.series_start_date);
  const end = parseDate(cls.series_end_date);
  const checkDate = date instanceof Date ? date : parseDate(date);

  let current = 0;
  let total = 0;
  const cursor = new Date(start);
  while (cursor <= end) {
    if (classOccursOnDate(cls, cursor, customDates)) {
      total++;
      if (cursor <= checkDate) current = total;
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  if (current === 0) return null;
  return { current, total, label: `Week ${current} of ${total}` };
}

// Find the next date a class occurs on, starting from fromDate
export function getNextOccurrence(cls, fromDate, customDates = []) {
  const start = fromDate instanceof Date ? new Date(fromDate) : new Date(fromDate);
  start.setHours(0, 0, 0, 0);
  for (let i = 0; i < 90; i++) {
    const check = new Date(start);
    check.setDate(check.getDate() + i);
    if (classOccursOnDate(cls, check, customDates)) {
      return check;
    }
  }
  return null;
}

// Check if a specific occurrence of a class has been cancelled
export function isClassCancelledOnDate(cls, date, cancellations = []) {
  if (!cls || !date || !cancellations.length) return false;
  const d = date instanceof Date ? date : parseDate(date);
  const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return cancellations.some(c => c.class_id === cls.id && c.cancelled_date === dateStr);
}

// Get all dates a class occurs on within a date range (inclusive)
export function getOccurrencesInRange(cls, startDate, endDate, customDates = []) {
  const dates = [];
  const cursor = new Date(startDate instanceof Date ? startDate : startDate + "T00:00:00");
  const end = new Date(endDate instanceof Date ? endDate : endDate + "T00:00:00");
  while (cursor <= end) {
    if (classOccursOnDate(cls, cursor, customDates)) {
      dates.push(new Date(cursor));
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}