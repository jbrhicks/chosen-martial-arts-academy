import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Loader2, CheckCircle, AlertTriangle, Key, Lock, Mail } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export default function Activate() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState("verifying");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [needsRegistration, setNeedsRegistration] = useState(false);
  const [resendEmail, setResendEmail] = useState("");
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!token) { setStatus("error"); return; }
    base44.functions.invoke("activateAccount", { token })
      .then(res => {
        const data = res.data || res;
        if (data.valid) {
          setStatus("valid");
          setUserEmail(data.email || "");
          setFirstName(data.first_name);
          setNeedsRegistration(!!data.needs_registration);
        } else if (data.reason === "expired") {
          setStatus("expired");
          setUserEmail(data.email || "");
        } else {
          setStatus("error");
        }
      })
      .catch(() => setStatus("error"));
  }, [token]);

  // Existing user flow: just set PIN
  const handleActivateExisting = async () => {
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

  // New user flow: register → OTP → verifyOtp → setToken → activateAccount(PIN)
  const handleRegisterAndActivate = async () => {
    setError("");
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) { setError("PIN must be exactly 4 digits"); return; }
    if (pin !== confirmPin) { setError("PINs do not match"); return; }
    setStatus("registering");
    try {
      // Step 1: Register the account (sends OTP)
      await base44.auth.register({ email: userEmail, password });
      setStatus("otp");
    } catch (e) {
      setError(e.message || "Registration failed");
      setStatus("valid");
    }
  };

  const handleVerifyOtp = async () => {
    setError("");
    setStatus("activating");
    try {
      // Step 2: Verify OTP and get access token
      const result = await base44.auth.verifyOtp({ email: userEmail, otpCode });
      if (result?.access_token) {
        base44.auth.setToken(result.access_token);
      }
      // Step 3: Set PIN and role via activateAccount
      const res = await base44.functions.invoke("activateAccount", { token, pin });
      const data = res.data || res;
      if (data.success) {
        setStatus("success");
      } else {
        setError(data.error || "Activation failed");
        setStatus("otp");
      }
    } catch (e) {
      setError(e.message || "Invalid verification code");
      setStatus("otp");
    }
  };

  const handleResendOtp = async () => {
    try {
      await base44.auth.resendOtp(userEmail);
    } catch (e) {
      setError(e.message || "Failed to resend code");
    }
  };

  const handleResend = async () => {
    if (!resendEmail) return;
    setResending(true);
    try {
      await base44.functions.invoke("generateActivationToken", { email: resendEmail });
      setStatus("resent");
    } catch (e) {
      setError("Failed to resend. Please contact the academy.");
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

        {status === "valid" && !needsRegistration && (
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
                onClick={handleActivateExisting}
                disabled={status === "activating"}
                className="w-full bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase py-4 hover:bg-[#E0C97A] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {status === "activating" ? <><Loader2 size={18} className="animate-spin" /> Activating...</> : <>Activate Account</>}
              </button>
            </div>
          </div>
        )}

        {status === "valid" && needsRegistration && (
          <div className="border border-[#C9A84C]/30 bg-black p-8">
            <div className="text-center mb-6">
              <div className="w-14 h-14 border-2 border-[#C9A84C] flex items-center justify-center mx-auto mb-4">
                <Key size={24} className="text-[#C9A84C]" />
              </div>
              <h2 className="text-xl font-bold mb-1">Activate Your Account</h2>
              <p className="text-sm text-[#A8A9AD]">Welcome, {firstName}! Set up your password and check-in PIN to get started.</p>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Create Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-3 text-sm text-white focus:border-[#C9A84C] focus:outline-none"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-3 text-sm text-white focus:border-[#C9A84C] focus:outline-none"
                  placeholder="••••••••"
                />
              </div>
              <hr className="border-[#A8A9AD]/20" />
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
                onClick={handleRegisterAndActivate}
                disabled={status === "registering"}
                className="w-full bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase py-4 hover:bg-[#E0C97A] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {status === "registering" ? <><Loader2 size={18} className="animate-spin" /> Creating account...</> : <>Activate Account</>}
              </button>
            </div>
          </div>
        )}

        {status === "otp" && (
          <div className="border border-[#C9A84C]/30 bg-black p-8">
            <div className="text-center mb-6">
              <div className="w-14 h-14 border-2 border-[#C9A84C] flex items-center justify-center mx-auto mb-4">
                <Mail size={24} className="text-[#C9A84C]" />
              </div>
              <h2 className="text-xl font-bold mb-1">Verify Your Email</h2>
              <p className="text-sm text-[#A8A9AD]">We sent a verification code to {userEmail}. Enter it below to complete activation.</p>
            </div>
            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
            <div className="flex justify-center mb-6">
              <InputOTP
                maxLength={6}
                value={otpCode}
                onChange={setOtpCode}
                autoFocus
                autoComplete="one-time-code"
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <button
              onClick={handleVerifyOtp}
              disabled={status === "activating" || otpCode.length < 6}
              className="w-full bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase py-4 hover:bg-[#E0C97A] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {status === "activating" ? <><Loader2 size={18} className="animate-spin" /> Activating...</> : <>Verify & Activate</>}
            </button>
            <p className="text-center text-sm text-[#A8A9AD] mt-4">
              Didn't receive the code?{" "}
              <button onClick={handleResendOtp} className="text-[#C9A84C] font-medium hover:text-[#E0C97A]">Resend</button>
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="border border-[#C9A84C]/30 bg-black p-8 text-center">
            <div className="w-16 h-16 border-2 border-[#C9A84C] flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-[#C9A84C]" />
            </div>
            <h2 className="text-xl font-bold mb-2">Account Activated!</h2>
            {needsRegistration ? (
              <>
                <p className="text-sm text-[#A8A9AD] mb-6">Your account is set up and ready to go. You're now logged in — head to your dashboard to get started.</p>
                <button
                  onClick={() => window.location.href = "/dashboard"}
                  className="inline-block px-6 py-3 bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase hover:bg-[#E0C97A]"
                >
                  Go to Dashboard
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-[#A8A9AD] mb-4">Your check-in PIN is set. We've sent a password setup link to <span className="text-white font-medium">{userEmail}</span>.</p>
                <p className="text-sm text-[#A8A9AD] mb-6">Check your email, click the link to set your password, and you'll be ready to log in to your dashboard.</p>
                <Link to="/login" className="inline-block px-6 py-3 bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase hover:bg-[#E0C97A]">Go to Login</Link>
              </>
            )}
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