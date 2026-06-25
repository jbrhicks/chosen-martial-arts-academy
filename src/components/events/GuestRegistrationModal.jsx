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
      const existingRegs = await base44.entities.EventRegistration.filter({ event_id: event.id });
      const activeCount = existingRegs.filter(r => r.status === "registered" || r.status === "checked-in").length;
      const waitlistCount = existingRegs.filter(r => r.status === "waitlisted").length;
      const isFull = event.max_capacity > 0 && activeCount >= event.max_capacity;
      const ticketHash = `${event.id}-guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const registration = await base44.entities.EventRegistration.create({
        event_id: event.id,
        event_title: event.title,
        event_date: event.start_date,
        user_id: null,
        user_name: formData.parent_name,
        user_email: formData.email,
        family_id: null,
        student_id: null,
        student_name: formData.student_name,
        student_belt_rank: formData.belt_rank || "N/A",
        payment_status: event.price > 0 ? "pending" : "paid",
        amount_paid: event.price,
        registration_date: new Date().toISOString(),
        status: isFull ? "waitlisted" : "registered",
        waitlist_position: isFull ? waitlistCount + 1 : null,
        is_guest: true,
        ticket_qr_hash: ticketHash,
      });

      for (const field of customFields) {
        if (answers[field.id]) {
          const answerValue = Array.isArray(answers[field.id]) ? answers[field.id].join(", ") : answers[field.id];
          await base44.entities.EventRegistrationAnswer.create({
            registration_id: registration.id,
            field_id: field.id,
            question_text: field.question_text,
            answer_value: answerValue,
          });
        }
      }

      await base44.integrations.Core.SendEmail({
        to: formData.email,
        subject: `Event Registration: ${event.title}`,
        body: `Hi ${formData.parent_name},\n\nThank you for registering for ${event.title}!\n\nStudent: ${formData.student_name}\nDate: ${new Date(event.start_date).toLocaleDateString()}\nLocation: ${event.location || "TBA"}\nAmount: $${event.price}${isFull ? "\n\nYou have been added to the waitlist. We'll notify you if a spot opens up." : ""}${event.what_to_bring ? `\n\nWhat to bring: ${event.what_to_bring}` : ""}\n\nWe look forward to seeing you there!\n\n- Chosen Martial Arts Academy`,
      });

      onRegistered();
    } catch (e) {
      alert("Failed to register: " + e.message);
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