import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Star, Quote, ChevronRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ScrollReveal from "@/components/ScrollReveal";

export default function TestimonialsPreview() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Testimonial.list()
      .then((data) => {
        setTestimonials(data.slice(0, 3));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <section className="py-24 bg-[#0A0A0A]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <ScrollReveal className="text-center max-w-3xl mx-auto mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-8 bg-[#C9A84C]" />
            <span className="text-xs tracking-[0.3em] uppercase text-[#C9A84C] font-medium">Student Voices</span>
            <div className="h-px w-8 bg-[#C9A84C]" />
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold leading-tight">Stories From The Dojo</h2>
        </ScrollReveal>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => <div key={i} className="h-64 bg-white/5 animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <ScrollReveal key={t.id} delay={i * 150} className="border border-[#A8A9AD]/20 p-8 hover:border-[#C9A84C]/40 transition-colors flex flex-col">
                <Quote size={32} className="text-[#C9A84C] mb-4" />
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={14} className={s <= (t.rating || 5) ? "fill-[#C9A84C] text-[#C9A84C]" : "text-[#A8A9AD]/30"} />
                  ))}
                </div>
                <p className="text-[#A8A9AD] leading-relaxed text-sm flex-1">"{t.content}"</p>
                <div className="mt-6 pt-6 border-t border-[#A8A9AD]/20">
                  <p className="font-bold text-sm">{t.author_name}</p>
                  {t.author_role && <p className="text-xs text-[#C9A84C] tracking-wide uppercase mt-1">{t.author_role}</p>}
                </div>
              </ScrollReveal>
            ))}
          </div>
        )}

        <ScrollReveal className="text-center mt-12">
          <Link to="/testimonials" className="group inline-flex items-center gap-2 text-sm tracking-widest uppercase text-[#C9A84C] hover:text-[#E0C97A] transition-colors">
            Read More Stories
            <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </ScrollReveal>
      </div>
    </section>
  );
}