import { CheckCheck, Check, Mail, Phone, Bell } from "lucide-react";
import MessageReactions from "./MessageReactions";

function linkify(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) =>
    urlRegex.test(part) ? (
      <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-[#C9A84C] underline break-all hover:text-[#E0C97A]">
        {part}
      </a>
    ) : part
  );
}

function isVideo(url) {
  return /\.(mp4|mov|webm|ogg)(\?|$)/i.test(url);
}

function parseMedia(mediaStr) {
  if (!mediaStr) return [];
  try { return JSON.parse(mediaStr); } catch { return []; }
}

export default function MessageBubble({ message, isOutbound, currentUserId, reactions, onReactionsUpdate, showChannel = true }) {
  const media = parseMedia(message.media_urls);

  return (
    <div className={`flex ${isOutbound ? "justify-end" : "justify-start"} group`}>
      <div className={`max-w-[75%] rounded-lg p-3 ${
        isOutbound ? "bg-[#C9A84C]/20 border border-[#C9A84C]/30" : "bg-[#1a1a1a] border border-[#A8A9AD]/10"
      }`}>
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-[10px] font-medium text-[#C9A84C]">{message.sender_name}</span>
          {showChannel && (
            <span className="text-[#A8A9AD]">
              {message.channel_used === "email" && <Mail size={10} />}
              {message.channel_used === "sms" && <Phone size={10} />}
              {message.channel_used === "in_app" && <Bell size={10} />}
            </span>
          )}
          {message.direction && (
            <span className="text-[9px] text-[#A8A9AD] uppercase tracking-wider">{message.direction}</span>
          )}
        </div>

        {message.content && (
          <p className="text-sm text-white whitespace-pre-wrap">{linkify(message.content)}</p>
        )}

        {media.length > 0 && (
          <div className={`mt-2 ${media.length === 1 ? "" : "grid grid-cols-2 gap-1.5"}`}>
            {media.map((url, i) =>
              isVideo(url) ? (
                <video key={i} src={url} controls className="rounded max-h-52 w-full object-cover" />
              ) : (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                  <img src={url} alt="" className="rounded max-h-52 w-full object-cover cursor-pointer hover:opacity-90 transition-opacity" />
                </a>
              )
            )}
          </div>
        )}

        <div className="flex items-center justify-end gap-1 mt-1">
          <span className="text-[9px] text-[#A8A9AD]">
            {message.created_date ? new Date(message.created_date).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : ""}
          </span>
          {isOutbound && (
            message.read_receipt
              ? <CheckCheck size={12} className="text-[#C9A84C]" />
              : <Check size={12} className="text-[#A8A9AD]" />
          )}
        </div>

        <MessageReactions
          messageId={message.id}
          reactions={reactions}
          currentUserId={currentUserId}
          onUpdate={onReactionsUpdate}
        />
      </div>
    </div>
  );
}