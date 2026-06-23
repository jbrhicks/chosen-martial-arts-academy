import { CheckCircle, Mail, Users, CreditCard } from "lucide-react";

export default function StepConfirmation({ confirmation, onReset }) {
  const { familyGroup, members, totalDue } = confirmation;

  return (
    <div className="max-w-2xl mx-auto text-center space-y-6 py-8">
      <div className="w-20 h-20 mx-auto border-4 border-green-400 flex items-center justify-center">
        <CheckCircle size={40} className="text-green-400" />
      </div>
      <div>
        <h2 className="text-2xl font-bold">Onboarding Complete!</h2>
        <p className="text-[#A8A9AD] mt-2">{members.length} student{members.length > 1 ? "s" : ""} successfully enrolled.</p>
      </div>
      <div className="border border-[#A8A9AD]/20 bg-black p-6 text-left space-y-4">
        <div className="flex items-center gap-3">
          <Users size={18} className="text-[#C9A84C]" />
          <div>
            <p className="text-xs tracking-widest uppercase text-[#A8A9AD]">Family Group</p>
            <p className="text-sm font-medium">{familyGroup?.family_name}</p>
          </div>
        </div>
        <div className="border-t border-[#A8A9AD]/20 pt-4 space-y-2">
          {members.map((m, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-sm">{m.firstName} {m.lastName}</span>
              <span className="text-xs text-[#A8A9AD]">{m.programs.join(", ") || "No programs"}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-[#A8A9AD]/20 pt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard size={16} className="text-[#C9A84C]" />
            <span className="text-sm">Total Charged</span>
          </div>
          <span className="text-lg font-bold text-[#C9A84C]">${totalDue.toFixed(2)}</span>
        </div>
        <div className="border-t border-[#A8A9AD]/20 pt-4 flex items-center gap-2">
          <Mail size={16} className="text-green-400" />
          <p className="text-sm text-[#A8A9AD]">Welcome emails sent to all new students with login instructions.</p>
        </div>
      </div>
      <button onClick={onReset} className="px-6 py-3 border border-[#C9A84C]/40 text-[#C9A84C] font-bold text-sm tracking-widest uppercase hover:bg-[#C9A84C]/10 transition-colors">
        Onboard Another Student
      </button>
    </div>
  );
}