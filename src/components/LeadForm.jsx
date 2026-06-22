import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Send, CheckCircle, Loader2 } from "lucide-react";

export default function LeadForm() {
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", interest: "Just Curious", message: "" });
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.full_name || !form.email || !form.phone) {
      setError("Please fill in your name, email, and phone number.");
      return;
    }
    setStatus("loading");
    setError("");
    try {
      await base44.entities.Lead.create({
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
        interest: form.interest,
        message: form.message,
        status: "new",
      });

      // Send welcome email
      try {
        await base44.integrations.Core.SendEmail({
          to: form.email,
          subject: "Welcome to Chosen Martial Arts Academy — Your Free Trial Awaits",
          body: `Hello ${form.full_name},\n\nThank you for your interest in Chosen Martial Arts Academy! We're excited to welcome you to our dojo.\n\nYour free trial pass is ready. Visit us at any scheduled class and mention your name at the front desk — no payment required for your first two weeks.\n\nWhat to bring:\n- Comfortable workout clothes\n- A water bottle\n- A positive attitude!\n\nIf you have any questions, call us at (555) 123-4567 or reply to this email.\n\nWe look forward to training with you.\n\n— The Chosen Martial Arts Academy Team\nDiscipline • Respect • Perseverance`,
        });
      } catch (emailErr) {
        console.error("Welcome email failed:", emailErr);
      }

      setStatus("success");
    } catch (err) {
      console.error("Lead creation failed:", err);
      setError("Something went wrong. Please try again or call us at (555) 123-4567.");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="text-center py-12 px-6">
        <div className="w-16 h-16 mx-auto mb-6 border-2 border-[#C9A84C] flex items-center justify-center">
          <CheckCircle size={32} className="text-[#C9A84C]" />
        </div>
        <h3 className="text-2xl font-bold mb-3 tracking-wide">You're In!</h3>
        <p className="text-[#A8A9AD] max-w-md mx-auto leading-relaxed">
          Check your email for your free trial pass and academy information. We can't wait to see you on the mat.
        </p>
        <button
          onClick={() => { setStatus("idle"); setForm({ full_name: "", email: "", phone: "", interest: "Just Curious", message: "" }); }}
          className="mt-8 text-sm text-[#C9A84C] hover:text-[#E0C97A] tracking-wide uppercase font-medium"
        >
          Submit Another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2 font-medium">Full Name *</label>
          <input
            type="text"
            name="full_name"
            value={form.full_name}
            onChange={handleChange}
            className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-3 text-white text-sm focus:border-[#C9A84C] focus:outline-none transition-colors"
            placeholder="John Doe"
          />
        </div>
        <div>
          <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2 font-medium">Phone *</label>
          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-3 text-white text-sm focus:border-[#C9A84C] focus:outline-none transition-colors"
            placeholder="(555) 123-4567"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2 font-medium">Email *</label>
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-3 text-white text-sm focus:border-[#C9A84C] focus:outline-none transition-colors"
          placeholder="john@example.com"
        />
      </div>
      <div>
        <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2 font-medium">I'm Interested In</label>
        <select
          name="interest"
          value={form.interest}
          onChange={handleChange}
          className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-3 text-white text-sm focus:border-[#C9A84C] focus:outline-none transition-colors"
        >
          <option value="Kids Program">Kids Program</option>
          <option value="Adult Program">Adult Program</option>
          <option value="Family Program">Family Program</option>
          <option value="Private Lessons">Private Lessons</option>
          <option value="Just Curious">Just Curious</option>
        </select>
      </div>
      <div>
        <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2 font-medium">Message (Optional)</label>
        <textarea
          name="message"
          value={form.message}
          onChange={handleChange}
          rows={3}
          className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-3 text-white text-sm focus:border-[#C9A84C] focus:outline-none transition-colors resize-none"
          placeholder="Tell us about your goals or any questions..."
        />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase py-4 hover:bg-[#E0C97A] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {status === "loading" ? (
          <><Loader2 size={18} className="animate-spin" /> Processing...</>
        ) : (
          <>Claim Your Free Trial <Send size={16} /></>
        )}
      </button>
    </form>
  );
}