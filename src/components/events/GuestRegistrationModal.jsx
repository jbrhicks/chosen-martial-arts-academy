import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X, Calendar, DollarSign, Loader2 } from "lucide-react";
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

  useEffect(() => {
    loadCustomFields();
  }, [event.id]);

  const loadCustomFields = async () => {
    try {
      const fields = await base44.entities.EventCustomField.filter({ event_id: event.id });
      fields.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
      setCustomFields(fields);
    } catch (e) {
      console.error(e);
    }
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
      if (!answers[field.id] || answers[field.id].trim() === "") {
        alert(`Please answer: ${field.question_text}`);
        return;
      }
    }

    setLoading(true);
    try {
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
        status: "registered",
        is_guest: true,
      });

      for (const field of customFields) {
        if (answers[field.id]) {
          await base44.entities.EventRegistrationAnswer.create({
            registration_id: registration.id,
            field_id: field.id,
            question_text: field.question_text,
            answer_value: answers[field.id],
          });
        }
      }

      await base44.integrations.Core.SendEmail({
        to: formData.email,
        subject: `Event Registration: ${event.title}`,
        body: `Hi ${formData.parent_name},\n\nThank you for registering for ${event.title}!\n\nStudent: ${formData.student_name}\nDate: ${new Date(event.start_date).toLocaleDateString()}\nLocation: ${event.location || "TBA"}\nAmount: $${event.price}\n\nWe look forward to seeing you there!\n\n- Chosen Martial Arts Academy`,
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
            <Input
              value={formData.student_name}
              onChange={(e) => handleChange("student_name", e.target.value)}
              className="bg-[#0A0A0A] border border-[#A8A9AD]/30 text-white mt-1"
              placeholder="Student's full name"
            />
          </div>

          <div>
            <Label className="text-[#A8A9AD] text-xs tracking-widest uppercase">Parent/Guardian Name *</Label>
            <Input
              value={formData.parent_name}
              onChange={(e) => handleChange("parent_name", e.target.value)}
              className="bg-[#0A0A0A] border border-[#A8A9AD]/30 text-white mt-1"
              placeholder="Your full name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-[#A8A9AD] text-xs tracking-widest uppercase">Email *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className="bg-[#0A0A0A] border border-[#A8A9AD]/30 text-white mt-1"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <Label className="text-[#A8A9AD] text-xs tracking-widest uppercase">Phone *</Label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                className="bg-[#0A0A0A] border border-[#A8A9AD]/30 text-white mt-1"
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-[#A8A9AD] text-xs tracking-widest uppercase">Belt Rank (Optional)</Label>
              <Input
                value={formData.belt_rank}
                onChange={(e) => handleChange("belt_rank", e.target.value)}
                className="bg-[#0A0A0A] border border-[#A8A9AD]/30 text-white mt-1"
                placeholder="e.g., White Belt"
              />
            </div>
            <div>
              <Label className="text-[#A8A9AD] text-xs tracking-widest uppercase">Age (Optional)</Label>
              <Input
                type="number"
                value={formData.age}
                onChange={(e) => handleChange("age", e.target.value)}
                className="bg-[#0A0A0A] border border-[#A8A9AD]/30 text-white mt-1"
                placeholder="Age"
              />
            </div>
          </div>

          <div>
            <Label className="text-[#A8A9AD] text-xs tracking-widest uppercase">Emergency Contact Name</Label>
            <Input
              value={formData.emergency_contact}
              onChange={(e) => handleChange("emergency_contact", e.target.value)}
              className="bg-[#0A0A0A] border border-[#A8A9AD]/30 text-white mt-1"
              placeholder="Emergency contact name"
            />
          </div>

          <div>
            <Label className="text-[#A8A9AD] text-xs tracking-widest uppercase">Emergency Contact Phone</Label>
            <Input
              value={formData.emergency_phone}
              onChange={(e) => handleChange("emergency_phone", e.target.value)}
              className="bg-[#0A0A0A] border border-[#A8A9AD]/30 text-white mt-1"
              placeholder="Emergency contact phone"
            />
          </div>

          {customFields.length > 0 && (
            <div className="space-y-3">
              <Label className="text-[#A8A9AD] text-xs tracking-widest uppercase">Additional Information</Label>
              {customFields.map((field) => (
                <div key={field.id}>
                  <Label className="text-[#A8A9AD] text-xs">
                    {field.question_text} {field.is_required && <span className="text-red-400">*</span>}
                  </Label>
                  {field.field_type === "textarea" ? (
                    <Textarea
                      value={answers[field.id] || ""}
                      onChange={(e) => setAnswers({ ...answers, [field.id]: e.target.value })}
                      className="bg-[#0A0A0A] border border-[#A8A9AD]/30 text-white mt-1"
                      rows={3}
                    />
                  ) : field.field_type === "dropdown" ? (
                    <select
                      value={answers[field.id] || ""}
                      onChange={(e) => setAnswers({ ...answers, [field.id]: e.target.value })}
                      className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 text-white mt-1 px-3 py-2 rounded-md"
                    >
                      <option value="">Select...</option>
                      {field.dropdown_options?.split(",").map((opt, i) => (
                        <option key={i} value={opt.trim()}>
                          {opt.trim()}
                        </option>
                      ))}
                    </select>
                  ) : field.field_type === "checkbox" ? (
                    <label className="flex items-center gap-2 mt-1">
                      <input
                        type="checkbox"
                        checked={answers[field.id] === "yes"}
                        onChange={(e) => setAnswers({ ...answers, [field.id]: e.target.checked ? "yes" : "no" })}
                        className="rounded"
                      />
                      <span className="text-sm text-white">Yes</span>
                    </label>
                  ) : (
                    <Input
                      value={answers[field.id] || ""}
                      onChange={(e) => setAnswers({ ...answers, [field.id]: e.target.value })}
                      className="bg-[#0A0A0A] border border-[#A8A9AD]/30 text-white mt-1"
                      placeholder="Your answer"
                    />
                  )}
                </div>
              ))}
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
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-[#C9A84C] text-black hover:bg-[#E0C97A]"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : "Complete Registration"}
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="border-[#A8A9AD]/30 text-[#A8A9AD]"
            >
              <X size={16} />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}