import { AlertTriangle, Phone } from "lucide-react";

export default function EmergencyBanner({ contacts, medicalConditions }) {
  if ((!contacts || contacts.length === 0) && !medicalConditions) return null;

  return (
    <div className="border-2 border-red-500/50 bg-red-500/10 p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle size={18} className="text-red-500" />
        <h3 className="text-xs font-bold tracking-widest uppercase text-red-500">Emergency Information</h3>
      </div>
      {medicalConditions && (
        <div className="mb-3 p-2 bg-red-500/10 border border-red-500/30">
          <p className="text-xs font-bold text-red-400 uppercase tracking-wide mb-1">Medical Notes / Allergies</p>
          <p className="text-sm text-white">{medicalConditions}</p>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {contacts?.map((c, i) => (
          <div key={i} className="flex items-center gap-3 p-2 bg-black/30 border border-red-500/20">
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{c.contact_name}</p>
              <p className="text-xs text-[#A8A9AD]">{c.relationship || "Contact"}</p>
            </div>
            <div className="ml-auto flex items-center gap-1 text-sm text-red-400 shrink-0">
              <Phone size={14} /> {c.phone}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}