import { Link } from "react-router-dom";
import { CheckCircle, Calendar, Clock, User, MapPin, CalendarPlus, Download } from "lucide-react";
import { formatTime } from "@/lib/constants";
import { generateGoogleCalendarUrl, downloadICSFile } from "@/lib/calendarUtils";

export default function TrialConfirmation({ selectedClass, selectedDate, leadEmail }) {
  const formattedDate = new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const timeStr = `${formatTime(selectedClass.start_time)}${selectedClass.end_time ? ` – ${formatTime(selectedClass.end_time)}` : ""}`;

  const calendarEvent = {
    title: `Free Trial Class — ${selectedClass.class_name}`,
    description: `Your free trial class at Chosen Martial Arts Academy!\n\nClass: ${selectedClass.class_name}\nDate: ${formattedDate}\nTime: ${timeStr}\nInstructor: ${selectedClass.instructor || "TBD"}\n\nWhat to bring:\n- Comfortable workout clothes\n- A water bottle\n- A positive attitude!\n\nWe can't wait to see you on the mat!`,
    startDate: selectedDate,
    startTime: selectedClass.start_time,
    endTime: selectedClass.end_time,
    location: selectedClass.location || "Chosen Martial Arts Academy",
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center px-6 py-20">
      <div className="max-w-lg w-full text-center">
        <div className="w-16 h-16 mx-auto mb-6 border-2 border-[#C9A84C] flex items-center justify-center">
          <CheckCircle size={32} className="text-[#C9A84C]" />
        </div>
        <h1 className="text-3xl font-bold mb-3">Trial Booked!</h1>
        <p className="text-[#A8A9AD] mb-6">You're scheduled for:</p>

        <div className="border border-[#A8A9AD]/20 p-6 mb-6 text-left">
          <p className="text-lg font-bold text-[#C9A84C] mb-3">{selectedClass.class_name}</p>
          <div className="space-y-2 text-sm text-[#A8A9AD]">
            <p className="flex items-center gap-2">
              <Calendar size={14} className="text-[#C9A84C]" /> {formattedDate}
            </p>
            <p className="flex items-center gap-2">
              <Clock size={14} className="text-[#C9A84C]" /> {timeStr}
            </p>
            {selectedClass.instructor && (
              <p className="flex items-center gap-2">
                <User size={14} className="text-[#C9A84C]" /> {selectedClass.instructor}
              </p>
            )}
            {selectedClass.location && (
              <p className="flex items-center gap-2">
                <MapPin size={14} className="text-[#C9A84C]" /> {selectedClass.location}
              </p>
            )}
          </div>
        </div>

        <div className="mb-6">
          <p className="text-xs tracking-widest uppercase text-[#A8A9AD] mb-3">Add to Your Calendar</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={generateGoogleCalendarUrl(calendarEvent)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-[#C9A84C]/40 text-[#C9A84C] text-xs font-bold tracking-widest uppercase hover:bg-[#C9A84C]/10 transition-colors"
            >
              <CalendarPlus size={14} /> Google Calendar
            </a>
            <button
              onClick={() => downloadICSFile(calendarEvent)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-[#A8A9AD]/30 text-white text-xs font-bold tracking-widest uppercase hover:border-[#C9A84C]/40 transition-colors"
            >
              <Download size={14} /> Apple / Outlook
            </button>
          </div>
        </div>

        <div className="border border-[#C9A84C]/30 bg-[#C9A84C]/5 p-6 mb-6">
          <h3 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C] mb-2">
            Create Your Free Account
          </h3>
          <p className="text-sm text-[#A8A9AD] mb-4">
            Set up your member account to track your progress, view the curriculum, and join our community.
          </p>
          <Link
            to="/register"
            className="inline-block px-6 py-3 bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase hover:bg-[#E0C97A] transition-colors"
          >
            Create Account
          </Link>
        </div>

        <p className="text-sm text-[#A8A9AD] mb-2">
          A confirmation email has been sent{leadEmail ? ` to ${leadEmail}` : ""}.
        </p>
        <p className="text-sm text-[#A8A9AD] mb-8">We can't wait to see you on the mat!</p>

        <Link
          to="/"
          className="text-xs tracking-widest uppercase text-[#A8A9AD] hover:text-[#C9A84C] transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}