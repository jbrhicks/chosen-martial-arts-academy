import { Field } from "./WizardField";
import { Plus, Trash2, User } from "lucide-react";

export default function StepContact({ members, updateMember, addMember, removeMember }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1">Primary Account & Contact Info</h2>
        <p className="text-sm text-[#A8A9AD]">Enter the student's personal details. Add additional family members to link them under one billing account.</p>
      </div>

      {members.map((member, index) => (
        <div key={index} className="border border-[#A8A9AD]/20 bg-black p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <User size={16} className="text-[#C9A84C]" />
              <h3 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C]">
                {index === 0 ? "Primary Student" : `Family Member ${index + 1}`}
              </h3>
            </div>
            {index > 0 && (
              <button onClick={() => removeMember(index)} className="text-[#A8A9AD] hover:text-red-400 transition-colors">
                <Trash2 size={16} />
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="First Name *" value={member.firstName} onChange={(v) => updateMember(index, "firstName", v)} placeholder="John" />
            <Field label="Last Name *" value={member.lastName} onChange={(v) => updateMember(index, "lastName", v)} placeholder="Doe" />
            <Field label="Date of Birth" type="date" value={member.dob} onChange={(v) => updateMember(index, "dob", v)} />
            <Field label="Email *" type="email" value={member.email} onChange={(v) => updateMember(index, "email", v)} placeholder="john@email.com" />
            <Field label="Phone" type="tel" value={member.phone} onChange={(v) => updateMember(index, "phone", v)} placeholder="(555) 123-4567" />
            <Field label="Mailing Address" value={member.address} onChange={(v) => updateMember(index, "address", v)} placeholder="123 Main St, City, ST 12345" />
          </div>
        </div>
      ))}

      <button onClick={addMember} className="flex items-center gap-2 px-5 py-3 border-2 border-dashed border-[#C9A84C]/40 text-[#C9A84C] font-bold text-sm tracking-wide uppercase hover:bg-[#C9A84C]/10 transition-colors w-full justify-center">
        <Plus size={18} /> Add Another Family Member
      </button>
    </div>
  );
}