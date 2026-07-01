import { useEffect, useState } from "react";
import PublicLayout from "@/components/PublicLayout";
import { base44 } from "@/api/base44Client";
import ScrollReveal from "@/components/ScrollReveal";
import { MapPin, Phone, Mail, Clock, Loader2 } from "lucide-react";
import LeadSection from "@/components/home/LeadSection";

export default function About() {
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Instructor.list()
      .then((data) => {
        setInstructors(data.sort((a, b) => (a.display_order || 0) - (b.display_order || 0)));
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
              <span className="text-xs tracking-[0.3em] uppercase text-[#C9A84C] font-medium">Our Story</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">About The Academy</h1>
            <p className="text-lg text-[#A8A9AD] max-w-3xl leading-relaxed">
              Founded in 2008, Chosen Martial Arts Academy has grown from a single-mat dojo into a thriving community of 150+ dedicated students. Our mission is simple: to use the discipline of karate as a vehicle for personal growth, character development, and lifelong community.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Mission statement */}
      <section className="py-20 bg-[#0A0A0A]">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <ScrollReveal>
            <p className="text-2xl sm:text-3xl font-medium leading-relaxed text-white mb-8">
              "We don't just teach karate. We build <span className="text-[#C9A84C]">confident, disciplined, respectful</span> individuals who carry the spirit of the dojo into every aspect of their lives."
            </p>
            <p className="text-sm tracking-widest uppercase text-[#A8A9AD]">— Master Instructor, Chosen Martial Arts Academy</p>
          </ScrollReveal>
        </div>
      </section>

      {/* Instructors */}
      <section className="py-20 bg-black border-t border-[#A8A9AD]/20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <ScrollReveal className="text-center mb-16">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px w-8 bg-[#C9A84C]" />
              <span className="text-xs tracking-[0.3em] uppercase text-[#C9A84C] font-medium">Meet The Team</span>
              <div className="h-px w-8 bg-[#C9A84C]" />
            </div>
            <h2 className="text-4xl font-bold">Our Instructors</h2>
          </ScrollReveal>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 size={28} className="animate-spin text-[#C9A84C]" /></div>
          ) : instructors.length === 0 ? (
            <p className="text-center text-[#A8A9AD]">Instructor bios coming soon.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {instructors.map((inst, i) => (
                <ScrollReveal key={inst.id} delay={i * 100} className="border border-[#A8A9AD]/20 p-8 hover:border-[#C9A84C]/40 transition-colors">
                  <div className="w-20 h-20 mb-6 overflow-hidden border-2 border-[#C9A84C]/30">
                    {inst.image_url ? (
                      <img src={inst.image_url} alt={inst.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-[#C9A84C]/10 flex items-center justify-center">
                        <span className="text-2xl font-bold text-[#C9A84C]">{inst.name?.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                  <h3 className="text-xl font-bold mb-1">{inst.name}</h3>
                  <p className="text-sm text-[#C9A84C] tracking-wide uppercase mb-1">{inst.title}</p>
                  {inst.belt_rank && <p className="text-xs text-[#A8A9AD] mb-4">{inst.belt_rank}</p>}
                  <p className="text-sm text-[#A8A9AD] leading-relaxed mb-4">{inst.bio}</p>
                  {inst.specialties && (
                    <p className="text-xs text-[#A8A9AD] border-t border-[#A8A9AD]/20 pt-4">
                      <span className="text-[#C9A84C]">Specialties: </span>{inst.specialties}
                    </p>
                  )}
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Contact info */}
      <section className="py-20 bg-[#0A0A0A] border-t border-[#A8A9AD]/20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <ScrollReveal className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px w-8 bg-[#C9A84C]" />
              <span className="text-xs tracking-[0.3em] uppercase text-[#C9A84C] font-medium">Get In Touch</span>
              <div className="h-px w-8 bg-[#C9A84C]" />
            </div>
            <h2 className="text-4xl font-bold">Visit The Dojo</h2>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#A8A9AD]/20 max-w-4xl mx-auto">
            {[
              { icon: MapPin, label: "Location", value: "1234 Martial Arts Way\nSpringfield, ST 12345" },
              { icon: Phone, label: "Phone", value: "(555) 123-4567" },
              { icon: Mail, label: "Email", value: "info@chosenmartialarts.com" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <ScrollReveal key={item.label} className="bg-[#0A0A0A] p-8 text-center">
                  <div className="w-12 h-12 border-2 border-[#C9A84C] flex items-center justify-center mx-auto mb-4">
                    <Icon size={20} className="text-[#C9A84C]" />
                  </div>
                  <h3 className="text-xs tracking-widest uppercase text-[#C9A84C] mb-2">{item.label}</h3>
                  <p className="text-sm text-white whitespace-pre-line">{item.value}</p>
                </ScrollReveal>
              );
            })}
          </div>

          <ScrollReveal className="text-center mt-8">
            <div className="inline-flex items-center gap-2 text-sm text-[#A8A9AD]">
              <Clock size={16} className="text-[#C9A84C]" />
              Mon – Fri: 4PM – 9PM · Sat: 9AM – 2PM · Sun: Closed
            </div>
          </ScrollReveal>
        </div>
      </section>

      <LeadSection />
    </PublicLayout>
  );
}