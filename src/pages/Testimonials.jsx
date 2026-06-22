import { useEffect, useState } from "react";
import PublicLayout from "@/components/PublicLayout";
import { base44 } from "@/api/base44Client";
import ScrollReveal from "@/components/ScrollReveal";
import { Star, Quote, Loader2 } from "lucide-react";

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Testimonial.list()
      .then((data) => {
        setTestimonials(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <PublicLayout>
      {/* Header */}
      <section className="py-20 bg-black border-b border-[#A8A9AD]/20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <ScrollReveal>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-8 bg-[#C9A84C]" />
              <span className="text-xs tracking-[0.3em] uppercase text-[#C9A84C] font-medium">Student & Parent Reviews</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-4">Testimonials</h1>
            <p className="text-lg text-[#A8A9AD] max-w-2xl">
              Don't take our word for it. Hear from the students and families who call Chosen Martial Arts Academy their dojo.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Testimonials grid */}
      <section className="py-16 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-[#C9A84C]" /></div>
          ) : testimonials.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-[#A8A9AD]">Testimonials coming soon.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.map((t, i) => (
                <ScrollReveal key={t.id} delay={(i % 3) * 100} className="border border-[#A8A9AD]/20 p-8 hover:border-[#C9A84C]/40 transition-colors flex flex-col">
                  <Quote size={28} className="text-[#C9A84C] mb-4" />
                  <div className="flex gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={14} className={s <= (t.rating || 5) ? "fill-[#C9A84C] text-[#C9A84C]" : "text-[#A8A9AD]/30"} />
                    ))}
                  </div>
                  <p className="text-[#A8A9AD] leading-relaxed text-sm flex-1">"{t.content}"</p>
                  <div className="mt-6 pt-6 border-t border-[#A8A9AD]/20 flex items-center gap-3">
                    {t.image_url ? (
                      <img src={t.image_url} alt={t.author_name} className="w-10 h-10 object-cover border border-[#C9A84C]/30" />
                    ) : (
                      <div className="w-10 h-10 bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center">
                        <span className="text-sm font-bold text-[#C9A84C]">{t.author_name?.charAt(0)}</span>
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-sm">{t.author_name}</p>
                      {t.author_role && <p className="text-xs text-[#C9A84C] tracking-wide uppercase">{t.author_role}</p>}
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}