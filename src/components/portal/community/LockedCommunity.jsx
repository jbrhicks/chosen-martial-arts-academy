import { Lock, Trophy, Users, MessageCircle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function LockedCommunity() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-2xl mx-auto">
      <div className="w-20 h-20 border-2 border-[#A8A9AD] flex items-center justify-center mb-6">
        <Lock size={36} className="text-[#A8A9AD]" />
      </div>
      <p className="text-xs tracking-widest uppercase text-[#A8A9AD] mb-3">Members Only</p>
      <h2 className="text-2xl font-bold mb-4">Unlock the Private Academy Network</h2>
      <p className="text-[#A8A9AD] text-sm mb-8">
        Join Chosen Martial Arts Academy to unlock exclusive training challenges, peer support, and direct instructor messaging!
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mb-8">
        <div className="border border-[#A8A9AD]/20 p-4">
          <Trophy className="text-[#C9A84C] mx-auto mb-2" size={20} />
          <p className="text-xs text-[#A8A9AD]">Training Challenges</p>
        </div>
        <div className="border border-[#A8A9AD]/20 p-4">
          <Users className="text-[#C9A84C] mx-auto mb-2" size={20} />
          <p className="text-xs text-[#A8A9AD]">Peer Community</p>
        </div>
        <div className="border border-[#A8A9AD]/20 p-4">
          <MessageCircle className="text-[#C9A84C] mx-auto mb-2" size={20} />
          <p className="text-xs text-[#A8A9AD]">Instructor Messaging</p>
        </div>
      </div>
      <Link to="/" className="inline-flex items-center gap-2 px-8 py-3 bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase hover:bg-[#E0C97A] transition-colors">
        Start Your Trial <ArrowRight size={16} />
      </Link>
    </div>
  );
}