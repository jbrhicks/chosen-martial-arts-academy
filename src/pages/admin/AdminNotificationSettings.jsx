import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Mail, MessageSquare, Bell, Loader2, Check } from "lucide-react";

const CATEGORIES = [
  {
    key: "lead_alerts_channel",
    title: "Lead Capturing",
    description: "New trial requests and lead follow-up alerts sent to admins and prospects.",
    icon: Bell,
  },
  {
    key: "event_reminders_channel",
    title: "Event Management",
    description: "Pre-event reminders and post-event follow-ups sent to registered attendees.",
    icon: Mail,
  },
  {
    key: "billing_alerts_channel",
    title: "Billing & Administrative",
    description: "Payment failure, dunning, and account-related alerts sent to families.",
    icon: MessageSquare,
  },
];

export default function AdminNotificationSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    base44.entities.NotificationSettings.list()
      .then(async (data) => {
        if (data.length > 0) {
          setSettings(data[0]);
        } else {
          const created = await base44.entities.NotificationSettings.create({
            lead_alerts_channel: "email",
            event_reminders_channel: "email",
            billing_alerts_channel: "email",
          });
          setSettings(created);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleChannel = async (key, channel) => {
    if (!settings || saving) return;
    setSaving(true);
    setSaved(false);
    try {
      const updated = await base44.entities.NotificationSettings.update(settings.id, { [key]: channel });
      setSettings(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      alert("Failed to update setting: " + e.message);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={24} className="animate-spin text-[#C9A84C]" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <p className="text-xs tracking-widest uppercase text-[#C9A84C] mb-2">Master Switchboard</p>
        <h1 className="text-3xl font-bold">Notification Settings</h1>
        <p className="text-sm text-[#A8A9AD] mt-2">
          Control how automated notifications are delivered. Switch between branded formatted emails (with logo and direct links) or plain-text SMS-style messages at any time.
        </p>
      </div>

      <div className="space-y-4">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const currentChannel = settings?.[cat.key] || "email";
          return (
            <div key={cat.key} className="border border-[#A8A9AD]/20 bg-black p-6">
              <div className="flex items-start gap-4 mb-5">
                <div className="w-10 h-10 bg-[#C9A84C]/10 flex items-center justify-center shrink-0">
                  <Icon size={20} className="text-[#C9A84C]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C]">{cat.title}</h3>
                  <p className="text-xs text-[#A8A9AD] mt-1">{cat.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => toggleChannel(cat.key, "email")}
                  disabled={saving}
                  className={`flex items-center gap-3 px-4 py-3 border transition-all ${
                    currentChannel === "email"
                      ? "border-[#C9A84C] bg-[#C9A84C]/10"
                      : "border-[#A8A9AD]/20 hover:border-[#A8A9AD]/40"
                  }`}
                >
                  <Mail size={18} className={currentChannel === "email" ? "text-[#C9A84C]" : "text-[#A8A9AD]"} />
                  <div className="text-left">
                    <p className={`text-sm font-medium ${currentChannel === "email" ? "text-white" : "text-[#A8A9AD]"}`}>Branded Email</p>
                    <p className="text-[10px] text-[#A8A9AD]">Logo, formatting & links</p>
                  </div>
                  {currentChannel === "email" && <Check size={16} className="text-[#C9A84C] ml-auto" />}
                </button>

                <button
                  onClick={() => toggleChannel(cat.key, "sms")}
                  disabled={saving}
                  className={`flex items-center gap-3 px-4 py-3 border transition-all ${
                    currentChannel === "sms"
                      ? "border-[#C9A84C] bg-[#C9A84C]/10"
                      : "border-[#A8A9AD]/20 hover:border-[#A8A9AD]/40"
                  }`}
                >
                  <MessageSquare size={18} className={currentChannel === "sms" ? "text-[#C9A84C]" : "text-[#A8A9AD]"} />
                  <div className="text-left">
                    <p className={`text-sm font-medium ${currentChannel === "sms" ? "text-white" : "text-[#A8A9AD]"}`}>SMS / Plain Text</p>
                    <p className="text-[10px] text-[#A8A9AD]">Short text-only messages</p>
                  </div>
                  {currentChannel === "sms" && <Check size={16} className="text-[#C9A84C] ml-auto" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center gap-2 text-xs text-[#A8A9AD]">
        {saving ? (
          <><Loader2 size={14} className="animate-spin" /> Saving changes...</>
        ) : saved ? (
          <><Check size={14} className="text-green-400" /> Settings saved automatically.</>
        ) : (
          "Changes are saved instantly when you toggle a channel."
        )}
      </div>
    </div>
  );
}