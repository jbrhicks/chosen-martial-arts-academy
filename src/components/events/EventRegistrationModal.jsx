import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X, Calendar, DollarSign, Users, Loader2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function EventRegistrationModal({ event, user, onClose, onRegistered }) {
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [answers, setAnswers] = useState({});
  const [customFields, setCustomFields] = useState([]);
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    loadStudents();
    loadCustomFields();
  }, [event.id]);

  const loadStudents = async () => {
    try {
      const enrollments = await base44.entities.Enrollment.filter({ user_id: user.id, status: "active" });
      const users = await base44.entities.User.list();
      const studentIds = enrollments.map(e => e.user_id);
      const familyMembers = users.filter(u => studentIds.includes(u.id));
      setStudents(familyMembers);
      if (familyMembers.length === 1) {
        setSelectedStudent(familyMembers[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadCustomFields = async () => {
    try {
      const fields = await base44.entities.EventCustomField.filter({ event_id: event.id });
      fields.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
      setCustomFields(fields);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async () => {
    if (!selectedStudent) {
      alert("Please select a student.");
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
      const student = students.find(s => s.id === selectedStudent);
      
      const registration = await base44.entities.EventRegistration.create({
        event_id: event.id,
        event_title: event.title,
        event_date: event.start_date,
        user_id: user.id,
        user_name: user.full_name,
        user_email: user.email,
        family_id: user.family_id,
        student_id: selectedStudent,
        student_name: student.full_name,
        student_belt_rank: student.belt_rank,
        payment_status: event.price > 0 ? "pending" : "paid",
        amount_paid: event.price - discount,
        registration_date: new Date().toISOString(),
        status: "registered",
        promo_code_used: promoCode || undefined,
        discount_applied: discount,
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
        to: user.email,
        subject: `Event Registration: ${event.title}`,
        body: `Hi ${user.full_name},\n\nYou've been registered for ${event.title}!\n\nStudent: ${student.full_name}\nDate: ${new Date(event.start_date).toLocaleDateString()}\nAmount: $${event.price - discount}\n\nWe look forward to seeing you there!\n\n- Chosen Martial Arts Academy`,
      });

      onRegistered();
    } catch (e) {
      alert("Failed to register: " + e.message);
    }
    setLoading(false);
  };

  const finalPrice = event.price - discount;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-[#0A0A0A] border border-[#A8A9AD]/20 max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Calendar size={20} className="text-[#C9A84C]" />
            Register for {event.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <Label className="text-[#A8A9AD] text-xs tracking-widest uppercase">Select Student</Label>
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger className="bg-[#0A0A0A] border border-[#A8A9AD]/30 text-white">
                <SelectValue placeholder="Choose a student..." />
              </SelectTrigger>
              <SelectContent className="bg-[#0A0A0A] border border-[#A8A9AD]/30">
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id} className="text-white">
                    {s.full_name} {s.belt_rank && `(${s.belt_rank})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                    <Select
                      value={answers[field.id] || ""}
                      onValueChange={(v) => setAnswers({ ...answers, [field.id]: v })}
                    >
                      <SelectTrigger className="bg-[#0A0A0A] border border-[#A8A9AD]/30 text-white mt-1">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0A0A0A] border border-[#A8A9AD]/30">
                        {field.dropdown_options?.split(",").map((opt, i) => (
                          <SelectItem key={i} value={opt.trim()} className="text-white">
                            {opt.trim()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-[#A8A9AD]">Registration Fee</span>
                <span className="text-lg font-bold">${finalPrice.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex items-center justify-between text-sm text-green-400">
                  <span>Discount Applied</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSubmit}
              disabled={loading || !selectedStudent}
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