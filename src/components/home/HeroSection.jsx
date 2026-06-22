import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

const HERO_IMG = "https://media.base44.com/images/public/6a395a5a04e2d6cac8d5ae37/5b9937def_generated_image.png";

export default function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img src={HERO_IMG} alt="Karate dojo" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 w-full">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px w-12 bg-[#C9A84C]" />
            <span className="text-xs tracking-[0.3em] uppercase text-[#C9A84C] font-medium">Est. 2008</span>
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[0.95] tracking-tight mb-6">
            Train With<br />
            <span className="text-[#C9A84C]">Purpose.</span><br />
            Live With Honor.
          </h1>
          <p className="text-lg text-[#A8A9AD] leading-relaxed mb-8 max-w-lg">
            More than martial arts — a discipline that shapes character, builds confidence, and forages lifelong community. Join 150+ students on the path to mastery.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="#lead-form"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase hover:bg-[#E0C97A] transition-all"
            >
              Claim Your Free Trial
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </a>
            <Link
              to="/schedule"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-[#A8A9AD]/40 text-white font-bold text-sm tracking-widest uppercase hover:border-[#C9A84C] hover:text-[#C9A84C] transition-all"
            >
              View Class Schedule
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom stats bar */}
      <div className="absolute bottom-0 left-0 right-0 z-10 border-t border-[#A8A9AD]/20 bg-black/60 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-3 divide-x divide-[#A8A9AD]/20">
          {[
            { value: "150+", label: "Active Students" },
            { value: "15", label: "Belt Ranks" },
            { value: "18", label: "Years of Excellence" },
          ].map((stat) => (
            <div key={stat.label} className="py-6 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-[#C9A84C]">{stat.value}</div>
              <div className="text-[10px] sm:text-xs tracking-widest uppercase text-[#A8A9AD] mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}