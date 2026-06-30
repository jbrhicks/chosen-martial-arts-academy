import ScrollReveal from "@/components/ScrollReveal";
import { Shield, Heart, Zap } from "lucide-react";

const PILLARS = [
{
  icon: Shield,
  title: "Discipline",
  description: "Master the fundamentals through structured training that builds mental fortitude and self-control — on and off the mat."
},
{
  icon: Heart,
  title: "Respect",
  description: "Honor your instructors, your peers, and yourself. The dojo is a community where every student supports each other's growth."
},
{
  icon: Zap,
  title: "Perseverance",
  description: "Push past your limits. Every belt earned represents not just skill, but the determination to keep going when it gets hard."
}];


export default function MissionSection() {
  return (
    <section className="py-24 bg-[#0A0A0A]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <ScrollReveal className="text-center max-w-3xl mx-auto mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-8 bg-[#C9A84C]" />
            <span className="text-xs tracking-[0.3em] uppercase text-[#C9A84C] font-medium">Our Philosophy</span>
            <div className="h-px w-8 bg-[#C9A84C]" />
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold leading-tight mb-6">
            The Chosen Path
          </h2>
          <p className="text-lg text-[#A8A9AD] leading-relaxed">At Chosen Martial Arts Academy, we empower students to forge unbreakable character through leadership, honor, and steadfast self-discipline. We equip you with sharp situational awareness to confidently avoid threats, alongside the physical mastery to defend yourself and the courage to protect others when it matters most. Beyond the mat, we cultivate a powerful, supportive community where students build lifelong friendships and grow stronger together.

          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#A8A9AD]/20">
          {PILLARS.map((pillar, i) => {
            const Icon = pillar.icon;
            return (
              <ScrollReveal key={pillar.title} delay={i * 150} className="bg-[#0A0A0A] p-10 hover:bg-black transition-colors">
                <div className="w-14 h-14 border-2 border-[#C9A84C] flex items-center justify-center mb-6 group hover:bg-[#C9A84C] transition-colors">
                  <Icon size={24} className="text-[#C9A84C] group-hover:text-black transition-colors" />
                </div>
                <h3 className="text-xl font-bold mb-3 tracking-wide">{pillar.title}</h3>
                <p className="text-[#A8A9AD] leading-relaxed text-sm">{pillar.description}</p>
              </ScrollReveal>);

          })}
        </div>
      </div>
    </section>);

}