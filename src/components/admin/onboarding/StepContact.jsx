import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Field } from "./WizardField";
import { Plus, Trash2, User, Home } from "lucide-react";

export default function StepContact({ members, updateMember, addMember, removeMember, household, updateHousehold }) {
  const [customFields, setCustomFields] = useState([]);

  useEffect(() => {
    base44.entities.CustomField.list().then(data => {
      data.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
      setCustomFields(data.filter(f => f.is_active !== false));
    }).catch(() => {});
  }, []);

  const updateCustomField = (index, fieldId, value) => {
    const current = members[index].customFields || {};
    updateMember(index, "customFields", { ...current, [fieldId]: value });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1">Primary Account & Contact Info</h2>
        <p className="text-sm text-[#A8A9AD]">Enter the student's personal details. Add additional family members to link them under one billing account.</p>
      </div>

      <div className="border border-[#A8A9AD]/20 bg-black p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Home size={16} className="text-[#C9A84C]" />
            <h3 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C]">Split Household</h3>
          </div>
          <button onClick={() => updateHousehold("splitEnabled", !household.splitEnabled)} className={`w-12 h-6 rounded-full transition-colors ${household.splitEnabled ? "bg-[#C9A84C]" : "bg-[#A8A9AD]/30"}`}>
            <div className={`w-5 h-5 bg-white rounded-full transition-transform mx-0.5 ${household.splitEnabled ? "translate-x-6" : "translate-x-0"}`} />
          </button>
        </div>
        {household.splitEnabled && (
          <div className="space-y-4">
            <p className="text-xs text-[#A8A9AD]">For divorced/separated parents or shared custody. Enables a secondary address, emergency contact, and split billing options at checkout.</p>
            <Field label="Secondary Household Address" value={household.secondaryAddress} onChange={(v) => updateHousehold("secondaryAddress", v)} placeholder="456 Oak Ave, City, ST 12345" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Secondary Contact Name" value={household.secondaryContactName} onChange={(v) => updateHousehold("secondaryContactName", v)} placeholder="Jane Doe" />
              <Field label="Secondary Contact Phone" type="tel" value={household.secondaryContactPhone} onChange={(v) => updateHousehold("secondaryContactPhone", v)} placeholder="(555) 123-4567" />
            </div>
            <div>
              <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Custody Notes</label>
              <textarea value={household.custodyNotes} onChange={(e) => updateHousehold("custodyNotes", e.target.value)} rows={2} placeholder="e.g., Alternating weeks, primary with mother..." className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none resize-none" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Send academy communications to both households equally</span>
              <button onClick={() => updateHousehold("sendToBothHouseholds", !household.sendToBothHouseholds)} className={`w-12 h-6 rounded-full transition-colors ${household.sendToBothHouseholds ? "bg-[#C9A84C]" : "bg-[#A8A9AD]/30"}`}>
                <div className={`w-5 h-5 bg-white rounded-full transition-transform mx-0.5 ${household.sendToBothHouseholds ? "translate-x-6" : "translate-x-0"}`} />
              </button>
            </div>
          </div>
        )}
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

          {customFields.length > 0 && (
            <div className="mt-4 pt-4 border-t border-[#A8A9AD]/20">
              <p className="text-xs tracking-widest uppercase text-[#A8A9AD] mb-3">Additional Information</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {customFields.map(cf => {
                  const value = member.customFields?.[cf.id] || "";
                  if (cf.field_type === "checkbox") {
                    return (
                      <div key={cf.id} className="flex items-center gap-3">
                        <input type="checkbox" id={`cf-${index}-${cf.id}`} checked={value === "true"} onChange={(e) => updateCustomField(index, cf.id, e.target.checked ? "true" : "false")} className="w-4 h-4 accent-[#C9A84C]" />
                        <label htmlFor={`cf-${index}-${cf.id}`} className="text-sm">{cf.field_label}{cf.is_required ? " *" : ""}</label>
                      </div>
                    );
                  }
                  if (cf.field_type === "dropdown") {
                    const options = (cf.dropdown_options || "").split(",").map(o => o.trim()).filter(Boolean);
                    return (
                      <div key={cf.id}>
                        <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">{cf.field_label}{cf.is_required ? " *" : ""}</label>
                        <select value={value} onChange={(e) => updateCustomField(index, cf.id, e.target.value)} className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none">
                          <option value="">Select...</option>
                          {options.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                    );
                  }
                  return (
                    <Field key={cf.id} label={`${cf.field_label}${cf.is_required ? " *" : ""}`} value={value} onChange={(v) => updateCustomField(index, cf.id, v)} placeholder={cf.field_label} />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ))}

      <button onClick={addMember} className="flex items-center gap-2 px-5 py-3 border-2 border-dashed border-[#C9A84C]/40 text-[#C9A84C] font-bold text-sm tracking-wide uppercase hover:bg-[#C9A84C]/10 transition-colors w-full justify-center">
        <Plus size={18} /> Add Another Family Member
      </button>
    </div>
  );
}