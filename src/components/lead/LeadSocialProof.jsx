import { useEffect, useState } from "react";
import { Star, Quote } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function LeadSocialProof() {
  const [testimonial, setTestimonial] = useState(null);

  useEffect(() => {
    base44.entities.Testimonial.list()
      .then((data) => {
        const featured = data.find((t) => t.is_featured) || data[0];
        setTestimonial(featured || null);
      })
      .catch(() => {});
  }, []);

  if (!testimonial) return null;

  return (
    <div className="border border-[#A8A9AD]/20 bg-[#0A0A0A] p-5 mt-8">
      <Quote size={24} className="text-[#C9A84C] mb-3" />
      <div className="flex gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star key={s} size={11} className={s <= (testimonial.rating || 5) ? "fill-[#C9A84C] text-[#C9A84C]" : "text-[#A8A9AD]/30"} />
        ))}
      </div>
      <p className="text-sm text-[#A8A9AD] leading-relaxed italic mb-4">"{testimonial.content}"</p>
      <div className="flex items-center gap-3">
        {testimonial.image_url && (
          <img src={testimonial.image_url} alt={testimonial.author_name} className="w-8 h-8 rounded-full object-cover" />
        )}
        <div>
          <p className="text-xs font-bold text-white">{testimonial.author_name}</p>
          {testimonial.author_role && <p className="text-[10px] text-[#C9A84C] tracking-wide uppercase">{testimonial.author_role}</p>}
        </div>
      </div>
    </div>
  );
}