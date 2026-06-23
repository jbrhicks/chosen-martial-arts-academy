import { useEffect } from "react";
import { CheckCircle } from "lucide-react";

export default function CheckInSuccess({ name, onDismiss }) {
  useEffect(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const now = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.frequency.value = 880;
      osc1.type = "sine";
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc1.start(now);
      osc1.stop(now + 0.15);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.frequency.value = 1320;
      osc2.type = "sine";
      gain2.gain.setValueAtTime(0.3, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.4);
    } catch (e) { console.error("Audio failed", e); }

    const timer = setTimeout(() => onDismiss?.(), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 bg-[#0A0A0A] flex items-center justify-center z-50">
      <div className="text-center px-6">
        <div className="w-24 h-24 mx-auto mb-8 border-4 border-green-400 flex items-center justify-center animate-pulse">
          <CheckCircle size={48} className="text-green-400" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Welcome!</h1>
        <p className="text-2xl text-[#C9A84C]">{name}</p>
        <p className="text-lg text-[#A8A9AD] mt-2">You're checked in. Train hard!</p>
      </div>
    </div>
  );
}