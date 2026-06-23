import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Search, RotateCcw, QrCode, KeyRound, User, ChevronLeft, AlertTriangle, ShieldCheck, TrendingUp } from "lucide-react";
import QRScanner from "@/components/kiosk/QRScanner";
import PinPad from "@/components/kiosk/PinPad";
import CheckInSuccess from "@/components/kiosk/CheckInSuccess";

export default function Kiosk() {
  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("qr");
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedClass, setSelectedClass] = useState("");
  const [checking, setChecking] = useState(false);
  const [success, setSuccess] = useState(null);
  const [pinError, setPinError] = useState(false);
  const [capAlert, setCapAlert] = useState(null);

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
    ? users.filter(u => u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()))
    : [];

  const handleQRScan = (data) => {
    const user = users.find(u => u.id === data);
    if (user) setSelectedUser(user);
  };

  const handlePinSubmit = (pin) => {
    const user = users.find(u => u.pin_code === pin);
    if (user) {
      setSelectedUser(user);
      setPinError(false);
    } else {
      setPinError(true);
      setTimeout(() => setPinError(false), 2000);
    }
  };

  const handleCheckIn = async (override = false) => {
    if (!selectedUser || !selectedClass) return;
    setChecking(true);
    try {
      if (!override) {
        const enrollments = await base44.entities.Enrollment.filter({ user_id: selectedUser.id, status: "active" });
        const enrollment = enrollments[0];
        if (enrollment?.linked_tier_id) {
          const allTiers = await base44.entities.SubscriptionTier.list();
          const tier = allTiers.find(t => t.id === enrollment.linked_tier_id);
          if (tier && tier.classes_allowed_per_week > 0) {
            const now = new Date();
            const day = now.getDay();
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
            weekStart.setHours(0, 0, 0, 0);
            const weekAtt = await base44.entities.AttendanceRecord.filter({ user_id: selectedUser.id });
            const thisWeek = weekAtt.filter(a => new Date(a.check_in_date) >= weekStart);
            if (thisWeek.length >= tier.classes_allowed_per_week) {
              setCapAlert({ tier, weekCount: thisWeek.length, limit: tier.classes_allowed_per_week });
              setChecking(false);
              return;
            }
          }
        }
      }
      await base44.entities.AttendanceRecord.create({
        user_id: selectedUser.id,
        user_name: selectedUser.full_name,
        class_name: selectedClass,
        check_in_date: new Date().toISOString(),
        check_in_method: override ? "Manual" : mode === "qr" ? "QR" : mode === "pin" ? "PIN" : "Manual",
      });
      setSuccess(selectedUser.full_name);
    } catch (e) {
      alert("Check-in failed. Please try again.");
    }
    setChecking(false);
  };

  const handleOverride = () => { setCapAlert(null); handleCheckIn(true); };

  const reset = () => {
    setSelectedUser(null);
    setSelectedClass("");
    setSearch("");
    setSuccess(null);
  };

  const handleSuccessDismiss = () => {
    setSuccess(null);
    setSelectedUser(null);
    setSelectedClass("");
    setSearch("");
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#0A0A0A] flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-[#C9A84C]" />
      </div>
    );
  }

  if (success) {
    return <CheckInSuccess name={success} onDismiss={handleSuccessDismiss} />;
  }

  if (capAlert) {
    return (
      <div className="fixed inset-0 bg-[#0A0A0A] text-white flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="w-20 h-20 border-2 border-[#C9A84C] flex items-center justify-center mx-auto">
            <AlertTriangle size={40} className="text-[#C9A84C]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Weekly Limit Reached</h2>
            <p className="text-[#A8A9AD]">{selectedUser?.full_name} has attended <span className="text-white font-bold">{capAlert.weekCount}</span> class(es) this week on the "{capAlert.tier.tier_name}" tier, which allows <span className="text-white font-bold">{capAlert.limit}</span> per week.</p>
          </div>
          <div className="space-y-3">
            <button onClick={handleOverride} className="w-full flex items-center justify-center gap-2 px-6 py-5 border-2 border-[#C9A84C] text-[#C9A84C] text-lg font-bold hover:bg-[#C9A84C]/10 transition-colors">
              <ShieldCheck size={22} /> Staff Override — Allow Check-In
            </button>
            <button onClick={() => setCapAlert(null)} className="w-full flex items-center justify-center gap-2 px-6 py-5 bg-[#C9A84C] text-black text-lg font-bold tracking-wide uppercase hover:bg-[#E0C97A] transition-colors">
              <TrendingUp size={22} /> Offer Membership Upgrade
            </button>
            <button onClick={() => { setCapAlert(null); reset(); }} className="w-full text-sm text-[#A8A9AD] hover:text-white py-2">Cancel & Start Over</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#0A0A0A] text-white flex flex-col">
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

      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        <div className="w-full max-w-lg space-y-8">
          {!selectedUser ? (
            <>
              <div className="flex gap-1 border border-[#A8A9AD]/20 p-1">
                {[
                  { key: "qr", label: "Scan QR", icon: QrCode },
                  { key: "pin", label: "Enter PIN", icon: KeyRound },
                  { key: "search", label: "Search Name", icon: User },
                ].map(t => {
                  const Icon = t.icon;
                  return (
                    <button key={t.key} onClick={() => setMode(t.key)} className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${mode === t.key ? "bg-[#C9A84C] text-black" : "text-[#A8A9AD] hover:text-white"}`}>
                      <Icon size={16} /> {t.label}
                    </button>
                  );
                })}
              </div>

              {mode === "qr" && (
                <div className="space-y-4">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2">Scan Your QR Code</h2>
                    <p className="text-[#A8A9AD]">Open the app and show your ID card</p>
                  </div>
                  <QRScanner onScan={handleQRScan} />
                </div>
              )}

              {mode === "pin" && (
                <div className="space-y-4">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2">Enter Your PIN</h2>
                    <p className="text-[#A8A9AD]">Type your custom check-in PIN</p>
                  </div>
                  {pinError && <p className="text-center text-red-400 text-sm">PIN not recognized. Try again.</p>}
                  <PinPad onSubmit={handlePinSubmit} />
                </div>
              )}

              {mode === "search" && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2">Find Your Name</h2>
                    <p className="text-[#A8A9AD]">Type your name to get started</p>
                  </div>
                  <div className="relative">
                    <Search size={22} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#A8A9AD]" />
                    <input
                      type="text"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      autoFocus
                      placeholder="Search your name..."
                      className="w-full bg-transparent border-2 border-[#A8A9AD]/30 pl-14 pr-6 py-5 text-xl text-white focus:border-[#C9A84C] focus:outline-none transition-colors"
                    />
                  </div>
                  {filtered.length > 0 && (
                    <div className="border border-[#A8A9AD]/20 bg-black max-h-72 overflow-y-auto">
                      {filtered.map(u => (
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
              )}
            </>
          ) : (
            <div className="space-y-6">
              <button onClick={() => setSelectedUser(null)} className="flex items-center gap-2 text-[#A8A9AD] hover:text-white">
                <ChevronLeft size={18} /> Back
              </button>
              <div className="text-center">
                <p className="text-[#C9A84C] text-lg mb-1">Welcome back,</p>
                <h2 className="text-3xl md:text-4xl font-bold">{selectedUser.full_name}</h2>
              </div>
              <div>
                <p className="text-sm text-[#A8A9AD] text-center mb-4">Select today's class:</p>
                <div className="space-y-3">
                  {classes.length > 0 ? (
                    classes.map(cls => (
                      <button
                        key={cls.id}
                        onClick={() => setSelectedClass(cls.class_name)}
                        className={`w-full text-left px-6 py-5 border-2 transition-colors ${selectedClass === cls.class_name ? "border-[#C9A84C] bg-[#C9A84C]/10" : "border-[#A8A9AD]/20 bg-black hover:border-[#A8A9AD]/40"}`}
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
                <button onClick={reset} className="flex-1 flex items-center justify-center gap-2 px-6 py-5 border border-[#A8A9AD]/30 text-[#A8A9AD] text-lg font-medium hover:text-white hover:border-[#A8A9AD]/50 transition-colors">
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

      <div className="border-t border-[#A8A9AD]/10 p-4 text-center">
        <p className="text-xs text-[#A8A9AD]/40">Chosen Martial Arts Academy • Kiosk Mode</p>
      </div>
    </div>
  );
}