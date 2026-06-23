import { Check } from "lucide-react";

export default function StepIndicator({ currentStep, steps }) {
  return (
    <div className="mb-8">
      <div className="flex items-center">
        {steps.map((label, i) => {
          const stepNum = i + 1;
          const isComplete = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;
          return (
            <div key={label} className={`flex items-center ${i < steps.length - 1 ? "flex-1" : ""}`}>
              <div className="flex flex-col items-center gap-2 shrink-0">
                <div className={`w-9 h-9 flex items-center justify-center border-2 text-sm font-bold ${
                  isComplete ? "bg-[#C9A84C] border-[#C9A84C] text-black" :
                  isCurrent ? "border-[#C9A84C] text-[#C9A84C]" :
                  "border-[#A8A9AD]/30 text-[#A8A9AD]"
                }`}>
                  {isComplete ? <Check size={14} /> : stepNum}
                </div>
                <span className={`text-[9px] tracking-widest uppercase whitespace-nowrap ${isCurrent ? "text-[#C9A84C]" : "text-[#A8A9AD]"}`}>{label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-px mx-2 ${stepNum < currentStep ? "bg-[#C9A84C]" : "bg-[#A8A9AD]/20"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}