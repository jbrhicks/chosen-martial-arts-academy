import { QRCodeSVG } from "qrcode.react";
import { X, Copy, Check } from "lucide-react";
import { useState } from "react";

export default function ActivationLinkModal({ open, onClose, activationLinks }) {
  const [copied, setCopied] = useState({});

  if (!open) return null;

  // Normalize to array of { name, email, url }
  const links = Array.isArray(activationLinks) ? activationLinks : [activationLinks].filter(Boolean);

  const copyToClipboard = async (url, key) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied((c) => ({ ...c, [key]: true }));
      setTimeout(() => setCopied((c) => ({ ...c, [key]: false })), 2000);
    } catch (e) {
      // Fallback for non-secure contexts
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied((c) => ({ ...c, [key]: true }));
      setTimeout(() => setCopied((c) => ({ ...c, [key]: false })), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto border border-[#C9A84C]/30 bg-[#0A0A0A] p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">
            {links.length > 1 ? "Share Activation Links" : "Share Activation Link"}
          </h2>
          <button onClick={onClose} className="text-[#A8A9AD] hover:text-white">
            <X size={20} />
          </button>
        </div>

        <p className="text-sm text-[#A8A9AD] mb-6">
          These members couldn't be emailed (they aren't registered yet). Show them the QR code or copy the link to send via text or WhatsApp.
        </p>

        <div className="space-y-6">
          {links.map((item, idx) => {
            const key = item.email || idx;
            const label = item.name ? `${item.name}${item.email ? ` (${item.email})` : ""}` : item.email;
            return (
              <div key={key} className="border border-[#C9A84C]/20 bg-[#C9A84C]/5 p-5">
                <p className="text-sm font-medium text-white mb-4">{label}</p>
                <div className="flex flex-col sm:flex-row items-center gap-5">
                  <div className="bg-white p-3 shrink-0">
                    <QRCodeSVG value={item.url} size={168} level="M" />
                  </div>
                  <div className="flex-1 min-w-0 w-full">
                    <p className="text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Activation Link</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={item.url}
                        className="flex-1 min-w-0 bg-transparent border border-[#A8A9AD]/30 px-3 py-2 text-xs text-white focus:outline-none truncate"
                        onClick={(e) => e.target.select()}
                      />
                      <button
                        onClick={() => copyToClipboard(item.url, key)}
                        className="shrink-0 p-2 border border-[#C9A84C]/40 text-[#C9A84C] hover:bg-[#C9A84C]/10 transition-colors"
                        title="Copy link"
                      >
                        {copied[key] ? <Check size={16} /> : <Copy size={16} />}
                      </button>
                    </div>
                    <p className="text-xs text-[#A8A9AD] mt-2">Expires in 48 hours.</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 px-4 py-3 text-sm text-[#A8A9AD] hover:text-white border border-[#A8A9AD]/30 hover:border-white/50 transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
}