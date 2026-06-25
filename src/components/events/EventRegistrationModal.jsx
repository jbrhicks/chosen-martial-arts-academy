import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X, Calendar, Loader2, FileText, Users } from "lucide-react";
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
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [answers, setAnswers] = useState({});
  const [customFields, setCustomFields] = useState([]);
  const [waiver, setWaiver] = useState(null);
  const [waiverAgreed, setWaiverAgreed] = useState(false);
  const [pricingRules, setPricingRules] = useState([]);

  useEffect(() => {
    loadStudents();
    loadCustomFields();
    loadWaiver();
    loadPricingRules();
  }, [event.id]);

  const loadStudents = async () => {
    try {
      const enrollments = await base44.entities.Enrollment.filter({ user_id: user.id, status: "active" });
      const users = await base44.entities.User.list();
      const studentIds = enrollments.map(e => e.user_id);
      const familyMembers = users.filter(u => studentIds.includes(u.id));
      setStudents(familyMembers);
    } catch (e) { console.error(e); }
  };

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

  const loadPricingRules = async () => {
    try {
      const rules = await base44.entities.EventPricingRule.filter({ event_id: event.id, is_active: true });
      setPricingRules(rules);
    } catch (e) { console.error(e); }
  };

  const toggleStudent = (studentId) => {
    setSelectedStudents(prev => prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]);
  };

  const siblingRule = pricingRules.find(r => r.discount_type === "sibling");
  const memberRule = pricingRules.find(r => r.discount_type === "member");

  const calculatePrice = () => {
    const basePrice = event.price || 0;
    const count = selectedStudents.length;
    if (count === 0) return 0;
    let total = basePrice * count;
    if (count > 1 && siblingRule) {
      const discountPerSibling = siblingRule.is_percentage ? basePrice * (siblingRule.amount / 100) : siblingRule.amount;
      total -= discountPerSibling * (count - 1);
    }
    if (memberRule) {
      const memberDiscount = memberRule.is_percentage ? total * (memberRule.amount / 100) : memberRule.amount * count;
      total -= memberDiscount;
    }
    return Math.max(0, total);
  };

  const totalPrice = calculatePrice();

  const handleSubmit = async () => {
    if (selectedStudents.length === 0) { alert("Please select at least one student."); return; }
    const requiredFields = customFields.filter(f => f.is_required);
    for (const field of requiredFields) {
      if (!answers[field.id] || (typeof answers[field.id] === "string" && answers[field.id].trim() === "")) {
        alert(`Please answer: ${field.question_text}`); return;
      }
    }
    if (waiver && !waiverAgreed) { alert("Please review and agree to the waiver before registering."); return; }

    setLoading(true);
    try {
      const existingRegs = await base44.entities.EventRegistration.filter({ event_id: event.id });
      const activeCount = existingRegs.filter(r => r.status === "registered" || r.status === "checked-in").length;
      const waitlistCount = existingRegs.filter(r => r.status === "waitlisted").length;
      const isFull = event.max_capacity > 0 && activeCount >= event.max_capacity;

      for (const studentId of selectedStudents) {
        const student = students.find(s => s.id === studentId);
        const ticketHash = `${event.id}-${studentId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const thisIsFull = event.max_capacity > 0 && (activeCount + selectedStudents.indexOf(studentId)) >= event.max_capacity;

        const registration = await base44.entities.EventRegistration.create({
          event_id: event.id,
          event_title: event.title,
          event_date: event.start_date,
          user_id: user.id,
          user_name: user.full_name,
          user_email: user.email,
          family_id: user.family_id,
          student_id: studentId,
          student_name: student.full_name,
          student_belt_rank: student.belt_rank,
          payment_status: event.price > 0 ? "pending" : "paid",
          amount_paid: totalPrice / selectedStudents.length,
          registration_date: new Date().toISOString(),
          status: thisIsFull ? "waitlisted" : "registered",
          waitlist_position: thisIsFull ? waitlistCount + selectedStudents.indexOf(studentId) + 1 : null,
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
      }

      const studentNames = selectedStudents.map(id => students.find(s => s.id === id)?.full_name).join(", ");
      await base44.integrations.Core.SendEmail({
        to: user.email,
        subject: `Event Registration: ${event.title}`,
        body: `Hi ${user.full_name},\n\nYou've been registered for ${event.title}!\n\nStudent(s): ${studentNames}\nDate: ${new Date(event.start_date).toLocaleDateString()}\nTotal: $${totalPrice.toFixed(2)}\n${isFull ? "\nYou have been added to the waitlist. We'll notify you if a spot opens up." : ""}\n${event.what_to_bring ? `\nWhat to bring: ${event.what_to_bring}\n` : ""}\nWe look forward to seeing you there!\n\n- Chosen Martial Arts Academy`,
      });

      onRegistered();
    } catch (e) { alert("Failed to register: " + e.message); }
    setLoading(false);
  };

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
            <Label className="text-[#A8A9AD] text-xs tracking-widest uppercase">Select Student(s)</Label>
            <p className="text-xs text-[#A8A9AD] mb-2">Check all family members you want to register.</p>
            <div className="space-y-2">
              {students.map((s) => (
                <label key={s.id} className={`flex items-center gap-3 p-3 border cursor-pointer transition-colors ${selectedStudents.includes(s.id) ? "border-[#C9A84C] bg-[#C9A84C]/5" : "border-[#A8A9AD]/30 hover:border-[#A8A9AD]/50"}`}>
                  <input type="checkbox" checked={selectedStudents.includes(s.id)} onChange={() => toggleStudent(s.id)} className="accent-[#C9A84C] w-4 h-4" />
                  <div>
                    <p className="text-sm font-medium text-white">{s.full_name}</p>
                    {s.belt_rank && <p className="text-xs text-[#A8A9AD]">{s.belt_rank}</p>}
                  </div>
                </label>
              ))}
            </div>
            {selectedStudents.length > 1 && siblingRule && (
              <p className="text-xs text-green-400 mt-2">✓ Sibling discount applied ({siblingRule.is_percentage ? `${siblingRule.amount}%` : `$${siblingRule.amount}`} off each additional student)</p>
            )}
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
                    <Select value={answers[field.id] || ""} onValueChange={(v) => setAnswers({ ...answers, [field.id]: v })}>
                      <SelectTrigger className="bg-[#0A0A0A] border border-[#A8A9AD]/30 text-white mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent className="bg-[#0A0A0A] border border-[#A8A9AD]/30">
                        {field.dropdown_options?.split(",").map((opt, i) => <SelectItem key={i} value={opt.trim()} className="text-white">{opt.trim()}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : field.field_type === "radio" ? (
                    <div className="space-y-2 mt-1">
                      {field.dropdown_options?.split(",").map((opt, i) => (
                        <label key={i} className="flex items-center gap-2">
                          <input type="radio" name={field.id} value={opt.trim()} checked={answers[field.id] === opt.trim()} onChange={(e) => setAnswers({ ...answers, [field.id]: e.target.value })} className="rounded" />
                          <span className="text-sm text-white">{opt.trim()}</span>
                        </label>
                      ))}
                    </div>
                  ) : field.field_type === "checkboxes" ? (
                    <div className="space-y-2 mt-1">
                      {field.dropdown_options?.split(",").map((opt, i) => (
                        <label key={i} className="flex items-center gap-2">
                          <input type="checkbox" checked={(answers[field.id] || []).includes(opt.trim())} onChange={(e) => {
                            const current = answers[field.id] || [];
                            if (e.target.checked) setAnswers({ ...answers, [field.id]: [...current, opt.trim()] });
                            else setAnswers({ ...answers, [field.id]: current.filter(v => v !== opt.trim()) });
                          }} className="rounded" />
                          <span className="text-sm text-white">{opt.trim()}</span>
                        </label>
                      ))}
                    </div>
                  ) : field.field_type === "checkbox" ? (
                    <label className="flex items-center gap-2 mt-1">
                      <input type="checkbox" checked={answers[field.id] === "yes"} onChange={(e) => setAnswers({ ...answers, [field.id]: e.target.checked ? "yes" : "no" })} className="rounded" />
                      <span className="text-sm text-white">Yes</span>
                    </label>
                  ) : field.field_type === "number" ? (
                    <Input type="number" value={answers[field.id] || ""} onChange={(e) => setAnswers({ ...answers, [field.id]: e.target.value })} className="bg-[#0A0A0A] border border-[#A8A9AD]/30 text-white mt-1" placeholder="0" />
                  ) : field.field_type === "date" ? (
                    <Input type="date" value={answers[field.id] || ""} onChange={(e) => setAnswers({ ...answers, [field.id]: e.target.value })} className="bg-[#0A0A0A] border border-[#A8A9AD]/30 text-white mt-1" />
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
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[#A8A9AD]">{selectedStudents.length} registration(s)</span>
                <span className="text-lg font-bold">${totalPrice.toFixed(2)}</span>
              </div>
              {selectedStudents.length > 1 && siblingRule && <p className="text-xs text-green-400">Sibling discount applied</p>}
              {memberRule && <p className="text-xs text-green-400">Member discount applied</p>}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button onClick={handleSubmit} disabled={loading || selectedStudents.length === 0 || (waiver && !waiverAgreed)} className="flex-1 bg-[#C9A84C] text-black hover:bg-[#E0C97A]">
              {loading ? <Loader2 size={16} className="animate-spin" /> : "Complete Registration"}
            </Button>
            <Button onClick={onClose} variant="outline" className="border-[#A8A9AD]/30 text-[#A8A9AD]"><X size={16} /></Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}