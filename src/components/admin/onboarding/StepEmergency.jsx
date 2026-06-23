import { Field } from "./WizardField";
import { Heart } from "lucide-react";

export default function StepEmergency({ members, updateMember, updateEmergencyContact }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1">Emergency & Health Information</h2>
        <p className="text-sm text-[#A8A9AD]">Provide emergency contact details and health information for each student.</p>
      </div>

      {members.map((member, index) => (
        <div key={index} className="border border-[#A8A9AD]/20 bg-black p-6">
          <div className="flex items-center gap-2 mb-4">
            <Heart size={16} className="text-[#C9A84C]" />
            <h3 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C]">
              {member.firstName ? `${member.firstName} ${member.lastName}` : `Member ${index + 1}`}
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <Field label="Emergency Contact Name *" value={member.emergencyContact.name} onChange={(v) => updateEmergencyContact(index, "name", v)} placeholder="Jane Doe" />
            <Field label="Relationship" value={member.emergencyContact.relationship} onChange={(v) => updateEmergencyContact(index, "relationship", v)} placeholder="Mother" />
            <Field label="Emergency Phone *" type="tel" value={member.emergencyContact.phone} onChange={(v) => updateEmergencyContact(index, "phone", v)} placeholder="(555) 123-4567" />
            <Field label="Alt Phone" type="tel" value={member.emergencyContact.altPhone} onChange={(v) => updateEmergencyContact(index, "altPhone", v)} placeholder="(555) 987-6543" />
          </div>
          <div>
            <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Medical Conditions / Allergies / Limitations</label>
            <textarea
              value={member.medicalConditions}
              onChange={(e) => updateMember(index, "medicalConditions", e.target.value)}
              rows={3}
              placeholder="List any medical conditions, allergies, or physical limitations instructors should know about..."
              className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none resize-none"
            />
          </div>
        </div>
      ))}
    </div>
  );
}