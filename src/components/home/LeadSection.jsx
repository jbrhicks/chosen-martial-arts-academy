import ScrollReveal from "@/components/ScrollReveal";
import LeadForm from "@/components/LeadForm";
import { Gift } from "lucide-react";

export default function LeadSection() {
  return (
    <section id="lead-form" className="py-24 bg-black relative overflow-hidden">
      {/* Decorative gold glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#C9A84C]/5 rounded-full blur-3xl" />

      <div className="relative max-w-5xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Left: pitch */}
          <ScrollReveal>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-8 bg-[#C9A84C]" />
              <span className="text-xs tracking-[0.3em] uppercase text-[#C9A84C] font-medium">Start Your Journey</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold leading-tight mb-6">
              Claim Your<br /><span className="text-[#C9A84C]">Free Trial</span>
            </h2>
            <p className="text-lg text-[#A8A9AD] leading-relaxed mb-8">
              One week of unlimited classes. No commitment, no cost. Experience the Chosen difference firsthand and see why our students call this dojo their second home.
            </p>

            <div className="space-y-4">
              {[
                "One full week of unlimited training",
                "All belt levels and age groups welcome",
                "No equipment needed — just show up",
                "Personal intro session with an instructor",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="w-6 h-6 border border-[#C9A84C] flex items-center justify-center shrink-0">
                    <Gift size={12} className="text-[#C9A84C]" />
                  </div>
                  <span className="text-sm text-white">{item}</span>
                </div>
              ))}
            </div>
          </ScrollReveal>

          {/* Right: form */}
          <ScrollReveal delay={200} className="border border-[#A8A9AD]/20 p-8 bg-[#0A0A0A]">
            <h3 className="text-xl font-bold mb-2 tracking-wide">Get Started Today</h3>
            <p className="text-sm text-[#A8A9AD] mb-6">Fill out the form and we'll send your trial pass instantly.</p>
            <LeadForm />
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}