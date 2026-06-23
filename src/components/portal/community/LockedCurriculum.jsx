import { Lock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function LockedCurriculum() {
  return (
    <div className="relative flex flex-col items-center justify-center py-20 px-4 text-center min-h-[60vh] overflow-hidden">
      {/* Blurred training background */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1518655048521-f130df041f66?w=1200&q=80"
          alt=""
          className="w-full h-full object-cover blur-2xl scale-110 opacity-40"
        />
        <div className="absolute inset-0 bg-black/70" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-2xl">
        <div className="w-20 h-20 border-2 border-[#A8A9AD] flex items-center justify-center mb-6 mx-auto">
          <Lock size={36} className="text-[#A8A9AD]" />
        </div>
        <p className="text-xs tracking-widest uppercase text-[#A8A9AD] mb-3">Proprietary Content</p>
        <h2 className="text-2xl font-bold mb-4">Unlock Your Potential</h2>
        <p className="text-[#A8A9AD] text-sm mb-8">
          Join Chosen Martial Arts Academy to get full access to our proprietary training videos and step-by-step belt curriculum.
        </p>
        <Link to="/" className="inline-flex items-center gap-2 px-8 py-3 bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase hover:bg-[#E0C97A] transition-colors">
          View Membership Options <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}