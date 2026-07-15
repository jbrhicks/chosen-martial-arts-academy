import { useEffect, useState, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Loader2, ChevronRight, Calendar } from "lucide-react";
import { formatTime } from "@/lib/constants";
import TrialCalendarGrid from "@/components/trial/TrialCalendarGrid";
import TrialConfirmation from "@/components/trial/TrialConfirmation";

const PROGRAM_FILTERS = ["All Programs", "Youth", "Teen/Adult", "All Ages"];

export default function TrialBooking() {
  const [searchParams] = useSearchParams();
  const leadId = searchParams.get("lead");
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);
  const [studentAge, setStudentAge] = useState(searchParams.get("age") || "");
  const [programFilter, setProgramFilter] = useState("All Programs");
  const [leadEmail, setLeadEmail] = useState(searchParams.get("email") || "");
  const bookingRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      const eligible = await base44.entities.ClassSchedule
        .filter({ is_trial_eligible: true, is_active: true })
        .catch(() => []);
      const sorted = eligible.sort((a, b) => {
        const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        return dayOrder.indexOf(a.day_of_week) - dayOrder.indexOf(b.day_of_week) || (a.start_time || "").localeCompare(b.start_time || "");
      });
      setClasses(sorted);
      setLoading(false);
    };
    load();
  }, [leadId]);

  const getEffectiveAgeRange = (cls) => {
    // If explicit min/max are set, use them; otherwise derive from age_preset
    if (cls.min_age > 0 || cls.max_age > 0) {
      return { min: cls.min_age || 0, max: cls.max_age || 99 };
    }
    switch (cls.age_preset) {
      case "Youth": return { min: 4, max: 12 };
      case "Teen/Adult": return { min: 13, max: 99 };
      default: return { min: 0, max: 99 };
    }
  };

  const filteredClasses = classes.filter((cls) => {
    if (programFilter !== "All Programs" && cls.age_preset !== programFilter) return false;
    if (studentAge) {
      const age = parseInt(studentAge);
      const range = getEffectiveAgeRange(cls);
      if (range.min > 0 && age < range.min) return false;
      if (range.max < 99 && age > range.max) return false;
    }
    return true;
  });

  const handleSelectClass = (cls, dateStr) => {
    setSelectedClass(cls);
    setSelectedDate(dateStr);
    setTimeout(() => {
      bookingRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

  const handleAgeChange = (val) => {
    setStudentAge(val);
  };

  const handleBook = async () => {
    if (!selectedClass || !selectedDate || !leadId || !studentAge) return;
    setBooking(true);
    try {
      await base44.functions.invoke("bookTrial", {
        lead_id: leadId,
        lead_email: leadEmail,
        class_id: selectedClass.id,
        class_name: selectedClass.class_name,
        trial_date: selectedDate,
        start_time: selectedClass.start_time,
        end_time: selectedClass.end_time,
        instructor: selectedClass.instructor,
        location: selectedClass.location,
        student_age: parseInt(studentAge),
      });
      setBooked(true);
    } catch (e) {
      const serverError = e.response?.data?.error;
      if (serverError) {
        alert(serverError);
      } else {
        alert("Failed to book trial. Please call us at (555) 123-4567.");
      }
    }
    setBooking(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#C9A84C]" />
      </div>
    );
  }

  if (booked) {
    return (
      <TrialConfirmation
        selectedClass={selectedClass}
        selectedDate={selectedDate}
        leadEmail={leadEmail}
      />
    );
  }

  const ageMismatch =
    selectedClass &&
    studentAge &&
    (() => {
      const age = parseInt(studentAge);
      const range = getEffectiveAgeRange(selectedClass);
      return (
        (range.min > 0 && age < range.min) ||
        (range.max < 99 && age > range.max)
      );
    })();

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pt-20 pb-16 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <p className="text-xs tracking-widest uppercase text-[#C9A84C] mb-2">Book Your Free Trial</p>
          <h1 className="text-3xl font-bold mb-2">Choose Your Intro Class</h1>
          <p className="text-sm text-[#A8A9AD]">
            These beginner-friendly classes are specially designed for new students. Pick a day that works for you!
          </p>
        </div>

        {!leadId && (
          <div className="border border-[#C9A84C]/30 bg-[#C9A84C]/5 p-4 mb-6 text-center">
            <p className="text-sm text-[#A8A9AD]">
              Please <Link to="/#lead-form" className="text-[#C9A84C] underline">submit the lead form</Link> first to book your trial.
            </p>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Program</label>
            <div className="flex flex-wrap gap-2">
              {PROGRAM_FILTERS.map((prog) => (
                <button
                  key={prog}
                  onClick={() => setProgramFilter(prog)}
                  className={`px-3 py-2 text-xs font-bold tracking-wide uppercase border transition-all ${
                    programFilter === prog
                      ? "border-[#C9A84C] bg-[#C9A84C] text-black"
                      : "border-[#A8A9AD]/30 text-[#A8A9AD] hover:border-[#C9A84C]/50"
                  }`}
                >
                  {prog}
                </button>
              ))}
            </div>
          </div>
          <div className="sm:w-40">
            <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Student Age</label>
            <input
              type="number"
              value={studentAge}
              onChange={(e) => handleAgeChange(e.target.value)}
              placeholder="Required"
              min="3"
              max="99"
              className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-2 text-sm text-white focus:border-[#C9A84C] focus:outline-none"
            />
          </div>
        </div>

        {filteredClasses.length === 0 ? (
          <div className="text-center py-16 text-[#A8A9AD]">
            <Calendar size={32} className="mx-auto mb-3 opacity-40" />
            <p>
              {studentAge || programFilter !== "All Programs"
                ? "No classes match your filters. Try adjusting or call us at (555) 123-4567."
                : "No trial-eligible classes available right now. Please call us at (555) 123-4567."}
            </p>
          </div>
        ) : (
          <>
            <TrialCalendarGrid
              classes={filteredClasses}
              selectedClass={selectedClass}
              selectedDate={selectedDate}
              onSelectClass={handleSelectClass}
            />

            {selectedClass && (
              <div ref={bookingRef} className="mt-8 border border-[#C9A84C]/30 bg-black p-6">
                <h3 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C] mb-4">
                  Confirm Your Trial
                </h3>
                <div className="mb-4 space-y-1">
                  <p className="font-bold text-white">{selectedClass.class_name}</p>
                  <p className="text-sm text-[#A8A9AD]">
                    {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}{" "}
                    at {formatTime(selectedClass.start_time)}
                    {selectedClass.end_time ? ` – ${formatTime(selectedClass.end_time)}` : ""}
                  </p>
                  {selectedClass.instructor && (
                    <p className="text-xs text-[#A8A9AD]">Instructor: {selectedClass.instructor}</p>
                  )}
                  {selectedClass.location && (
                    <p className="text-xs text-[#A8A9AD]">Location: {selectedClass.location}</p>
                  )}
                </div>
                {!studentAge && (
                  <p className="text-xs text-[#C9A84C] mb-4">
                    Please enter the student's age above to verify class eligibility before booking.
                  </p>
                )}
                {ageMismatch && (
                  <p className="text-xs text-red-400 mb-4">
                    This class is not available for the student's age. Please choose a class that matches their age group.
                  </p>
                )}
                <button
                  onClick={handleBook}
                  disabled={booking || !selectedDate || !leadId || ageMismatch || !studentAge}
                  className="w-full bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase py-4 hover:bg-[#E0C97A] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {booking ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> Booking...
                    </>
                  ) : (
                    <>
                      Confirm Trial Booking <ChevronRight size={18} />
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}