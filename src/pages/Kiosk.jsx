import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, CheckCircle, Search, RotateCcw } from "lucide-react";

export default function Kiosk() {
  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedClass, setSelectedClass] = useState("");
  const [checking, setChecking] = useState(false);
  const [success, setSuccess] = useState(null);

  const today = new Date().toLocaleDateString("en-US", { weekday: "long" });

  useEffect(() => {
    const load = async () => {
      try {
        const [u, c] = await Promise.all([
          base44.entities.User.list(),
          base44.entities.ClassSchedule.filter({ is_active: true, day_of_week: today }),
        ]);
        setUsers(u);
        setClasses(c);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [today]);

  const filtered = search.length >= 2
    ? users.filter((u) =>
        u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  const handleCheckIn = async () => {
    if (!selectedUser || !selectedClass) return;
    setChecking(true);
    try {
      await base44.entities.AttendanceRecord.create({
        user_id: selectedUser.id,
        user_name: selectedUser.full_name,
        class_name: selectedClass,
        check_in_date: new Date().toISOString(),
        check_in_method: "kiosk",
      });
      setSuccess(selectedUser.full_name);
      setTimeout(() => {
        setSuccess(null);
        setSelectedUser(null);
        setSelectedClass("");
        setSearch("");
      }, 3000);
    } catch (e) {
      alert("Check-in failed. Please try again.");
    }
    setChecking(false);
  };

  const reset = () => {
    setSelectedUser(null);
    setSelectedClass("");
    setSearch("");
    setSuccess(null);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#0A0A0A] flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-[#C9A84C]" />
      </div>
    );
  }

  // Success screen
  if (success) {
    return (
      <div className="fixed inset-0 bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center px-6">
          <div className="w-24 h-24 mx-auto mb-8 border-4 border-green-400 flex items-center justify-center">
            <CheckCircle size={48} className="text-green-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Welcome!</h1>
          <p className="text-2xl text-[#C9A84C]">{success}</p>
          <p className="text-lg text-[#A8A9AD] mt-2">You're checked in. Train hard!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#0A0A0A] text-white flex flex-col">
      {/* Header */}
      <div className="border-b border-[#A8A9AD]/20 p-6 text-center">
        <div className="flex items-center justify-center gap-4 mb-2">
          <div className="w-12 h-12 border-2 border-[#C9A84C] flex items-center justify-center">
            <span className="text-[#C9A84C] font-bold text-2xl">C</span>
          </div>
          <div className="text-left">
            <div className="font-bold text-lg tracking-widest uppercase">Chosen</div>
            <div className="text-xs tracking-[0.2em] text-[#A8A9AD] uppercase">Martial Arts Academy</div>
          </div>
        </div>
        <p className="text-sm text-[#A8A9AD] mt-3">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg space-y-8">
          {/* Step 1: Find student */}
          {!selectedUser ? (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-2">Check In</h2>
                <p className="text-[#A8A9AD] text-lg">Type your name to get started</p>
              </div>

              <div className="relative">
                <Search size={22} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#A8A9AD]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
                  placeholder="Search your name..."
                  className="w-full bg-transparent border-2 border-[#A8A9AD]/30 pl-14 pr-6 py-5 text-xl text-white focus:border-[#C9A84C] focus:outline-none transition-colors"
                />
              </div>

              {filtered.length > 0 && (
                <div className="border border-[#A8A9AD]/20 bg-black max-h-72 overflow-y-auto">
                  {filtered.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => setSelectedUser(u)}
                      className="w-full text-left px-6 py-5 border-b border-[#A8A9AD]/10 hover:bg-[#C9A84C]/10 transition-colors flex items-center gap-4"
                    >
                      <div className="w-12 h-12 bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center text-lg font-bold text-[#C9A84C] shrink-0">
                        {u.full_name?.charAt(0) || "?"}
                      </div>
                      <div>
                        <p className="text-lg font-medium">{u.full_name}</p>
                        <p className="text-sm text-[#A8A9AD]">{u.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {search.length >= 2 && filtered.length === 0 && (
                <p className="text-center text-[#A8A9AD] py-4">No students found. Check the spelling or ask the front desk for help.</p>
              )}
            </div>
          ) : (
            /* Step 2: Select class */
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-[#C9A84C] text-lg mb-1">Welcome back,</p>
                <h2 className="text-3xl md:text-4xl font-bold">{selectedUser.full_name}</h2>
              </div>

              <div>
                <p className="text-sm text-[#A8A9AD] text-center mb-4">Select today's class:</p>
                <div className="space-y-3">
                  {classes.length > 0 ? (
                    classes.map((cls) => (
                      <button
                        key={cls.id}
                        onClick={() => setSelectedClass(cls.class_name)}
                        className={`w-full text-left px-6 py-5 border-2 transition-colors ${
                          selectedClass === cls.class_name
                            ? "border-[#C9A84C] bg-[#C9A84C]/10"
                            : "border-[#A8A9AD]/20 bg-black hover:border-[#A8A9AD]/40"
                        }`}
                      >
                        <p className="text-lg font-medium">{cls.class_name}</p>
                        <p className="text-sm text-[#A8A9AD]">{cls.start_time} — {cls.instructor}</p>
                      </button>
                    ))
                  ) : (
                    <p className="text-center text-[#A8A9AD] py-4">No classes scheduled today.</p>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={reset}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-5 border border-[#A8A9AD]/30 text-[#A8A9AD] text-lg font-medium hover:text-white hover:border-[#A8A9AD]/50 transition-colors"
                >
                  <RotateCcw size={20} /> Start Over
                </button>
                <button
                  onClick={handleCheckIn}
                  disabled={!selectedClass || checking}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-5 bg-[#C9A84C] text-black text-lg font-bold tracking-wide uppercase hover:bg-[#E0C97A] transition-colors disabled:opacity-40"
                >
                  {checking ? <Loader2 size={22} className="animate-spin" /> : "Check In"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-[#A8A9AD]/10 p-4 text-center">
        <p className="text-xs text-[#A8A9AD]/40">Chosen Martial Arts Academy • Kiosk Mode</p>
      </div>
    </div>
  );
}