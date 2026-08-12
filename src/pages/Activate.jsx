import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Loader2, CheckCircle, AlertTriangle, Key, Lock, Mail } from "lucide-react";

export default function Activate() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState("verifying");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [resendEmail, setResendEmail] = useState("");
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!token) { setStatus("error"); return; }
    base44.functions.invoke("activateAccount", { token })
      .then(res => {
        const data = res.data || res;
        if (data.valid) {
          setStatus("valid");
          setUserEmail(data.email);
          setFirstName(data.first_name);
        } else if (data.reason === "expired") {
          setStatus("expired");
          setUserEmail(data.email || "");
        } else {
          setStatus("error");
        }
      })
      .catch(() => setStatus("error"));
  }, [token]);

  const handleActivate = async () => {
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) { setError("PIN must be exactly 4 digits"); return; }
    if (pin !== confirmPin) { setError("PINs do not match"); return; }
    setStatus("activating");
    setError("");
    try {
      const res = await base44.functions.invoke("activateAccount", { token, pin });
      const data = res.data || res;
      if (data.success) {
        setUserEmail(data.email);
        try { await base44.auth.resetPasswordRequest(data.email); } catch (e) { console.error("Password email failed:", e); }
        setStatus("success");
      } else {
        setError(data.error || "Activation failed");
        setStatus("valid");
      }
    } catch (e) {
      setError("Activation failed. Please try again.");
      setStatus("valid");
    }
  };

  const handleResend = async () => {
    if (!resendEmail) return;
    setResending(true);
    try {
      await base44.functions.invoke("generateActivationToken", { email: resendEmail });
      setStatus("resent");
    } catch (e) {
      setError("Failed to resend. Please contact the academy at (555) 123-4567.");
    }
    setResending(false);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-2">
            <div className="w-12 h-12 border-2 border-[#C9A84C] flex items-center justify-center">
              <span className="text-[#C9A84C] font-bold text-xl">C</span>
            </div>
          </div>
          <h1 className="font-bold text-sm tracking-widest uppercase">Chosen</h1>
          <p className="text-[10px] tracking-[0.2em] text-[#A8A9AD] uppercase">Martial Arts Academy</p>
        </div>

        {status === "verifying" && (
          <div className="text-center py-12">
            <Loader2 size={32} className="animate-spin text-[#C9A84C] mx-auto mb-4" />
            <p className="text-sm text-[#A8A9AD]">Verifying your activation link...</p>
          </div>
        )}

        {status === "valid" && (
          <div className="border border-[#C9A84C]/30 bg-black p-8">
            <div className="text-center mb-6">
              <div className="w-14 h-14 border-2 border-[#C9A84C] flex items-center justify-center mx-auto mb-4">
                <Key size={24} className="text-[#C9A84C]" />
              </div>
              <h2 className="text-xl font-bold mb-1">Activate Your Account</h2>
              <p className="text-sm text-[#A8A9AD]">Welcome, {firstName}! Set up your check-in PIN to get started.</p>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Create Your 4-Digit Check-In PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={pin}
                  onChange={e => setPin(e.target.value.replace(/\D/g, ""))}
                  className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-3 text-white text-center text-2xl tracking-[0.5em] focus:border-[#C9A84C] focus:outline-none"
                  placeholder="••••"
                />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Confirm PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={confirmPin}
                  onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                  className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-3 text-white text-center text-2xl tracking-[0.5em] focus:border-[#C9A84C] focus:outline-none"
                  placeholder="••••"
                />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button
                onClick={handleActivate}
                disabled={status === "activating"}
                className="w-full bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase py-4 hover:bg-[#E0C97A] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {status === "activating" ? <><Loader2 size={18} className="animate-spin" /> Activating...</> : <>Activate Account</>}
              </button>
            </div>
          </div>
        )}

        {status === "success" && (
          <div className="border border-[#C9A84C]/30 bg-black p-8 text-center">
            <div className="w-16 h-16 border-2 border-[#C9A84C] flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-[#C9A84C]" />
            </div>
            <h2 className="text-xl font-bold mb-2">Account Activated!</h2>
            <p className="text-sm text-[#A8A9AD] mb-4">Your check-in PIN is set. We've sent a password setup link to <span className="text-white font-medium">{userEmail}</span>.</p>
            <p className="text-sm text-[#A8A9AD] mb-6">Check your email, click the link to set your password, and you'll be ready to log in to your dashboard.</p>
            <Link to="/login" className="inline-block px-6 py-3 bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase hover:bg-[#E0C97A]">Go to Login</Link>
          </div>
        )}

        {status === "expired" && (
          <div className="border border-red-400/30 bg-black p-8 text-center">
            <div className="w-14 h-14 border-2 border-red-400 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={24} className="text-red-400" />
            </div>
            <h2 className="text-xl font-bold mb-2">Link Expired</h2>
            <p className="text-sm text-[#A8A9AD] mb-6">This activation link has expired. Enter your email to receive a new one.</p>
            <div className="space-y-4">
              <input
                type="email"
                value={resendEmail || userEmail}
                onChange={e => setResendEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-3 text-sm text-white focus:border-[#C9A84C] focus:outline-none"
              />
              <button
                onClick={handleResend}
                disabled={resending}
                className="w-full bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase py-3 hover:bg-[#E0C97A] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {resending ? <><Loader2 size={16} className="animate-spin" /> Sending...</> : "Resend Activation Link"}
              </button>
            </div>
          </div>
        )}

        {status === "resent" && (
          <div className="border border-[#C9A84C]/30 bg-black p-8 text-center">
            <div className="w-14 h-14 border-2 border-[#C9A84C] flex items-center justify-center mx-auto mb-4">
              <Mail size={24} className="text-[#C9A84C]" />
            </div>
            <h2 className="text-xl font-bold mb-2">Check Your Email</h2>
            <p className="text-sm text-[#A8A9AD]">A new activation link has been sent. It will expire in 48 hours.</p>
          </div>
        )}

        {status === "error" && (
          <div className="border border-red-400/30 bg-black p-8 text-center">
            <div className="w-14 h-14 border-2 border-red-400 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={24} className="text-red-400" />
            </div>
            <h2 className="text-xl font-bold mb-2">Invalid Link</h2>
            <p className="text-sm text-[#A8A9AD] mb-6">This activation link is invalid or has already been used.</p>
            <Link to="/" className="text-sm text-[#C9A84C] hover:text-[#E0C97A] tracking-wide uppercase font-medium">Back to Home</Link>
          </div>
        )}
      </div>
    </div>
  );
}