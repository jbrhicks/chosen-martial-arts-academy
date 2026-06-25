import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Send, Mail, MessageSquare, Bell, Clock, Save, Users, X, AlertTriangle, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { BELT_RANKS } from "@/lib/constants";
import toast from "react-hot-toast";

const MERGE_TAGS = [
  { label: "Guardian First", value: "[Guardian First Name]" },
  { label: "Student First", value: "[Student First Name]" },
  { label: "Next Class", value: "[Next Class Time]" },
];

function calculateSmsSegments(text) {
  if (!text) return { segments: 0, chars: 0, encoding: "GSM-7", warning: false };
  const gsm7Regex = /^[\x00-\x7F\u20AC]*$/;
  const isUnicode = !gsm7Regex.test(text);
  const encoding = isUnicode ? "Unicode" : "GSM-7";
  const maxSingle = isUnicode ? 70 : 160;
  const maxMulti = isUnicode ? 67 : 153;
  const chars = text.length;
  const segments = chars <= maxSingle ? 1 : Math.ceil(chars / maxMulti);
  return { segments, chars, encoding, warning: segments > 3 };
}

export default function BroadcastComposer({ onClose, onSent, programs, events, allUsers, templates, loadedTemplate, onSaveTemplate }) {
  const [formData, setFormData] = useState({
    subject: "",
    body: "",
    channel_email: false,
    channel_sms: false,
    channel_in_app: true,
    target_type: "all_active",
    target_program_id: "",
    target_belt_rank: "",
    target_event_id: "",
    target_event_title: "",
    target_user_ids: "",
    exclude_event_id: "",
    exclude_program_id: "",
    min_belt_rank: "",
  });
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [sending, setSending] = useState(false);
  const [showUserPicker, setShowUserPicker] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateTitle, setTemplateTitle] = useState("");
  const [templateCategory, setTemplateCategory] = useState("General");

  useEffect(() => {
    if (loadedTemplate) {
      setFormData(prev => ({ ...prev, body: loadedTemplate.message_body || "", subject: prev.subject || loadedTemplate.title || "" }));
    }
  }, [loadedTemplate]);

  const smsInfo = useMemo(() => calculateSmsSegments(formData.body), [formData.body]);

  const selectedUserCount = formData.target_user_ids ? formData.target_user_ids.split(",").length : 0;
  const filteredUsers = allUsers.filter(u =>
    u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const handleUserToggle = (userId) => {
    const ids = formData.target_user_ids ? formData.target_user_ids.split(",") : [];
    const newIds = ids.includes(userId) ? ids.filter(id => id !== userId) : [...ids, userId];
    setFormData({ ...formData, target_user_ids: newIds.join(",") });
  };

  const insertMergeTag = (tag) => {
    setFormData({ ...formData, body: formData.body + tag });
  };

  const handleSaveTemplate = async () => {
    if (!templateTitle || !formData.body) {
      toast.error("Title and message body required");
      return;
    }
    try {
      const user = await base44.auth.me();
      await base44.entities.MessageTemplate.create({
        title: templateTitle,
        message_body: formData.body,
        category: templateCategory,
        created_by_id: user.id,
        created_by_name: user.full_name,
      });
      toast.success("Template saved!");
      setShowSaveTemplate(false);
      setTemplateTitle("");
      if (onSaveTemplate) onSaveTemplate();
    } catch (e) {
      toast.error("Failed to save template: " + e.message);
    }
  };

  const handleSubmit = async () => {
    if (!formData.subject || !formData.body) {
      toast.error("Subject and message body are required");
      return;
    }
    if (!formData.channel_email && !formData.channel_sms && !formData.channel_in_app) {
      toast.error("Select at least one delivery channel");
      return;
    }
    if (scheduleEnabled && !scheduledDate) {
      toast.error("Select a scheduled date and time");
      return;
    }

    setSending(true);
    try {
      const user = await base44.auth.me();
      const status = scheduleEnabled ? "scheduled" : "sent";
      const broadcast = await base44.entities.BroadcastMessage.create({
        ...formData,
        created_by_id: user.id,
        created_by_name: user.full_name,
        created_date: new Date().toISOString(),
        status,
        scheduled_date: scheduleEnabled ? new Date(scheduledDate).toISOString() : null,
      });

      if (!scheduleEnabled) {
        await base44.functions.invoke("sendBroadcast", { broadcastId: broadcast.id });
        toast.success("Broadcast sent!");
      } else {
        toast.success(`Broadcast scheduled for ${new Date(scheduledDate).toLocaleString()}`);
      }

      onSent();
      onClose();
    } catch (e) {
      toast.error("Failed: " + e.message);
    }
    setSending(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-black border border-[#A8A9AD]/20 w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-lg">
        <div className="flex items-center justify-between p-6 border-b border-[#A8A9AD]/20 sticky top-0 bg-black z-10">
          <h2 className="text-lg font-bold text-white">Compose Broadcast</h2>
          <Button variant="ghost" size="sm" onClick={onClose}><X size={18} /></Button>
        </div>

        <div className="p-6 space-y-5">
          {/* Subject */}
          <div>
            <Label className="text-[#A8A9AD]">Subject *</Label>
            <Input
              value={formData.subject}
              onChange={e => setFormData({ ...formData, subject: e.target.value })}
              className="bg-[#0A0A0A] border-[#A8A9AD]/20 text-white mt-1"
              placeholder="e.g., Snow Day - Academy Closed"
            />
          </div>

          {/* Merge Tags */}
          <div>
            <Label className="text-[#A8A9AD] mb-2 block">Personalization Merge Tags</Label>
            <div className="flex flex-wrap gap-2">
              {MERGE_TAGS.map(tag => (
                <button
                  key={tag.value}
                  onClick={() => insertMergeTag(tag.value)}
                  className="px-3 py-1.5 text-xs border border-[#C9A84C]/30 text-[#C9A84C] hover:bg-[#C9A84C]/10 transition-colors rounded"
                >
                  + {tag.label}
                </button>
              ))}
            </div>
          </div>

          {/* Message Body */}
          <div>
            <Label className="text-[#A8A9AD]">Message *</Label>
            <Textarea
              value={formData.body}
              onChange={e => setFormData({ ...formData, body: e.target.value })}
              className="bg-[#0A0A0A] border-[#A8A9AD]/20 text-white min-h-[150px] mt-1"
              placeholder="Enter your message. Use merge tags to personalize."
            />
            {/* SMS Segment Counter */}
            {formData.channel_sms && (
              <div className="flex items-center gap-3 mt-2 text-xs">
                <span className={smsInfo.warning ? "text-red-400" : "text-[#A8A9AD]"}>
                  SMS: {smsInfo.chars} chars · {smsInfo.encoding} · {smsInfo.segments} segment{smsInfo.segments !== 1 ? "s" : ""}
                </span>
                {smsInfo.warning && (
                  <span className="flex items-center gap-1 text-red-400">
                    <AlertTriangle size={12} /> Long message — will be split into multiple billable segments
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Channels */}
          <div>
            <Label className="text-[#A8A9AD] mb-2 block">Delivery Channels *</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox id="ch_inapp" checked={formData.channel_in_app} onCheckedChange={c => setFormData({ ...formData, channel_in_app: c })} />
                <label htmlFor="ch_inapp" className="text-sm text-white flex items-center gap-2"><Bell size={16} /> In-App Push (Always delivered — mandatory fallback)</label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="ch_email" checked={formData.channel_email} onCheckedChange={c => setFormData({ ...formData, channel_email: c })} />
                <label htmlFor="ch_email" className="text-sm text-white flex items-center gap-2"><Mail size={16} /> Email (Respects opt-out preferences)</label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="ch_sms" checked={formData.channel_sms} onCheckedChange={c => setFormData({ ...formData, channel_sms: c })} />
                <label htmlFor="ch_sms" className="text-sm text-white flex items-center gap-2"><MessageSquare size={16} /> SMS Text (Respects opt-out preferences)</label>
              </div>
            </div>
          </div>

          {/* Audience Builder - Include */}
          <div className="border border-[#A8A9AD]/20 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Users size={14} className="text-[#C9A84C]" />
              <span className="text-xs tracking-widest uppercase text-[#C9A84C] font-bold">Include Audience</span>
            </div>
            <Select value={formData.target_type} onValueChange={v => setFormData({ ...formData, target_type: v })}>
              <SelectTrigger className="bg-[#0A0A0A] border-[#A8A9AD]/20 text-white"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-black border-[#A8A9AD]/20 text-white">
                <SelectItem value="all_active">All Active Students</SelectItem>
                <SelectItem value="all_inactive">All Inactive Students</SelectItem>
                <SelectItem value="program">By Program</SelectItem>
                <SelectItem value="belt_rank">By Belt Rank</SelectItem>
                <SelectItem value="event_registered">Event Registrants</SelectItem>
                <SelectItem value="custom">Manually Select Users</SelectItem>
              </SelectContent>
            </Select>

            {formData.target_type === "program" && (
              <Select value={formData.target_program_id} onValueChange={v => setFormData({ ...formData, target_program_id: v })}>
                <SelectTrigger className="bg-[#0A0A0A] border-[#A8A9AD]/20 text-white"><SelectValue placeholder="Select program" /></SelectTrigger>
                <SelectContent className="bg-black border-[#A8A9AD]/20 text-white">
                  {programs.map(p => <SelectItem key={p.id} value={p.id}>{p.program_name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            {formData.target_type === "belt_rank" && (
              <Select value={formData.target_belt_rank} onValueChange={v => setFormData({ ...formData, target_belt_rank: v })}>
                <SelectTrigger className="bg-[#0A0A0A] border-[#A8A9AD]/20 text-white"><SelectValue placeholder="Select belt rank" /></SelectTrigger>
                <SelectContent className="bg-black border-[#A8A9AD]/20 text-white">
                  {BELT_RANKS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            {formData.target_type === "event_registered" && (
              <Select value={formData.target_event_id} onValueChange={v => {
                const ev = events.find(e => e.id === v);
                setFormData({ ...formData, target_event_id: v, target_event_title: ev?.title || "" });
              }}>
                <SelectTrigger className="bg-[#0A0A0A] border-[#A8A9AD]/20 text-white"><SelectValue placeholder="Select event" /></SelectTrigger>
                <SelectContent className="bg-black border-[#A8A9AD]/20 text-white">
                  {events.map(e => <SelectItem key={e.id} value={e.id}>{e.title} ({new Date(e.start_date).toLocaleDateString()})</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            {formData.target_type === "custom" && (
              <div>
                <Button variant="outline" onClick={() => setShowUserPicker(true)} className="border-[#A8A9AD]/20 w-full justify-between">
                  <span className="text-white">{selectedUserCount > 0 ? `${selectedUserCount} user${selectedUserCount > 1 ? "s" : ""} selected` : "Choose users..."}</span>
                  <Users size={16} className="text-[#A8A9AD]" />
                </Button>
              </div>
            )}
          </div>

          {/* Audience Builder - Exclude */}
          <div className="border border-red-500/20 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <X size={14} className="text-red-400" />
              <span className="text-xs tracking-widest uppercase text-red-400 font-bold">Exclude Audience (Subtractive Rules)</span>
            </div>
            <div>
              <Label className="text-[#A8A9AD] text-xs">Exclude users registered for event:</Label>
              <Select value={formData.exclude_event_id} onValueChange={v => {
                const ev = events.find(e => e.id === v);
                setFormData({ ...formData, exclude_event_id: v, exclude_event_title: ev?.title || "" });
              }}>
                <SelectTrigger className="bg-[#0A0A0A] border-[#A8A9AD]/20 text-white mt-1"><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent className="bg-black border-[#A8A9AD]/20 text-white">
                  <SelectItem value={null}>None</SelectItem>
                  {events.map(e => <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[#A8A9AD] text-xs">Exclude users enrolled in program:</Label>
              <Select value={formData.exclude_program_id} onValueChange={v => setFormData({ ...formData, exclude_program_id: v })}>
                <SelectTrigger className="bg-[#0A0A0A] border-[#A8A9AD]/20 text-white mt-1"><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent className="bg-black border-[#A8A9AD]/20 text-white">
                  <SelectItem value={null}>None</SelectItem>
                  {programs.map(p => <SelectItem key={p.id} value={p.id}>{p.program_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[#A8A9AD] text-xs">Only include belts at or above:</Label>
              <Select value={formData.min_belt_rank} onValueChange={v => setFormData({ ...formData, min_belt_rank: v })}>
                <SelectTrigger className="bg-[#0A0A0A] border-[#A8A9AD]/20 text-white mt-1"><SelectValue placeholder="Any rank" /></SelectTrigger>
                <SelectContent className="bg-black border-[#A8A9AD]/20 text-white">
                  <SelectItem value={null}>Any rank</SelectItem>
                  {BELT_RANKS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Scheduling */}
          <div className="border border-[#A8A9AD]/20 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox id="schedule" checked={scheduleEnabled} onCheckedChange={setScheduleEnabled} />
              <label htmlFor="schedule" className="text-sm text-white flex items-center gap-2"><Clock size={16} /> Schedule for later</label>
            </div>
            {scheduleEnabled && (
              <div>
                <Label className="text-[#A8A9AD] text-xs">Send at:</Label>
                <Input
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={e => setScheduledDate(e.target.value)}
                  className="bg-[#0A0A0A] border-[#A8A9AD]/20 text-white mt-1"
                />
                <p className="text-xs text-[#A8A9AD] mt-1">The broadcast will auto-send at this time. A scheduled job checks every 5 minutes.</p>
              </div>
            )}
          </div>

          {/* Template Save */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowSaveTemplate(!showSaveTemplate)} className="border-[#A8A9AD]/20 text-[#A8A9AD]">
              <Save size={14} className="mr-1" /> Save as Template
            </Button>
          </div>
          {showSaveTemplate && (
            <div className="border border-[#A8A9AD]/20 p-4 space-y-3">
              <div>
                <Label className="text-[#A8A9AD] text-xs">Template Title:</Label>
                <Input value={templateTitle} onChange={e => setTemplateTitle(e.target.value)} className="bg-[#0A0A0A] border-[#A8A9AD]/20 text-white mt-1" placeholder="e.g., Holiday Closure Notice" />
              </div>
              <div>
                <Label className="text-[#A8A9AD] text-xs">Category:</Label>
                <Select value={templateCategory} onValueChange={setTemplateCategory}>
                  <SelectTrigger className="bg-[#0A0A0A] border-[#A8A9AD]/20 text-white mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-black border-[#A8A9AD]/20 text-white">
                    {["Weather", "Billing", "Events", "Schedule", "Holiday", "General"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSaveTemplate} size="sm" className="bg-[#C9A84C] text-black hover:bg-[#E0C97A]">Save Template</Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-6 border-t border-[#A8A9AD]/20 sticky bottom-0 bg-black">
          <Button onClick={handleSubmit} disabled={sending} className="flex-1 bg-[#C9A84C] text-black hover:bg-[#E0C97A]">
            {sending ? "Processing..." : scheduleEnabled ? <><Calendar size={16} className="mr-1" /> Schedule Broadcast</> : <><Send size={16} className="mr-1" /> Send Broadcast</>}
          </Button>
          <Button variant="outline" onClick={onClose} className="border-[#A8A9AD]/20">Cancel</Button>
        </div>
      </div>

      {/* User Picker */}
      {showUserPicker && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4" onClick={() => setShowUserPicker(false)}>
          <div className="bg-black border border-[#A8A9AD]/20 w-full max-w-xl max-h-[80vh] overflow-hidden flex flex-col rounded-lg" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-[#A8A9AD]/20 flex items-center justify-between">
              <h3 className="text-white font-bold">Select Users</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowUserPicker(false)}><X size={18} /></Button>
            </div>
            <div className="p-4 border-b border-[#A8A9AD]/20">
              <Input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Search by name or email..." className="bg-[#0A0A0A] border-[#A8A9AD]/20 text-white" />
            </div>
            <div className="overflow-y-auto flex-1 p-4 space-y-2">
              {filteredUsers.map(u => {
                const isSelected = formData.target_user_ids?.split(",").includes(u.id);
                return (
                  <div key={u.id} onClick={() => handleUserToggle(u.id)} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer ${isSelected ? "bg-[#C9A84C]/20 border border-[#C9A84C]/30" : "bg-[#0A0A0A] border border-[#A8A9AD]/10"}`}>
                    <Checkbox checked={isSelected} onChange={() => {}} />
                    <div><p className="text-sm text-white">{u.full_name}</p><p className="text-xs text-[#A8A9AD]">{u.email}</p></div>
                  </div>
                );
              })}
            </div>
            <div className="p-4 border-t border-[#A8A9AD]/20">
              <Button onClick={() => setShowUserPicker(false)} className="w-full bg-[#C9A84C] text-black hover:bg-[#E0C97A]">Done ({selectedUserCount} selected)</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}