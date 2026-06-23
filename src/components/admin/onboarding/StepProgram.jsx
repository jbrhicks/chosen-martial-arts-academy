import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dumbbell, Lock } from "lucide-react";
import { SelectField, Field } from "./WizardField";
import { BELT_RANKS, getRankIndex } from "@/lib/constants";

const UNIFORM_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
const BELT_SIZES = ["000", "00", "0", "1", "2", "3", "4", "5", "6", "7", "8"];

function calculateAge(dob) {
  if (!dob) return null;
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

export default function StepProgram({ members, updateMember, toggleProgram }) {
  const [programs, setPrograms] = useState([]);

  useEffect(() => {
    base44.entities.Program.filter({ status: "active" }).then(setPrograms).catch(() => {});
  }, []);

  const validateProgram = (program, member) => {
    const age = calculateAge(member.dob);
    if (program.age_minimum > 0 && age !== null && age < program.age_minimum) {
      return { blocked: true, reason: `Requires minimum age ${program.age_minimum}. This student is ${age}.` };
    }
    if (program.age_maximum > 0 && age !== null && age > program.age_maximum) {
      return { blocked: true, reason: `Maximum age is ${program.age_maximum}. This student is ${age}.` };
    }
    if (program.prerequisite_rank && member.beltRank) {
      if (getRankIndex(member.beltRank) < getRankIndex(program.prerequisite_rank)) {
        return { blocked: true, reason: `Requires rank of ${program.prerequisite_rank} or higher.` };
      }
    }
    if (program.prerequisite_rank && !member.beltRank) {
      return { blocked: false, warning: `Requires rank of ${program.prerequisite_rank} or higher — confirm the student's current rank.` };
    }
    return { blocked: false };
  };

  const recommendProgram = (member) => {
    const age = calculateAge(member.dob);
    if (age === null) return null;
    return programs.find(p => p.status === "active" && (p.age_minimum === 0 || age >= p.age_minimum) && (p.age_maximum === 0 || age <= p.age_maximum));
  };

  const handleToggle = (index, program) => {
    const member = members[index];
    const validation = validateProgram(program, member);
    if (validation.blocked) {
      alert(`Cannot enroll in "${program.program_name}":\n\n${validation.reason}`);
      return;
    }
    toggleProgram(index, program.program_name);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1">Program Selection & Gear Setup</h2>
        <p className="text-sm text-[#A8A9AD]">Assign programs and select gear sizes for each student. Age and rank requirements are checked automatically.</p>
      </div>

      {programs.length === 0 ? (
        <div className="border border-[#A8A9AD]/20 bg-black p-6 text-center">
          <p className="text-sm text-[#A8A9AD]">Loading available programs... If none appear, create programs first in the Programs dashboard.</p>
        </div>
      ) : (
        members.map((member, index) => {
          const age = calculateAge(member.dob);
          const recommendation = recommendProgram(member);
          return (
            <div key={index} className="border border-[#A8A9AD]/20 bg-black p-6">
              <div className="flex items-center gap-2 mb-4">
                <Dumbbell size={16} className="text-[#C9A84C]" />
                <h3 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C]">
                  {member.firstName ? `${member.firstName} ${member.lastName}` : `Member ${index + 1}`}
                </h3>
                {age !== null && <span className="text-xs text-[#A8A9AD] ml-auto">Age: {age}</span>}
              </div>

              {age !== null && recommendation && (
                <div className="mb-4 border border-[#C9A84C]/20 bg-[#C9A84C]/5 p-3 text-xs text-[#A8A9AD]">
                  Recommended program based on age: <span className="text-[#C9A84C] font-medium">{recommendation.program_name}</span>
                </div>
              )}

              <div className="mb-4">
                <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Programs *</label>
                <div className="flex gap-3 flex-wrap">
                  {programs.map((program) => {
                    const isSelected = member.programs.includes(program.program_name);
                    const validation = validateProgram(program, member);
                    return (
                      <button
                        key={program.id}
                        onClick={() => handleToggle(index, program)}
                        className={`px-4 py-2.5 text-sm font-medium border-2 transition-colors flex items-center gap-2 ${
                          isSelected
                            ? "border-[#C9A84C] bg-[#C9A84C]/10 text-[#C9A84C]"
                            : validation.blocked
                            ? "border-red-400/20 text-red-400/50 cursor-not-allowed"
                            : "border-[#A8A9AD]/20 text-[#A8A9AD] hover:border-[#A8A9AD]/40"
                        }`}
                      >
                        {validation.blocked && <Lock size={12} />}
                        {program.program_name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <SelectField label="Uniform Size" value={member.uniformSize} onChange={(v) => updateMember(index, "uniformSize", v)} options={UNIFORM_SIZES} />
                <SelectField label="Belt Size" value={member.beltSize} onChange={(v) => updateMember(index, "beltSize", v)} options={BELT_SIZES} />
                <SelectField label="Current Rank" value={member.beltRank} onChange={(v) => updateMember(index, "beltRank", v)} options={BELT_RANKS} />
                <Field label="Start Date *" type="date" value={member.startDate} onChange={(v) => updateMember(index, "startDate", v)} />
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}