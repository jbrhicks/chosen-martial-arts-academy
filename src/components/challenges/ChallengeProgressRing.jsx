export default function ChallengeProgressRing({ progress = 0, size = 120, label, sublabel }) {
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, progress) / 100) * circumference;
  const isComplete = progress >= 100;
  const ringColor = isComplete ? "#22c55e" : "#C9A84C";

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="rgba(168,169,173,0.15)" strokeWidth={stroke}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={ringColor} strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold" style={{ color: ringColor }}>{progress}%</span>
        {label && <span className="text-[9px] tracking-widest uppercase text-[#A8A9AD] mt-0.5">{label}</span>}
        {sublabel && <span className="text-[10px] text-[#A8A9AD]">{sublabel}</span>}
      </div>
    </div>
  );
}