import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Calendar, Clock, User, MapPin, CalendarPlus, Download, ChevronRight } from "lucide-react";
import { formatTime } from "@/lib/constants";
import { generateGoogleCalendarUrl, downloadICSFile } from "@/lib/calendarUtils";

const TRIAL_LOCATION = "Chosen Martial Arts Academy, 30 N Londonderry Square, Palmyra, PA 17078";

export default function UpcomingTrialBanner() {
  const [trial, setTrial] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.functions.invoke("getMyTrial", {})
      .then((res) => {
        if (res?.data?.hasTrial) setTrial(res.data.trial);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !trial) return null;

  // Hide if trial is more than 1 day in the past
  const trialDate = new Date(trial.trial_date + "T00:00:00");
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (trialDate < yesterday) return null;

  // Don't show if already converted/enrolled
  if (trial.pipeline_stage === "won") return null;

  const formattedDate = trialDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const timeStr = trial.start_time
    ? `${formatTime(trial.start_time)}${trial.end_time ? ` – ${formatTime(trial.end_time)}` : ""}`
    : "TBD";

  const isPast = trialDate < new Date(new Date().toDateString());

  const calendarEvent = {
    title: `Free Trial Class — ${trial.class_name}`,
    description: `Your free trial class at Chosen Martial Arts Academy!\n\nClass: ${trial.class_name}\nDate: ${formattedDate}\nTime: ${timeStr}\nInstructor: ${trial.instructor || "TBD"}\n\nWhat to bring:\n- Comfortable workout clothes\n- A water bottle\n- A positive attitude!`,
    startDate: trial.trial_date,
    startTime: trial.start_time,
    endTime: trial.end_time,
    location: TRIAL_LOCATION,
  };

  return (
    <div className="border border-[#C9A84C]/30 bg-[#C9A84C]/5 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Calendar size={18} className="text-[#C9A84C]" />
        <h2 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C]">
          {isPast ? "Recent Trial Class" : "Your Upcoming Trial Class"}
        </h2>
      </div>
      <p className="text-lg font-bold text-white mb-3">{trial.class_name}</p>
      <div className="space-y-2 text-sm text-[#A8A9AD] mb-4">
        <p className="flex items-center gap-2">
          <Calendar size={14} className="text-[#C9A84C]" /> {formattedDate}
        </p>
        <p className="flex items-center gap-2">
          <Clock size={14} className="text-[#C9A84C]" /> {timeStr}
        </p>
        {trial.instructor && (
          <p className="flex items-center gap-2">
            <User size={14} className="text-[#C9A84C]" /> {trial.instructor}
          </p>
        )}
        <p className="flex items-center gap-2">
          <MapPin size={14} className="text-[#C9A84C]" /> {TRIAL_LOCATION}
        </p>
      </div>
      {!isPast && (
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <a
            href={generateGoogleCalendarUrl(calendarEvent)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-[#C9A84C]/40 text-[#C9A84C] text-xs font-bold tracking-widest uppercase hover:bg-[#C9A84C]/10 transition-colors"
          >
            <CalendarPlus size={14} /> Google Calendar
          </a>
          <button
            onClick={() => downloadICSFile(calendarEvent)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-[#A8A9AD]/30 text-white text-xs font-bold tracking-widest uppercase hover:border-[#C9A84C]/40 transition-colors"
          >
            <Download size={14} /> Apple / Outlook
          </button>
        </div>
      )}
      <Link
        to="/portal/schedule"
        className="flex items-center gap-2 text-xs tracking-widest uppercase text-[#A8A9AD] hover:text-[#C9A84C] transition-colors"
      >
        View Full Class Schedule <ChevronRight size={14} />
      </Link>
    </div>
  );
}