export function generateGoogleCalendarUrl({ title, description, startDate, startTime, endTime, location }) {
  const start = new Date(`${startDate}T${startTime || "09:00"}:00`);
  const end = endTime
    ? new Date(`${startDate}T${endTime}:00`)
    : new Date(start.getTime() + 60 * 60 * 1000);

  const formatDate = (date) =>
    date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${formatDate(start)}/${formatDate(end)}`,
    details: description,
  });
  if (location) params.set("location", location);

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function downloadICSFile({ title, description, startDate, startTime, endTime, location }) {
  const start = new Date(`${startDate}T${startTime || "09:00"}:00`);
  const end = endTime
    ? new Date(`${startDate}T${endTime}:00`)
    : new Date(start.getTime() + 60 * 60 * 1000);

  const formatDate = (date) =>
    date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Chosen Martial Arts Academy//Trial Class//EN",
    "BEGIN:VEVENT",
    `UID:${Date.now()}@chosenmartialarts.com`,
    `DTSTAMP:${formatDate(new Date())}`,
    `DTSTART:${formatDate(start)}`,
    `DTEND:${formatDate(end)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description.replace(/\n/g, "\\n")}`,
  ];
  if (location) lines.push(`LOCATION:${location}`);
  lines.push("END:VEVENT", "END:VCALENDAR");

  const ics = lines.join("\r\n");
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "chosen-martial-arts-trial.ics";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}