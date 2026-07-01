import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Loader2, ChevronRight, ArrowLeft, ShieldAlert, AlertTriangle, CalendarCheck } from "lucide-react";
import TrialValueChecklist from "@/components/lead/TrialValueChecklist";
import { useAuth } from "@/lib/AuthContext";

export default function LeadForm() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    inquiry_type: "",
    program_of_interest: "",
    full_name: "",
    email: "",
    phone: "",
    student_age: "",
  });
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [selectedClass, setSelectedClass] = useState(null);
  const [showOverride, setShowOverride] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");

  useEffect(() => {
    const loadClassFromHash = () => {
      const hashParts = window.location.hash.split("?");
      const params = new URLSearchParams(hashParts[1] || "");
      const classId = params.get("class");
      if (classId) {
        base44.entities.ClassSchedule.get(classId)
          .then(cls => {
            if (cls && cls.is_trial_eligible) setSelectedClass(cls);
          })
          .catch(() => {});
      }
    };
    loadClassFromHash();
    window.addEventListener("hashchange", loadClassFromHash);
    return () => window.removeEventListener("hashchange", loadClassFromHash);
  }, []);

  const ageNum = parseInt(form.student_age);
  const hasAge = !isNaN(ageNum) && form.student_age !== "";
  const minAge = selectedClass?.min_age || 0;
  const maxAge = selectedClass?.max_age || 99;
  const ageMismatch = selectedClass && hasAge && (ageNum < minAge || ageNum > maxAge);
  const ageRangeLabel = selectedClass
    ? minAge === 0 && maxAge === 99 ? "All Ages"
      : maxAge >= 99 ? `Ages ${minAge}+`
      : `Ages ${minAge}–${maxAge}`
    : "";

  const handleSubmit = async (override = false) => {
    if (!form.full_name || !form.email || !form.phone) {
      setError("Please fill in your name, email, and phone number.");
      return;
    }
    if (selectedClass && !hasAge) {
      setError("Please enter the student's age to verify class eligibility.");
      return;
    }
    if (ageMismatch && !override) {
      setShowOverride(true);
      return;
    }
    if (override && !overrideReason.trim()) {
      setError("Please provide a reason for the override request.");
      return;
    }
    setStatus("loading");
    setError("");
    try {
      const lead = await base44.entities.Lead.create({
        ...form,
        student_age: hasAge ? ageNum : undefined,
        interest: form.program_of_interest + " Program",
        status: "new",
        pipeline_stage: "new_lead",
        lead_source: "Website",
        trial_class_id: selectedClass?.id || undefined,
        trial_class_name: selectedClass?.class_name || undefined,
        override_requested: override,
        override_reason: override ? overrideReason.trim() : undefined,
      });
      navigate(`/trial-booking?lead=${lead.id}`);
    } catch (err) {
      setError("Something went wrong. Please try again or call us at (555) 123-4567.");
      setStatus("error");
    }
  };

  if (isAuthenticated) {
    return (
      <div className="border border-[#A8A9AD]/20 p-6 text-center">
        <ShieldAlert size={32} className="text-[#C9A84C] mx-auto mb-3" />
        <h3 className="text-lg font-bold mb-2">You're Already a Member!</h3>
        <p className="text-sm text-[#A8A9AD] mb-4">
          The free trial is for new students. As a current member, head to your portal to explore classes and programs.
        </p>
        <button
          onClick={() => navigate(user?.role === "admin" ? "/admin" : "/portal")}
          className="px-6 py-3 bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase hover:bg-[#E0C97A] transition-colors"
        >
          Go to {user?.role === "admin" ? "Dashboard" : "Member Portal"}
        </button>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-6">
          <div className="w-6 h-6 border border-[#C9A84C] flex items-center justify-center text-[#C9A84C] text-xs font-bold">1</div>
          <span className="text-xs tracking-widest uppercase text-[#A8A9AD]">Step 1 of 3</span>
        </div>
        <h3 className="text-2xl font-bold mb-2">Who are you inquiring for?</h3>
        <p className="text-sm text-[#A8A9AD] mb-6">Just getting to know you. This helps us personalize your experience.</p>
        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => { setForm({ ...form, inquiry_type: "myself" }); setStep(2); }} className="border-2 border-[#A8A9AD]/30 p-6 hover:border-[#C9A84C] hover:bg-[#C9A84C]/5 transition-all text-left">
            <p className="text-lg font-bold mb-1">Myself</p>
            <p className="text-xs text-[#A8A9AD]">I want to train</p>
          </button>
          <button onClick={() => { setForm({ ...form, inquiry_type: "child" }); setStep(2); }} className="border-2 border-[#A8A9AD]/30 p-6 hover:border-[#C9A84C] hover:bg-[#C9A84C]/5 transition-all text-left">
            <p className="text-lg font-bold mb-1">My Child</p>
            <p className="text-xs text-[#A8A9AD]">For my kid(s)</p>
          </button>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-6">
          <div className="w-6 h-6 border border-[#C9A84C] flex items-center justify-center text-[#C9A84C] text-xs font-bold">2</div>
          <span className="text-xs tracking-widest uppercase text-[#A8A9AD]">Step 2 of 3</span>
        </div>
        <h3 className="text-2xl font-bold mb-2">Which program interests you?</h3>
        <p className="text-sm text-[#A8A9AD] mb-6">Choose the program that best fits your needs.</p>
        <div className="space-y-3">
          {[
            { value: "Youth", desc: "Ages 4-12" },
            { value: "Teen", desc: "Ages 13-17" },
            { value: "Adult", desc: "Ages 18+" },
          ].map(prog => (
            <button key={prog.value} onClick={() => { setForm({ ...form, program_of_interest: prog.value }); setStep(3); }} className="w-full border-2 border-[#A8A9AD]/30 p-4 hover:border-[#C9A84C] hover:bg-[#C9A84C]/5 transition-all text-left flex items-center justify-between">
              <div>
                <p className="font-bold">{prog.value}</p>
                <p className="text-xs text-[#A8A9AD]">{prog.desc}</p>
              </div>
              <ChevronRight size={18} className="text-[#A8A9AD]" />
            </button>
          ))}
        </div>
        <button onClick={() => setStep(1)} className="mt-6 flex items-center gap-2 text-xs text-[#A8A9AD] hover:text-white">
          <ArrowLeft size={14} /> Back
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <div className="w-6 h-6 border border-[#C9A84C] flex items-center justify-center text-[#C9A84C] text-xs font-bold">3</div>
        <span className="text-xs tracking-widest uppercase text-[#A8A9AD]">Step 3 of 3</span>
      </div>
      <h3 className="text-2xl font-bold mb-2">Claim your free trial</h3>
      <p className="text-sm text-[#A8A9AD] mb-6">Last step! Enter your info and we'll send your trial pass instantly.</p>
      <TrialValueChecklist compact />
      {selectedClass && (
        <div className="mb-4 border border-[#C9A84C]/30 bg-[#C9A84C]/5 p-4 flex items-center gap-3">
          <CalendarCheck size={18} className="text-[#C9A84C] shrink-0" />
          <div>
            <p className="text-sm font-bold text-white">{selectedClass.class_name}</p>
            <p className="text-xs text-[#A8A9AD]">{selectedClass.day_of_week} · {selectedClass.start_time} · {ageRangeLabel}</p>
          </div>
        </div>
      )}
      <div className="space-y-4">
        <div>
          <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Full Name *</label>
          <input type="text" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-3 text-white text-sm focus:border-[#C9A84C] focus:outline-none" placeholder="John Doe" />
        </div>
        <div>
          <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Email *</label>
          <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-3 text-white text-sm focus:border-[#C9A84C] focus:outline-none" placeholder="john@example.com" />
        </div>
        <div>
          <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Phone *</label>
          <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-3 text-white text-sm focus:border-[#C9A84C] focus:outline-none" placeholder="(555) 123-4567" />
        </div>
        {selectedClass && (
          <div>
            <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Age of Student *</label>
            <input type="number" min="0" max="99" value={form.student_age} onChange={e => setForm({ ...form, student_age: e.target.value })} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-3 text-white text-sm focus:border-[#C9A84C] focus:outline-none" placeholder="e.g., 8" />
            <p className="text-xs text-[#A8A9AD] mt-1">Required to verify eligibility for this class.</p>
          </div>
        )}
        {ageMismatch && !showOverride && (
          <div className="border border-red-500/30 bg-red-500/5 p-4 flex items-start gap-3">
            <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-400">Age doesn't match this class</p>
              <p className="text-xs text-[#A8A9AD] mt-1">This class is for {ageRangeLabel}. The age you entered ({ageNum}) is outside that range.</p>
            </div>
          </div>
        )}
        {showOverride && (
          <div className="border border-[#C9A84C]/30 bg-[#C9A84C]/5 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className="text-[#C9A84C] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-white">Request an Age Override</p>
                <p className="text-xs text-[#A8A9AD] mt-1">If you believe this student should be allowed in this class, tell us why. Our team will review and get back to you.</p>
              </div>
            </div>
            <textarea value={overrideReason} onChange={e => setOverrideReason(e.target.value)} rows={3} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-3 text-white text-sm focus:border-[#C9A84C] focus:outline-none resize-none" placeholder="e.g., My child has 2 years of prior martial arts experience..." />
          </div>
        )}
        {error && <p className="text-red-400 text-sm">{error}</p>}
        {showOverride ? (
          <>
            <button onClick={() => handleSubmit(true)} disabled={status === "loading"} className="w-full bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase py-4 hover:bg-[#E0C97A] transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
              {status === "loading" ? <><Loader2 size={18} className="animate-spin" /> Processing...</> : <>Submit Override Request <ChevronRight size={18} /></>}
            </button>
            <button onClick={() => setShowOverride(false)} className="w-full flex items-center justify-center gap-2 text-xs text-[#A8A9AD] hover:text-white">
              <ArrowLeft size={14} /> Cancel Override
            </button>
          </>
        ) : (
          <>
            <button onClick={() => handleSubmit(false)} disabled={status === "loading"} className="w-full bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase py-4 hover:bg-[#E0C97A] transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
              {status === "loading" ? <><Loader2 size={18} className="animate-spin" /> Processing...</> : <>Claim Your Free Trial <ChevronRight size={18} /></>}
            </button>
            {ageMismatch && (
              <button onClick={() => setShowOverride(true)} className="w-full border border-[#A8A9AD]/30 text-[#A8A9AD] font-bold text-xs tracking-widest uppercase py-3 hover:text-white hover:border-[#C9A84C]/50 transition-colors">
                Request Age Override
              </button>
            )}
          </>
        )}
        <button onClick={() => setStep(2)} className="w-full flex items-center justify-center gap-2 text-xs text-[#A8A9AD] hover:text-white">
          <ArrowLeft size={14} /> Back
        </button>
      </div>
    </div>
  );
}