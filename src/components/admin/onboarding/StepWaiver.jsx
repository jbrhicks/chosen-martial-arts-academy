import SignaturePad from "./SignaturePad";
import { FileText, CheckCircle } from "lucide-react";

export default function StepWaiver({ waiverSigned, setWaiverSigned }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1">Digital Waivers</h2>
        <p className="text-sm text-[#A8A9AD]">Hand the tablet to the customer to review and sign the academy's liability waiver and photo release form.</p>
      </div>

      <div className="border border-[#A8A9AD]/20 bg-black p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText size={18} className="text-[#C9A84C]" />
          <h3 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C]">Liability Waiver & Photo Release</h3>
        </div>
        <div className="text-sm text-[#A8A9AD] space-y-3 max-h-48 overflow-y-auto mb-6 pr-2">
          <p>I, the undersigned, hereby release Chosen Martial Arts Academy, its instructors, staff, and affiliates from any and all liability for injuries, damages, or losses sustained during training, classes, or related activities.</p>
          <p>I acknowledge that martial arts training involves inherent risks and I participate voluntarily. I confirm I am in good physical condition and have disclosed all relevant medical conditions.</p>
          <p>I grant permission to Chosen Martial Arts Academy to use photographs and video recordings of me for promotional, educational, and marketing purposes without compensation.</p>
          <p>I understand that membership dues are non-refundable and that monthly auto-pay will continue until cancelled in writing.</p>
        </div>
        <p className="text-xs text-[#A8A9AD] mb-3">Sign below:</p>
        <SignaturePad onSign={setWaiverSigned} />
        {waiverSigned && (
          <p className="text-sm text-green-400 mt-3 flex items-center gap-1">
            <CheckCircle size={14} /> Waiver signed successfully.
          </p>
        )}
      </div>
    </div>
  );
}