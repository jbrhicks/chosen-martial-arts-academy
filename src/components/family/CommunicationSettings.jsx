import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useFamily } from "@/lib/FamilyContext";
import { Loader2, Mail, Phone, Plus, X, Send, Trash2 } from "lucide-react";

const parseList = (str) => str ? str.split(",").map(s => s.trim()).filter(Boolean) : [];
const joinList = (arr) => arr.join(", ");

export default function CommunicationSettings() {
  const { user } = useAuth();
  const { familyGroup, refreshFamily } = useFamily();
  const [emails, setEmails] = useState(parseList(familyGroup?.cc_emails));
  const [phones, setPhones] = useState(parseList(familyGroup?.cc_phones));
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [announcement, setAnnouncement] = useState({ subject: "", message: "" });
  const [sending, setSending] = useState(false);

  const saveEmails = async (updated) => {
    setSaving(true);
    try {
      await base44.entities.FamilyGroup.update(familyGroup.id, { cc_emails: joinList(updated) });
      setEmails(updated);
      refreshFamily();
    } catch (e) { alert("Failed to save."); }
    setSaving(false);
  };

  const savePhones = async (updated) => {
    setSaving(true);
    try {
      await base44.entities.FamilyGroup.update(familyGroup.id, { cc_phones: joinList(updated) });
      setPhones(updated);
      refreshFamily();
    } catch (e) { alert("Failed to save."); }
    setSaving(false);
  };

  const addEmail = () => {
    if (!newEmail.trim() || !newEmail.includes("@")) return;
    if (emails.includes(newEmail.trim())) return;
    const updated = [...emails, newEmail.trim()];
    saveEmails(updated);
    setNewEmail("");
  };

  const removeEmail = (email) => {
    saveEmails(emails.filter((e) => e !== email));
  };

  const addPhone = () => {
    if (!newPhone.trim()) return;
    if (phones.includes(newPhone.trim())) return;
    const updated = [...phones, newPhone.trim()];
    savePhones(updated);
    setNewPhone("");
  };

  const removePhone = (phone) => {
    savePhones(phones.filter((p) => p !== phone));
  };

  const sendAnnouncement = async (e) => {
    e.preventDefault();
    if (!announcement.subject || !announcement.message) return;
    setSending(true);
    try {
      const allEmails = [...new Set([user.email, ...emails].filter(Boolean))];
      for (const email of allEmails) {
        await base44.integrations.Core.SendEmail({
          to: email,
          subject: announcement.subject,
          body: announcement.message,
        });
      }
      alert(`Announcement sent to ${allEmails.length} recipient(s).`);
      setAnnouncement({ subject: "", message: "" });
    } catch (e) { alert("Failed to send announcement."); }
    setSending(false);
  };

  return (
    <div className="space-y-8">
      {/* CC Emails */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Mail size={18} className="text-[#C9A84C]" />
          <h3 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C]">CC Email Addresses</h3>
        </div>
        <p className="text-xs text-[#A8A9AD] mb-4">All academy announcements and billing receipts are automatically sent to these addresses.</p>
        <div className="space-y-2 mb-4">
          {emails.length === 0 ? (
            <p className="text-sm text-[#A8A9AD] border border-[#A8A9AD]/20 p-4 text-center">No CC emails added yet.</p>
          ) : (
            emails.map((email) => (
              <div key={email} className="flex items-center justify-between border border-[#A8A9AD]/20 bg-black px-4 py-2.5">
                <span className="text-sm">{email}</span>
                <button onClick={() => removeEmail(email)} className="text-[#A8A9AD] hover:text-red-400 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
        <div className="flex gap-2">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addEmail())}
            placeholder="Add email address..."
            className="flex-1 bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none"
          />
          <button onClick={addEmail} disabled={saving} className="flex items-center gap-2 px-4 py-2.5 bg-[#C9A84C] text-black font-bold text-sm hover:bg-[#E0C97A] transition-colors disabled:opacity-50">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={16} />}
          </button>
        </div>
      </div>

      {/* CC Phones */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Phone size={18} className="text-[#C9A84C]" />
          <h3 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C]">CC Phone Numbers</h3>
        </div>
        <p className="text-xs text-[#A8A9AD] mb-4">SMS alerts and urgent notifications are sent to these numbers.</p>
        <div className="space-y-2 mb-4">
          {phones.length === 0 ? (
            <p className="text-sm text-[#A8A9AD] border border-[#A8A9AD]/20 p-4 text-center">No CC phone numbers added yet.</p>
          ) : (
            phones.map((phone) => (
              <div key={phone} className="flex items-center justify-between border border-[#A8A9AD]/20 bg-black px-4 py-2.5">
                <span className="text-sm">{phone}</span>
                <button onClick={() => removePhone(phone)} className="text-[#A8A9AD] hover:text-red-400 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
        <div className="flex gap-2">
          <input
            type="tel"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addPhone())}
            placeholder="Add phone number..."
            className="flex-1 bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none"
          />
          <button onClick={addPhone} disabled={saving} className="flex items-center gap-2 px-4 py-2.5 bg-[#C9A84C] text-black font-bold text-sm hover:bg-[#E0C97A] transition-colors disabled:opacity-50">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={16} />}
          </button>
        </div>
      </div>

      {/* Send Announcement */}
      <div className="border border-[#C9A84C]/20 bg-[#C9A84C]/5 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Send size={18} className="text-[#C9A84C]" />
          <h3 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C]">Send Family Announcement</h3>
        </div>
        <p className="text-xs text-[#A8A9AD] mb-4">
          Sends to {emails.length + 1} recipient(s): your email + all CC addresses.
        </p>
        <form onSubmit={sendAnnouncement} className="space-y-3">
          <input
            value={announcement.subject}
            onChange={(e) => setAnnouncement({ ...announcement, subject: e.target.value })}
            placeholder="Subject..."
            className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none"
            required
          />
          <textarea
            value={announcement.message}
            onChange={(e) => setAnnouncement({ ...announcement, message: e.target.value })}
            placeholder="Message..."
            rows={4}
            className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none resize-none"
            required
          />
          <button type="submit" disabled={sending} className="flex items-center gap-2 px-5 py-2.5 bg-[#C9A84C] text-black font-bold text-sm tracking-wide uppercase hover:bg-[#E0C97A] transition-colors disabled:opacity-50">
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Send to All
          </button>
        </form>
      </div>
    </div>
  );
}