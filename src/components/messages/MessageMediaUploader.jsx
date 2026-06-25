import { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Paperclip, X, Image, Film, Loader2 } from "lucide-react";

export default function MessageMediaUploader({ attachments, onAttachmentsChange }) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    const newUrls = [];
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      newUrls.push(file_url);
    }
    onAttachmentsChange([...attachments, ...newUrls]);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const removeAttachment = (idx) => {
    onAttachmentsChange(attachments.filter((_, i) => i !== idx));
  };

  const isVideo = (url) => /\.(mp4|mov|webm|ogg)(\?|$)/i.test(url);

  return (
    <div className="flex flex-col">
      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="flex items-center justify-center w-10 h-10 border border-[#A8A9AD]/30 bg-[#0A0A0A] text-[#A8A9AD] hover:text-[#C9A84C] hover:border-[#C9A84C]/50 transition-colors rounded"
        title="Attach photo or video"
      >
        {uploading ? <Loader2 size={18} className="animate-spin" /> : <Paperclip size={18} />}
      </button>

      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {attachments.map((url, i) => (
            <div key={i} className="relative group w-16 h-16 border border-[#A8A9AD]/20 rounded overflow-hidden bg-[#111]">
              {isVideo(url) ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Film size={20} className="text-[#C9A84C]" />
                </div>
              ) : (
                <img src={url} alt="" className="w-full h-full object-cover" />
              )}
              <button
                onClick={() => removeAttachment(i)}
                className="absolute top-0 right-0 bg-black/70 text-white p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}