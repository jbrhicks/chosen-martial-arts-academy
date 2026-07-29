import { Shield } from "lucide-react";

// Shown to minor students whose guardian has not enabled Community access.
export default function LockedByParent() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-2xl mx-auto">
      <div className="w-20 h-20 border-2 border-[#C9A84C]/40 flex items-center justify-center mb-6">
        <Shield size={36} className="text-[#C9A84C]" />
      </div>
      <p className="text-xs tracking-widest uppercase text-[#A8A9AD] mb-3">Parental Controls</p>
      <h2 className="text-2xl font-bold mb-4">Community Access is Managed by Your Guardian</h2>
      <p className="text-[#A8A9AD] text-sm mb-2">
        Your parent or guardian controls access to the Community feed. Ask them to enable it
        from the <span className="text-white font-medium">Family</span> tab &rarr;{" "}
        <span className="text-white font-medium">Access Controls</span>.
      </p>
      <p className="text-[#A8A9AD] text-xs mt-4">
        You can still message the Front Desk anytime using the Contact Front Desk button.
      </p>
    </div>
  );
}