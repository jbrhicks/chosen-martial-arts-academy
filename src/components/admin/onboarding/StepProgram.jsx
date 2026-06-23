import { Field, SelectField } from "./WizardField";
import { Dumbbell } from "lucide-react";

const PROGRAMS = ["Tang Soo Do", "Jiu Jitsu", "Tai Chi"];
const UNIFORM_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
const BELT_SIZES = ["000", "00", "0", "1", "2", "3", "4", "5", "6", "7", "8"];

export default function StepProgram({ members, updateMember, toggleProgram }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1">Program Selection & Gear Setup</h2>
        <p className="text-sm text-[#A8A9AD]">Assign programs and select gear sizes for each student.</p>
      </div>

      {members.map((member, index) => (
        <div key={index} className="border border-[#A8A9AD]/20 bg-black p-6">
          <div className="flex items-center gap-2 mb-4">
            <Dumbbell size={16} className="text-[#C9A84C]" />
            <h3 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C]">
              {member.firstName ? `${member.firstName} ${member.lastName}` : `Member ${index + 1}`}
            </h3>
          </div>
          <div className="mb-4">
            <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Programs *</label>
            <div className="flex gap-3 flex-wrap">
              {PROGRAMS.map((program) => (
                <button
                  key={program}
                  onClick={() => toggleProgram(index, program)}
                  className={`px-4 py-2.5 text-sm font-medium border-2 transition-colors ${
                    member.programs.includes(program)
                      ? "border-[#C9A84C] bg-[#C9A84C]/10 text-[#C9A84C]"
                      : "border-[#A8A9AD]/20 text-[#A8A9AD] hover:border-[#A8A9AD]/40"
                  }`}
                >
                  {program}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SelectField label="Uniform Size" value={member.uniformSize} onChange={(v) => updateMember(index, "uniformSize", v)} options={UNIFORM_SIZES} />
            <SelectField label="Belt Size" value={member.beltSize} onChange={(v) => updateMember(index, "beltSize", v)} options={BELT_SIZES} />
            <Field label="Start Date *" type="date" value={member.startDate} onChange={(v) => updateMember(index, "startDate", v)} />
          </div>
        </div>
      ))}
    </div>
  );
}