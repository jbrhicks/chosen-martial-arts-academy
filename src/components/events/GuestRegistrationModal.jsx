import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X, Calendar, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function GuestRegistrationModal({ event, onClose, onRegistered }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    student_name: "",
    parent_name: "",
    email: "",
    phone: "",
    belt_rank: "",
    age: "",
    emergency_contact: "",
    emergency_phone: "",
  });
  const [answers, setAnswers] = useState({});
  const [customFields, setCustomFields] = useState([]);
  const [waiver, setWaiver] = useState(null);
  const [waiverAgreed, setWaiverAgreed] = useState(false);

  useEffect(() => {
    loadCustomFields();
    loadWaiver();
  }, [event.id]);

  const loadCustomFields = async () => {
    try {
      const fields = await base44.entities.EventCustomField.filter({ event_id: event.id });
      fields.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
      setCustomFields(fields);
    } catch (e) { console.error(e); }
  };

  const loadWaiver = async () => {
    if (!event.linked_waiver_id) return;
    try {
      const w = await base44.entities.Waiver.get(event.linked_waiver_id);
      setWaiver(w);
    } catch (e) { console.error(e); }
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async () => {
    if (!formData.student_name || !formData.parent_name || !formData.email || !formData.phone) {
      alert("Please fill in all required fields.");
      return;
    }

    const requiredFields = customFields.filter(f => f.is_required);
    for (const field of requiredFields) {
      if (!answers[field.id] || (typeof answers[field.id] === "string" && answers[field.id].trim() === "")) {
        alert(`Please answer: ${field.question_text}`);
        return;
      }
    }

    if (waiver && !waiverAgreed) {
      alert("Please review and agree to the waiver before registering.");
      return;
    }

    setLoading(true);
    try {
      const customFieldAnswers = customFields
        .filter(f => answers[f.id] !== undefined && answers[f.id] !== null && String(answers[f.id]).trim() !== "")
        .map(f => ({
          field_id: f.id,
          question_text: f.question_text,
          value: Array.isArray(answers[f.id]) ? answers[f.id].join(", ") : answers[f.id],
        }));

      const res = await base44.functions.invoke("registerForEvent", {
        event_id: event.id,
        is_guest: true,
        guest_info: {
          student_name: formData.student_name,
          parent_name: formData.parent_name,
          email: formData.email,
          belt_rank: formData.belt_rank,
        },
        custom_field_answers: customFieldAnswers,
        waiver_agreed: !!waiverAgreed,
      });
      const data = res.data || res;
      if (!data.success) {
        alert(data.error || "Failed to register.");
        setLoading(false);
        return;
      }
      if (data.any_waitlisted) {
        alert("The event is full. You have been added to the waitlist — we'll notify you if a spot opens up.");
      }
      onRegistered();
    } catch (e) {
      alert("Failed to register: " + (e?.message || e));
    }
    setLoading(false);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-[#0A0A0A] border border-[#A8A9AD]/20 max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Calendar size={20} className="text-[#C9A84C]" />
            Guest Registration: {event.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="border border-[#C9A84C]/30 bg-[#C9A84C]/5 p-4 rounded">
            <p className="text-sm text-[#A8A9AD]">
              Registering as a guest - no account required! You'll receive confirmation via email.
            </p>
          </div>

          <div>
            <Label className="text-[#A8A9AD] text-xs tracking-widest uppercase">Student Name *</Label>
            <Input value={formData.student_name} onChange={(e) => handleChange("student_name", e.target.value)} className="bg-[#0A0A0A] border border-[#A8A9AD]/30 text-white mt-1" placeholder="Student's full name" />
          </div>

          <div>
            <Label className="text-[#A8A9AD] text-xs tracking-widest uppercase">Parent/Guardian Name *</Label>
            <Input value={formData.parent_name} onChange={(e) => handleChange("parent_name", e.target.value)} className="bg-[#0A0A0A] border border-[#A8A9AD]/30 text-white mt-1" placeholder="Your full name" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-[#A8A9AD] text-xs tracking-widest uppercase">Email *</Label>
              <Input type="email" value={formData.email} onChange={(e) => handleChange("email", e.target.value)} className="bg-[#0A0A0A] border border-[#A8A9AD]/30 text-white mt-1" placeholder="your@email.com" />
            </div>
            <div>
              <Label className="text-[#A8A9AD] text-xs tracking-widest uppercase">Phone *</Label>
              <Input type="tel" value={formData.phone} onChange={(e) => handleChange("phone", e.target.value)} className="bg-[#0A0A0A] border border-[#A8A9AD]/30 text-white mt-1" placeholder="(555) 123-4567" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-[#A8A9AD] text-xs tracking-widest uppercase">Belt Rank (Optional)</Label>
              <Input value={formData.belt_rank} onChange={(e) => handleChange("belt_rank", e.target.value)} className="bg-[#0A0A0A] border border-[#A8A9AD]/30 text-white mt-1" placeholder="e.g., White Belt" />
            </div>
            <div>
              <Label className="text-[#A8A9AD] text-xs tracking-widest uppercase">Age (Optional)</Label>
              <Input type="number" value={formData.age} onChange={(e) => handleChange("age", e.target.value)} className="bg-[#0A0A0A] border border-[#A8A9AD]/30 text-white mt-1" placeholder="Age" />
            </div>
          </div>

          <div>
            <Label className="text-[#A8A9AD] text-xs tracking-widest uppercase">Emergency Contact Name</Label>
            <Input value={formData.emergency_contact} onChange={(e) => handleChange("emergency_contact", e.target.value)} className="bg-[#0A0A0A] border border-[#A8A9AD]/30 text-white mt-1" placeholder="Emergency contact name" />
          </div>

          <div>
            <Label className="text-[#A8A9AD] text-xs tracking-widest uppercase">Emergency Contact Phone</Label>
            <Input value={formData.emergency_phone} onChange={(e) => handleChange("emergency_phone", e.target.value)} className="bg-[#0A0A0A] border border-[#A8A9AD]/30 text-white mt-1" placeholder="Emergency contact phone" />
          </div>

          {customFields.length > 0 && (
            <div className="space-y-3">
              <Label className="text-[#A8A9AD] text-xs tracking-widest uppercase">Additional Information</Label>
              {customFields.map((field) => (
                <div key={field.id}>
                  <Label className="text-[#A8A9AD] text-xs">{field.question_text} {field.is_required && <span className="text-red-400">*</span>}</Label>
                  {field.field_type === "textarea" ? (
                    <Textarea value={answers[field.id] || ""} onChange={(e) => setAnswers({ ...answers, [field.id]: e.target.value })} className="bg-[#0A0A0A] border border-[#A8A9AD]/30 text-white mt-1" rows={3} />
                  ) : field.field_type === "dropdown" ? (
                    <select value={answers[field.id] || ""} onChange={(e) => setAnswers({ ...answers, [field.id]: e.target.value })} className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 text-white mt-1 px-3 py-2 rounded-md">
                      <option value="">Select...</option>
                      {field.dropdown_options?.split(",").map((opt, i) => <option key={i} value={opt.trim()}>{opt.trim()}</option>)}
                    </select>
                  ) : field.field_type === "checkbox" ? (
                    <label className="flex items-center gap-2 mt-1">
                      <input type="checkbox" checked={answers[field.id] === "yes"} onChange={(e) => setAnswers({ ...answers, [field.id]: e.target.checked ? "yes" : "no" })} className="rounded" />
                      <span className="text-sm text-white">Yes</span>
                    </label>
                  ) : (
                    <Input value={answers[field.id] || ""} onChange={(e) => setAnswers({ ...answers, [field.id]: e.target.value })} className="bg-[#0A0A0A] border border-[#A8A9AD]/30 text-white mt-1" placeholder="Your answer" />
                  )}
                </div>
              ))}
            </div>
          )}

          {waiver && (
            <div className="border border-[#C9A84C]/30 bg-[#C9A84C]/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText size={16} className="text-[#C9A84C]" />
                <p className="text-sm font-bold text-white">{waiver.waiver_name}</p>
              </div>
              <div className="max-h-32 overflow-y-auto text-xs text-[#A8A9AD] mb-3 p-2 bg-black/30 whitespace-pre-wrap">{waiver.body_text}</div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={waiverAgreed} onChange={(e) => setWaiverAgreed(e.target.checked)} className="accent-[#C9A84C] w-4 h-4" />
                <span className="text-sm text-white">I have read and agree to the waiver above</span>
              </label>
            </div>
          )}

          {event.what_to_bring && (
            <div className="border border-[#A8A9AD]/20 p-3">
              <p className="text-xs tracking-widest uppercase text-[#C9A84C] mb-1">What to Bring</p>
              <p className="text-sm text-[#A8A9AD]">{event.what_to_bring}</p>
            </div>
          )}

          {event.price > 0 && (
            <div className="border border-[#A8A9AD]/20 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#A8A9AD]">Registration Fee</span>
                <span className="text-lg font-bold">${event.price.toFixed(2)}</span>
              </div>
              <p className="text-xs text-[#A8A9AD] mt-2">Payment will be collected at the event.</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button onClick={handleSubmit} disabled={loading || (waiver && !waiverAgreed)} className="flex-1 bg-[#C9A84C] text-black hover:bg-[#E0C97A]">
              {loading ? <Loader2 size={16} className="animate-spin" /> : "Complete Registration"}
            </Button>
            <Button onClick={onClose} variant="outline" className="border-[#A8A9AD]/30 text-[#A8A9AD]"><X size={16} /></Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}