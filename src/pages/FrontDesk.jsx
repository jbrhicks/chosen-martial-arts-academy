import { useEffect, useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Lock, Delete } from "lucide-react";
import KioskOnboarding from "@/components/frontdesk/KioskOnboarding";
import KioskPOS from "@/components/frontdesk/KioskPOS";
import KioskEventCheckIn from "@/components/frontdesk/KioskEventCheckIn";
import Logo from "@/components/Logo";

export default function FrontDesk() {
  const [unlocked, setUnlocked] = useState(false);
  const [showUnlock, setShowUnlock] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const [adminName, setAdminName] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [view, setView] = useState("home");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [tapCount, setTapCount] = useState(0);
  const tapTimer = useRef(null);
  const lastActivity = useRef(Date.now());

  // Idle timeout — 3 minutes reverts to home
  useEffect(() => {
    if (!unlocked) return;
    const resetActivity = () => { lastActivity.current = Date.now(); };
    window.addEventListener("click", resetActivity);
    window.addEventListener("touchstart", resetActivity);
    const interval = setInterval(() => {
      if (Date.now() - lastActivity.current > 3 * 60 * 1000) {
        setView("home");
      }
    }, 5000);
    return () => {
      window.removeEventListener("click", resetActivity);
      window.removeEventListener("touchstart", resetActivity);
      clearInterval(interval);
    };
  }, [unlocked]);

  // Triple-tap logo to reveal admin unlock
  const handleLogoTap = () => {
    const newCount = tapCount + 1;
    setTapCount(newCount);
    if (tapTimer.current) clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => setTapCount(0), 600);
    if (newCount >= 3) { setShowUnlock(true); setTapCount(0); }
  };

  // URL param for admin access
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("admin") === "1") setShowUnlock(true);
  }, []);

  const handleUnlock = async () => {
    if (pin.length < 4 || pin.length > 6) { setError("PIN must be 4-6 digits"); return; }
    setUnlocking(true);
    setError("");
    try {
      const res = await base44.functions.invoke("unlockKiosk", { pin, device_name: "Front Desk Tablet" });
      const data = res.data || res;
      if (data.success) {
        setUnlocked(true);
        setAdminName(data.admin_name);
        setSessionId(data.session_id);
        setShowUnlock(false);
        setPin("");
      } else {
        setError(data.error || "Invalid PIN");
      }
    } catch (e) {
      setError("Invalid PIN. Please try again.");
    }
    setUnlocking(false);
  };

  const handleLock = async () => {
    try { await base44.functions.invoke("unlockKiosk", { action: "lock", session_id: sessionId }); } catch (e) { console.error("Lock failed:", e); }
    setUnlocked(false);
    setView("home");
    setAdminName("");
    setSessionId("");
  };

  // === LOCKED SCREEN ===
  if (!unlocked && !showUnlock) {
    return (
      <div className="fixed inset-0 bg-[#0A0A0A] text-white flex items-center justify-center" onClick={handleLogoTap}>
        <div className="text-center">
          <Logo size={80} className="mx-auto mb-6" />
          <h1 className="font-bold text-2xl tracking-widest uppercase mb-2">Chosen</h1>
          <p className="text-sm tracking-[0.2em] text-[#A8A9AD] uppercase">Martial Arts Academy</p>
          <p className="text-xs text-[#A8A9AD]/40 mt-8">Tap logo 3 times for admin access</p>
        </div>
      </div>
    );
  }

  // === ADMIN UNLOCK PORTAL ===
  if (!unlocked && showUnlock) {
    return (
      <div className="fixed inset-0 bg-[#0A0A0A] text-white flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 border-2 border-[#C9A84C] flex items-center justify-center mx-auto mb-4">
              <Lock size={28} className="text-[#C9A84C]" />
            </div>
            <h1 className="text-xl font-bold tracking-widest uppercase">Admin Unlock</h1>
            <p className="text-sm text-[#A8A9AD] mt-1">Enter your Admin PIN to launch Kiosk Mode</p>
          </div>
          <div className="flex justify-center gap-3 mb-6">
            {[0, 1, 2, 3, 4, 5].map(i => (
              <div key={i} className={`w-4 h-4 rounded-full border ${i < pin.length ? "bg-[#C9A84C] border-[#C9A84C]" : "border-[#A8A9AD]/40"}`} />
            ))}
          </div>
          {error && <p className="text-center text-red-400 text-sm mb-4">{error}</p>}
          <div className="grid grid-cols-3 gap-3">
            {["1","2","3","4","5","6","7","8","9"].map(n => (
              <button key={n} onClick={() => pin.length < 6 && setPin(pin + n)} className="h-16 border border-[#A8A9AD]/30 text-2xl font-bold hover:bg-[#C9A84C]/10 hover:border-[#C9A84C]/50 transition-colors">{n}</button>
            ))}
            <button onClick={() => setPin(pin.slice(0, -1))} className="h-16 border border-[#A8A9AD]/30 flex items-center justify-center hover:bg-white/5 transition-colors"><Delete size={22} className="text-[#A8A9AD]" /></button>
            <button onClick={() => pin.length < 6 && setPin(pin + "0")} className="h-16 border border-[#A8A9AD]/30 text-2xl font-bold hover:bg-[#C9A84C]/10 hover:border-[#C9A84C]/50 transition-colors">0</button>
            <button onClick={handleUnlock} disabled={unlocking || pin.length < 4} className="h-16 bg-[#C9A84C] text-black font-bold text-sm tracking-wide uppercase hover:bg-[#E0C97A] transition-colors disabled:opacity-40 flex items-center justify-center">
              {unlocking ? <Loader2 size={20} className="animate-spin" /> : "Unlock"}
            </button>
          </div>
          <button onClick={() => setShowUnlock(false)} className="w-full mt-6 text-sm text-[#A8A9AD] hover:text-white transition-colors">Cancel</button>
        </div>
      </div>
    );
  }

  // === KIOSK HOME ===
  if (unlocked && view === "home") {
    return (
      <div className="fixed inset-0 bg-[#0A0A0A] text-white flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-[#A8A9AD]/10">
          <div className="flex items-center gap-3">
            <Logo size={40} />
            <div><div className="font-bold text-xs tracking-widest uppercase">Chosen</div><div className="text-[9px] tracking-[0.15em] text-[#A8A9AD] uppercase">Front Desk Kiosk</div></div>
          </div>
          <button onClick={handleLock} className="flex items-center gap-2 px-4 py-2 border border-[#A8A9AD]/30 text-xs text-[#A8A9AD] hover:text-white hover:border-[#A8A9AD]/60 transition-colors"><Lock size={14} /> Lock Kiosk</button>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl w-full">
            <button onClick={() => setView("onboarding")} className="group bg-[#C9A84C] text-black p-10 md:p-14 text-center hover:bg-[#E0C97A] transition-colors flex flex-col items-center justify-center min-h-[280px]">
              <div className="w-16 h-16 border-2 border-black/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"><span className="text-3xl">🥋</span></div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2">New to Chosen?</h2>
              <p className="text-sm md:text-base font-medium opacity-80">Start Here — Register & Enroll</p>
            </button>
            <button onClick={() => setView("pos")} className="group bg-[#1a1a1a] border-2 border-[#A8A9AD]/40 text-white p-10 md:p-14 text-center hover:border-[#A8A9AD] transition-colors flex flex-col items-center justify-center min-h-[280px]">
              <div className="w-16 h-16 border-2 border-[#A8A9AD]/40 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"><span className="text-3xl">🛒</span></div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2">Current Member</h2>
              <p className="text-sm md:text-base font-medium text-[#A8A9AD]">Shop & Checkout</p>
            </button>
            <button onClick={() => setView("event-checkin")} className="group bg-[#1a1a1a] border-2 border-[#A8A9AD]/40 text-white p-10 md:p-14 text-center hover:border-[#C9A84C]/60 transition-colors flex flex-col items-center justify-center min-h-[280px]">
              <div className="w-16 h-16 border-2 border-[#A8A9AD]/40 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"><span className="text-3xl">📋</span></div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2">Event Check-In</h2>
              <p className="text-sm md:text-base font-medium text-[#A8A9AD]">Check In Attendees</p>
            </button>
          </div>
        </div>
        <div className="p-4 text-center border-t border-[#A8A9AD]/10"><p className="text-xs text-[#A8A9AD]/40">Unlocked by {adminName} • Auto-resets after 3 min idle</p></div>
      </div>
    );
  }

  // === ONBOARDING FLOW ===
  if (unlocked && view === "onboarding") {
    return <KioskOnboarding onBack={() => setView("home")} onComplete={() => setView("home")} />;
  }

  // === POS FLOW ===
  if (unlocked && view === "pos") {
    return <KioskPOS onBack={() => setView("home")} />;
  }

  // === EVENT CHECK-IN FLOW ===
  if (unlocked && view === "event-checkin") {
    return <KioskEventCheckIn onBack={() => { setView("home"); setSelectedEvent(null); }} selectedEvent={selectedEvent} setSelectedEvent={setSelectedEvent} />;
  }

  return null;
}