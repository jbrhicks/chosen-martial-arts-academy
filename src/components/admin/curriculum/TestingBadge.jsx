import { CheckCircle, Clock, AlertCircle, XCircle } from "lucide-react";

export default function TestingBadge({ criteriaCount, masteredCount, minClasses, actualClasses, minTime, actualTime }) {
  const criteriaMet = criteriaCount > 0 && masteredCount >= criteriaCount;
  const classesMet = actualClasses >= minClasses;
  const timeMet = actualTime >= minTime;
  const ready = criteriaMet && classesMet && timeMet;

  const requirements = [
    { label: "Criteria Mastered", met: criteriaMet, detail: `${masteredCount}/${criteriaCount}` },
    { label: "Minimum Classes", met: classesMet, detail: `${actualClasses}/${minClasses}` },
    { label: "Time in Grade", met: timeMet, detail: `${actualTime}/${minTime} wks` },
  ];

  if (ready) {
    return (
      <div className="border-2 border-[#C9A84C] bg-[#C9A84C]/10 p-5 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <CheckCircle size={24} className="text-[#C9A84C]" />
          <span className="text-lg font-bold text-[#C9A84C] tracking-widest uppercase">Ready to Test</span>
        </div>
        <p className="text-sm text-[#A8A9AD]">All requirements met. This student is eligible for belt promotion.</p>
      </div>
    );
  }

  return (
    <div className="border border-[#A8A9AD]/20 bg-black p-5">
      <div className="flex items-center gap-2 mb-4">
        <Clock size={16} className="text-[#A8A9AD]" />
        <h3 className="text-sm font-bold tracking-widest uppercase text-[#A8A9AD]">Testing Readiness</h3>
      </div>
      <div className="space-y-3">
        {requirements.map((req) => (
          <div key={req.label} className="flex items-center gap-3">
            {req.met ? <CheckCircle size={16} className="text-green-400 shrink-0" /> : <XCircle size={16} className="text-red-400 shrink-0" />}
            <span className="text-sm flex-1">{req.label}</span>
            <span className={`text-sm font-medium ${req.met ? "text-green-400" : "text-red-400"}`}>{req.detail}</span>
          </div>
        ))}
      </div>
    </div>
  );
}