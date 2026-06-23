import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Loader2, ChevronRight, ArrowLeft } from "lucide-react";

export default function LeadForm() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    inquiry_type: "",
    program_of_interest: "",
    full_name: "",
    email: "",
    phone: "",
  });
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!form.full_name || !form.email || !form.phone) {
      setError("Please fill in your name, email, and phone number.");
      return;
    }
    setStatus("loading");
    setError("");
    try {
      const lead = await base44.entities.Lead.create({
        ...form,
        interest: form.program_of_interest + " Program",
        status: "new",
        pipeline_stage: "new_lead",
        lead_source: "Website",
      });
      navigate(`/trial-booking?lead=${lead.id}`);
    } catch (err) {
      setError("Something went wrong. Please try again or call us at (555) 123-4567.");
      setStatus("error");
    }
  };

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
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button onClick={handleSubmit} disabled={status === "loading"} className="w-full bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase py-4 hover:bg-[#E0C97A] transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
          {status === "loading" ? <><Loader2 size={18} className="animate-spin" /> Processing...</> : <>Claim Your Free Trial <ChevronRight size={18} /></>}
        </button>
        <button onClick={() => setStep(2)} className="w-full flex items-center justify-center gap-2 text-xs text-[#A8A9AD] hover:text-white">
          <ArrowLeft size={14} /> Back
        </button>
      </div>
    </div>
  );
}