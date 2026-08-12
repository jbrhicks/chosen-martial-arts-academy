import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Loader2, CheckCircle, AlertTriangle, Key, Lock, Mail, LogIn } from "lucide-react";

export default function Activate() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState("verifying");
  const [pin, setPin] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [resendEmail, setResendEmail] = useState("");
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!token) { setStatus("request"); return; }
    base44.functions.invoke("activateAccount", { token })
      .then(res => {
        const data = res.data || res;
        if (data.valid) {
          setStatus("setup");
          setUserEmail(data.email || "");
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

  const handleSetup = async () => {
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) { setError("PIN must be exactly 4 digits"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }
    setStatus("submitting");
    setError("");
    try {
      // Step 1: Try to register (creates User record + auth identity with chosen password)
      let registerSucceeded = false;
      try {
        await base44.auth.register({ email: userEmail, password });
        registerSucceeded = true;
      } catch (regErr) {
        // Register failed — User already has an auth identity (from a prior inviteUser).
        // Fall back to password reset email flow.
      }

      // Step 2: Activate account and save PIN
      const res = await base44.functions.invoke("activateAccount", { token, pin });
      const data = res.data || res;
      if (!data.success) {
        setError(data.error || "Activation failed");
        setStatus("setup");
        return;
      }

      if (registerSucceeded) {
        // Step 3: Show OTP input for email verification
        setStatus("otp");
      } else {
        // Fallback: send password reset email (user already has auth identity)
        try { await base44.auth.resetPasswordRequest(userEmail); } catch (e) { /* ignore */ }
        setStatus("fallback");
      }
    } catch (e) {
      setError("Activation failed. Please try again.");
      setStatus("setup");
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length < 6) { setError("Enter the 6-digit code"); return; }
    setStatus("verifying_otp");
    setError("");
    try {
      const result = await base44.auth.verifyOtp({ email: userEmail, otpCode });
      if (result?.access_token) {
        base44.auth.setToken(result.access_token);
      }
      // Link any existing leads/invitations
      await base44.functions.invoke("linkLeadToUser", { email: userEmail }).catch(() => {});
      window.location.href = "/";
    } catch (err) {
      setError(err.message || "Invalid verification code");
      setStatus("otp");
    }
  };

  const handleResendOtp = async () => {
    try {
      await base44.auth.resendOtp(userEmail);
      setError("");
    } catch (err) {
      setError("Failed to resend code");
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

        {status === "setup" && (
          <div className="border border-[#C9A84C]/30 bg-black p-8">
            <div className="text-center mb-6">
              <div className="w-14 h-14 border-2 border-[#C9A84C] flex items-center justify-center mx-auto mb-4">
                <Key size={24} className="text-[#C9A84C]" />
              </div>
              <h2 className="text-xl font-bold mb-1">Set Up Your Account</h2>
              <p className="text-sm text-[#A8A9AD]">Welcome, {firstName}! Create your check-in PIN and login password below.</p>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">4-Digit Check-In PIN</label>
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
                <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Login Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-3 text-white focus:border-[#C9A84C] focus:outline-none"
                  placeholder="At least 6 characters"
                />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-3 text-white focus:border-[#C9A84C] focus:outline-none"
                  placeholder="Re-enter password"
                />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button
                onClick={handleSetup}
                disabled={status === "submitting"}
                className="w-full bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase py-4 hover:bg-[#E0C97A] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {status === "submitting" ? <><Loader2 size={18} className="animate-spin" /> Setting up...</> : "Activate & Create Account"}
              </button>
            </div>
          </div>
        )}

        {status === "submitting" && (
          <div className="text-center py-12">
            <Loader2 size={32} className="animate-spin text-[#C9A84C] mx-auto mb-4" />
            <p className="text-sm text-[#A8A9AD]">Creating your account...</p>
          </div>
        )}

        {status === "otp" && (
          <div className="border border-[#C9A84C]/30 bg-black p-8">
            <div className="text-center mb-6">
              <div className="w-14 h-14 border-2 border-[#C9A84C] flex items-center justify-center mx-auto mb-4">
                <Mail size={24} className="text-[#C9A84C]" />
              </div>
              <h2 className="text-xl font-bold mb-1">Verify Your Email</h2>
              <p className="text-sm text-[#A8A9AD]">We sent a 6-digit code to {userEmail}. Enter it below to finish setting up your account.</p>
            </div>
            <div className="space-y-5">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otpCode}
                onChange={e => setOtpCode(e.target.value.replace(/\D/g, ""))}
                className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-3 text-white text-center text-2xl tracking-[0.4em] focus:border-[#C9A84C] focus:outline-none"
                placeholder="••••••"
                autoFocus
              />
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button
                onClick={handleVerifyOtp}
                disabled={status === "verifying_otp" || otpCode.length < 6}
                className="w-full bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase py-4 hover:bg-[#E0C97A] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {status === "verifying_otp" ? <><Loader2 size={18} className="animate-spin" /> Verifying...</> : "Verify & Log In"}
              </button>
              <button onClick={handleResendOtp} className="w-full text-sm text-[#A8A9AD] hover:text-[#C9A84C] tracking-wide">
                Didn't get the code? Resend
              </button>
            </div>
          </div>
        )}

        {status === "fallback" && (
          <div className="border border-[#C9A84C]/30 bg-black p-8 text-center">
            <div className="w-16 h-16 border-2 border-[#C9A84C] flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-[#C9A84C]" />
            </div>
            <h2 className="text-xl font-bold mb-2">PIN Set — Finish Your Password</h2>
            <p className="text-sm text-[#A8A9AD] mb-4">Your check-in PIN is saved. We've sent a password setup link to <span className="text-white font-medium">{userEmail}</span>.</p>
            <p className="text-sm text-[#A8A9AD] mb-6">Check your email, click the link to set your password, then log in.</p>
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

        {status === "request" && (
          <div className="border border-[#C9A84C]/30 bg-black p-8 text-center">
            <div className="w-14 h-14 border-2 border-[#C9A84C] flex items-center justify-center mx-auto mb-4">
              <Mail size={24} className="text-[#C9A84C]" />
            </div>
            <h2 className="text-xl font-bold mb-2">Activate Your Account</h2>
            <p className="text-sm text-[#A8A9AD] mb-6">Enter the email you used when you were invited or onboarded to receive your activation link.</p>
            <div className="space-y-4">
              <input
                type="email"
                value={resendEmail}
                onChange={e => setResendEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-3 text-sm text-white focus:border-[#C9A84C] focus:outline-none"
              />
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button
                onClick={handleResend}
                disabled={resending}
                className="w-full bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase py-3 hover:bg-[#E0C97A] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {resending ? <><Loader2 size={16} className="animate-spin" /> Sending...</> : "Send Activation Link"}
              </button>
            </div>
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