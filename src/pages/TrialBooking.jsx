import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Loader2, CheckCircle, Calendar, Clock, ChevronRight, User } from "lucide-react";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const getNextOccurrence = (dayOfWeek) => {
  const targetDay = DAYS.indexOf(dayOfWeek);
  const today = new Date();
  const currentDay = today.getDay();
  let diff = targetDay - currentDay;
  if (diff < 0) diff += 7;
  const nextDate = new Date(today);
  nextDate.setDate(today.getDate() + diff);
  return nextDate.toISOString().split("T")[0];
};

export default function TrialBooking() {
  const [searchParams] = useSearchParams();
  const leadId = searchParams.get("lead");
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);
  const [studentAge, setStudentAge] = useState("");

  useEffect(() => {
    const load = async () => {
      const eligible = await base44.entities.ClassSchedule.filter({ is_trial_eligible: true, is_active: true }).catch(() => []);
      const sorted = eligible.sort((a, b) => {
        const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        return dayOrder.indexOf(a.day_of_week) - dayOrder.indexOf(b.day_of_week) || (a.start_time || "").localeCompare(b.start_time || "");
      });
      setClasses(sorted);
      setLoading(false);
    };
    load();
  }, []);

  const ageFilteredClasses = classes.filter(cls => {
    if (!studentAge) return true;
    const age = parseInt(studentAge);
    if (cls.min_age > 0 && age < cls.min_age) return false;
    if (cls.max_age > 0 && age > cls.max_age) return false;
    return true;
  });

  const handleSelectClass = (cls) => {
    setSelectedClass(cls);
    setSelectedDate(getNextOccurrence(cls.day_of_week));
  };

  const handleBook = async () => {
    if (!selectedClass || !selectedDate || !leadId) return;
    setBooking(true);
    try {
      await base44.functions.invoke("bookTrial", {
        lead_id: leadId,
        class_id: selectedClass.id,
        class_name: selectedClass.class_name,
        trial_date: selectedDate,
      });
      setBooked(true);
    } catch (e) {
      alert("Failed to book trial. Please call us at (555) 123-4567.");
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
      <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center px-6">
        <div className="max-w-lg text-center">
          <div className="w-16 h-16 mx-auto mb-6 border-2 border-[#C9A84C] flex items-center justify-center">
            <CheckCircle size={32} className="text-[#C9A84C]" />
          </div>
          <h1 className="text-3xl font-bold mb-3">Trial Booked!</h1>
          <p className="text-[#A8A9AD] mb-2">You're scheduled for:</p>
          <p className="text-lg font-bold text-[#C9A84C] mb-1">{selectedClass.class_name}</p>
          <p className="text-sm text-[#A8A9AD] mb-6">{new Date(selectedDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} at {selectedClass.start_time}</p>
          <p className="text-sm text-[#A8A9AD] mb-8">A confirmation email is on its way. We can't wait to see you on the mat!</p>
          <Link to="/" className="inline-block px-6 py-3 bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase hover:bg-[#E0C97A]">Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pt-20 pb-16 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-xs tracking-widest uppercase text-[#C9A84C] mb-2">Book Your Free Trial</p>
          <h1 className="text-3xl font-bold mb-2">Choose Your Intro Class</h1>
          <p className="text-sm text-[#A8A9AD]">These beginner-friendly classes are specially designed for new students.</p>
        </div>

        {!leadId && (
          <div className="border border-[#C9A84C]/30 bg-[#C9A84C]/5 p-4 mb-6 text-center">
            <p className="text-sm text-[#A8A9AD]">Please <Link to="/#lead-form" className="text-[#C9A84C] underline">submit the lead form</Link> first to book your trial.</p>
          </div>
        )}

        <div className="border border-[#A8A9AD]/20 p-4 mb-6">
          <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Student Age</label>
          <input
            type="number"
            value={studentAge}
            onChange={e => setStudentAge(e.target.value)}
            placeholder="Enter student's age to see eligible classes"
            min="3"
            max="99"
            className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-3 text-sm text-white focus:border-[#C9A84C] focus:outline-none"
          />
        </div>

        {ageFilteredClasses.length === 0 ? (
          <div className="text-center py-16 text-[#A8A9AD]">
            <Calendar size={32} className="mx-auto mb-3 opacity-40" />
            <p>{studentAge ? `No trial-eligible classes for age ${studentAge}. Please call us at (555) 123-4567.` : "No trial-eligible classes available right now. Please call us at (555) 123-4567."}</p>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-8">
              {ageFilteredClasses.map(cls => (
                <button
                  key={cls.id}
                  onClick={() => handleSelectClass(cls)}
                  className={`w-full border-2 p-5 text-left transition-all ${selectedClass?.id === cls.id ? "border-[#C9A84C] bg-[#C9A84C]/5" : "border-[#A8A9AD]/20 hover:border-[#A8A9AD]/40"}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold mb-1">{cls.class_name}</p>
                      <div className="flex items-center gap-4 text-xs text-[#A8A9AD]">
                        <span className="flex items-center gap-1"><Calendar size={12} /> {cls.day_of_week}</span>
                        <span className="flex items-center gap-1"><Clock size={12} /> {cls.start_time}{cls.end_time ? ` – ${cls.end_time}` : ""}</span>
                        {cls.instructor && <span className="flex items-center gap-1"><User size={12} /> {cls.instructor}</span>}
                        {(cls.min_age > 0 || cls.max_age > 0) && <span className="text-[#C9A84C]">{cls.min_age > 0 && cls.max_age > 0 ? `Ages ${cls.min_age}-${cls.max_age}` : cls.min_age > 0 ? `Ages ${cls.min_age}+` : `Under ${cls.max_age}`}</span>}
                      </div>
                    </div>
                    {selectedClass?.id === cls.id && <CheckCircle size={20} className="text-[#C9A84C]" />}
                  </div>
                </button>
              ))}
            </div>

            {selectedClass && (
              <div className="border border-[#C9A84C]/30 bg-black p-6">
                <h3 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C] mb-4">Select Your Date</h3>
                <input
                  type="date"
                  value={selectedDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-3 text-sm text-white focus:border-[#C9A84C] focus:outline-none mb-4"
                />
                <button
                  onClick={handleBook}
                  disabled={booking || !selectedDate || !leadId || (studentAge && (() => { const age = parseInt(studentAge); return (selectedClass.min_age > 0 && age < selectedClass.min_age) || (selectedClass.max_age > 0 && age > selectedClass.max_age); })())}
                  className="w-full bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase py-4 hover:bg-[#E0C97A] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {booking ? <><Loader2 size={18} className="animate-spin" /> Booking...</> : <>Confirm Trial Booking <ChevronRight size={18} /></>}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}