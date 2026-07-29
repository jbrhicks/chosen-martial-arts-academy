import { useState } from "react";
import { useFamily } from "@/lib/FamilyContext";
import BeltBadge from "@/components/BeltBadge";
import { QrCode, X } from "lucide-react";

export default function FamilyCheckInCards() {
  const { members } = useFamily();
  const [selected, setSelected] = useState(null);
  const students = members.filter(m => m.family_role === "student");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">Quick Check-In</h2>
        <p className="text-sm text-[#A8A9AD]">Display these QR codes at the front desk kiosk for fast check-in.</p>
      </div>

      {students.length === 0 ? (
        <div className="border border-[#A8A9AD]/20 p-8 text-center">
          <p className="text-[#A8A9AD] text-sm">No student members in your family yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map(s => (
            <div key={s.id} className="border border-[#A8A9AD]/20 bg-black p-4 text-center">
              <div className="w-10 h-10 bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center text-sm font-bold text-[#C9A84C] mx-auto mb-3">
                {s.full_name?.charAt(0) || "?"}
              </div>
              <p className="text-sm font-medium mb-2">{s.full_name}</p>
              {s.belt_rank && <div className="flex justify-center mb-3"><BeltBadge rank={s.belt_rank} size="sm" /></div>}
              <button
                onClick={() => setSelected(s)}
                className="flex items-center justify-center gap-2 w-full py-2.5 border border-[#C9A84C]/30 text-[#C9A84C] text-xs tracking-widest uppercase font-bold hover:bg-[#C9A84C]/10 transition-colors"
              >
                <QrCode size={14} /> Show QR
              </button>
            </div>
          ))}
        </div>
      )}

      {selected && <QRModal student={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function QRModal({ student, onClose }) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(student.id)}&color=000000&bgcolor=FFFFFF`;
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-sm border border-[#C9A84C]/30 bg-[#0A0A0A] p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold">{student.full_name}'s ID Card</h3>
          <button onClick={onClose} className="text-[#A8A9AD] hover:text-white"><X size={18} /></button>
        </div>
        <div className="bg-white p-4 mb-4 flex justify-center">
          <img src={qrUrl} alt="Check-in QR Code" className="w-48 h-48" />
        </div>
        <div className="text-center">
          <p className="font-bold text-lg">{student.full_name}</p>
          {student.belt_rank && <div className="mt-2 flex justify-center"><BeltBadge rank={student.belt_rank} size="sm" /></div>}
        </div>
        <p className="text-xs text-[#A8A9AD]/60 text-center mt-4">Scan this code at the front desk kiosk to check in for class.</p>
      </div>
    </div>
  );
}