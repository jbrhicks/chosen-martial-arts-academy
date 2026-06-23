import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X, Gift, Loader2, CheckCircle } from "lucide-react";

export default function ExitIntentPopup() {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    if (sessionStorage.getItem("exitIntentShown")) return;

    const handleMouseLeave = (e) => {
      if (e.clientY <= 0) {
        sessionStorage.setItem("exitIntentShown", "true");
        setShow(true);
        document.removeEventListener("mouseleave", handleMouseLeave);
      }
    };

    document.addEventListener("mouseleave", handleMouseLeave);
    return () => document.removeEventListener("mouseleave", handleMouseLeave);
  }, []);

  const handleSubmit = async () => {
    if (!email) return;
    setStatus("loading");
    try {
      await base44.entities.Lead.create({
        full_name: "Exit Intent Lead",
        email: email,
        phone: "N/A",
        lead_source: "Exit Intent",
        status: "new",
        pipeline_stage: "new_lead",
      });
      setStatus("success");
    } catch (e) {
      setStatus("error");
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4" onClick={() => setShow(false)}>
      <div className="w-full max-w-md border border-[#C9A84C]/40 bg-[#0A0A0A] p-8 relative" onClick={e => e.stopPropagation()}>
        <button onClick={() => setShow(false)} className="absolute top-4 right-4 text-[#A8A9AD] hover:text-white"><X size={20} /></button>

        {status === "success" ? (
          <div className="text-center py-4">
            <CheckCircle size={40} className="mx-auto text-[#C9A84C] mb-4" />
            <h3 className="text-xl font-bold mb-2">You're In!</h3>
            <p className="text-sm text-[#A8A9AD]">Check your email for your free uniform offer and trial pass.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 border-2 border-[#C9A84C] flex items-center justify-center">
                <Gift size={24} className="text-[#C9A84C]" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Wait! Don't Leave Yet...</h3>
                <p className="text-xs text-[#C9A84C] tracking-wide uppercase font-medium">Free Uniform Offer</p>
              </div>
            </div>
            <p className="text-sm text-[#A8A9AD] mb-5">Get a <span className="text-white font-bold">FREE uniform</span> when you book your trial class today. Just enter your email and we'll send your offer instantly.</p>
            <div className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-3 text-sm text-white focus:border-[#C9A84C] focus:outline-none"
              />
              <button
                onClick={handleSubmit}
                disabled={status === "loading" || !email}
                className="w-full bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase py-3 hover:bg-[#E0C97A] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {status === "loading" ? <Loader2 size={16} className="animate-spin" /> : "Claim My Free Uniform"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}