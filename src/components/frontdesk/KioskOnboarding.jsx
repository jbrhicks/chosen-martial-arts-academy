import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import SignaturePad from "@/components/admin/onboarding/SignaturePad";
import { ChevronLeft, ChevronRight, UserPlus, Trash2, Loader2, CheckCircle, CreditCard } from "lucide-react";

const STEPS = ["Guardian", "Students", "Programs", "Waiver", "Payment"];

export default function KioskOnboarding({ onBack, onComplete }) {
  const [step, setStep] = useState(1);
  const [programs, setPrograms] = useState([]);
  const [guardian, setGuardian] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const [students, setStudents] = useState([{ firstName: "", lastName: "", dob: "", program: "" }]);
  const [waiverSigned, setWaiverSigned] = useState(false);
  const [card, setCard] = useState({ name: "", number: "", expiry: "", cvc: "" });
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState(null);

  useEffect(() => {
    base44.entities.Program.filter({ status: "active" }).then(setPrograms).catch(() => {});
  }, []);

  const REG_FEE = 75;
  const FIRST_MONTH = 120;
  const total = REG_FEE + FIRST_MONTH * students.length;

  const updateStudent = (i, field, val) => setStudents(students.map((s, idx) => idx === i ? { ...s, [field]: val } : s));
  const addStudent = () => setStudents([...students, { firstName: "", lastName: "", dob: "", program: "" }]);
  const removeStudent = (i) => setStudents(students.filter((_, idx) => idx !== i));

  const validateStep = (s) => {
    if (s === 1) return guardian.firstName && guardian.lastName && guardian.email && guardian.phone;
    if (s === 2) return students.every(st => st.firstName && st.lastName);
    if (s === 3) return students.every(st => st.program);
    if (s === 4) return waiverSigned;
    return true;
  };

  const nextStep = () => { if (validateStep(step)) setStep(step + 1); };
  const prevStep = () => setStep(step - 1);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // 1. Create FamilyGroup
      const familyCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const familyGroup = await base44.entities.FamilyGroup.create({
        family_name: `${guardian.lastName} Family`,
        primary_contact_id: "",
        billing_status: "active",
        cc_emails: guardian.email,
        cc_phones: guardian.phone,
        invite_code: familyCode,
      });

      // 2. Invite guardian + students, generate activation tokens
      const allMembers = [
        { email: guardian.email, firstName: guardian.firstName, lastName: guardian.lastName, isGuardian: true },
        ...students.map(s => ({ email: `${s.firstName.toLowerCase()}.${s.lastName.toLowerCase()}@chosenmaa.com`, firstName: s.firstName, lastName: s.lastName, isGuardian: false })),
      ];
      for (const m of allMembers) {
        try { await base44.users.inviteUser(m.email, "user"); } catch (e) { console.error("Invite failed:", m.email, e); }
        try { await base44.functions.invoke("generateActivationToken", { email: m.email, first_name: m.firstName }); } catch (e) { console.error("Activation failed:", m.email, e); }
      }

      // 3. Create Enrollment records
      for (const s of students) {
        await base44.entities.Enrollment.create({
          user_email: guardian.email,
          user_name: `${s.firstName} ${s.lastName}`,
          program: s.program,
          start_date: new Date().toISOString().split("T")[0],
          status: "active",
        });
      }

      // 4. Create BillingRecord
      const nextDate = new Date();
      nextDate.setDate(1);
      if (nextDate < new Date()) nextDate.setMonth(nextDate.getMonth() + 1);
      await base44.entities.BillingRecord.create({
        family_id: familyGroup.id,
        recurring_amount: FIRST_MONTH * students.length,
        billing_cycle: "1st",
        billing_cycle_date: 1,
        next_billing_date: nextDate.toISOString().split("T")[0],
        payment_type: "credit_card",
        status: "active",
        split_billing_enabled: false,
      });

      // 5. Create Payment record
      await base44.entities.Payment.create({
        user_id: "kiosk_onboarding",
        user_name: `${guardian.firstName} ${guardian.lastName}`,
        amount: total,
        payment_type: "subscription",
        description: `Kiosk registration: ${students.length} student(s) + reg fee`,
        status: "succeeded",
        payment_date: new Date().toISOString(),
      });

      // 6. Store waiver
      try {
        await base44.entities.FamilyDocument.create({
          family_id: familyGroup.id,
          user_id: "kiosk_onboarding",
          user_name: `${guardian.firstName} ${guardian.lastName}`,
          title: "Liability Waiver",
          document_type: "waiver",
          status: "signed",
          signed_by: `${guardian.firstName} ${guardian.lastName}`,
          signed_date: new Date().toISOString().split("T")[0],
        });
      } catch (e) { console.error("Waiver save failed:", e); }

      setConfirmation({ guardian, students, total, familyGroup });
    } catch (e) {
      alert("Registration failed: " + e.message);
    }
    setSubmitting(false);
  };

  if (confirmation) {
    return (
      <div className="fixed inset-0 bg-[#0A0A0A] text-white flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 border-2 border-[#C9A84C] flex items-center justify-center mx-auto mb-6"><CheckCircle size={40} className="text-[#C9A84C]" /></div>
          <h1 className="text-2xl font-bold mb-3">Registration Complete!</h1>
          <p className="text-[#A8A9AD] mb-6">Welcome to the Chosen family, {confirmation.guardian.firstName}! Activation emails have been sent to {confirmation.guardian.email}. Your family can set up their app accounts from the email link.</p>
          <div className="border border-[#A8A9AD]/20 p-4 mb-6 text-left">
            <p className="text-sm text-[#A8A9AD]">Students enrolled: {confirmation.students.length}</p>
            <p className="text-sm text-[#A8A9AD]">Total paid today: <span className="text-[#C9A84C] font-bold">${confirmation.total}</span></p>
            <p className="text-sm text-[#A8A9AD]">Monthly tuition: <span className="text-[#C9A84C] font-bold">${120 * confirmation.students.length}/mo</span></p>
          </div>
          <button onClick={onComplete} className="w-full py-4 bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase hover:bg-[#E0C97A] transition-colors">Done — Back to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#0A0A0A] text-white flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-[#A8A9AD]/10">
        <button onClick={onBack} className="flex items-center gap-2 text-[#A8A9AD] hover:text-white transition-colors"><ChevronLeft size={20} /> Home</button>
        <div className="flex gap-2">{STEPS.map((s, i) => <div key={s} className={`h-1 w-12 ${i + 1 <= step ? "bg-[#C9A84C]" : "bg-[#A8A9AD]/20"}`} />)}</div>
        <span className="text-xs text-[#A8A9AD]">Step {step}/5</span>
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-10">
        <div className="max-w-2xl mx-auto">
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold mb-2">Let's Get Started</h2>
              <p className="text-[#A8A9AD] mb-8">Enter the primary guardian's contact information.</p>
              <div className="grid md:grid-cols-2 gap-4">
                <div><label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">First Name</label><input value={guardian.firstName} onChange={e => setGuardian({ ...guardian, firstName: e.target.value })} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-3 text-lg focus:border-[#C9A84C] focus:outline-none" /></div>
                <div><label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Last Name</label><input value={guardian.lastName} onChange={e => setGuardian({ ...guardian, lastName: e.target.value })} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-3 text-lg focus:border-[#C9A84C] focus:outline-none" /></div>
                <div><label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Email</label><input type="email" value={guardian.email} onChange={e => setGuardian({ ...guardian, email: e.target.value })} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-3 text-lg focus:border-[#C9A84C] focus:outline-none" /></div>
                <div><label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Phone</label><input type="tel" value={guardian.phone} onChange={e => setGuardian({ ...guardian, phone: e.target.value })} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-3 text-lg focus:border-[#C9A84C] focus:outline-none" /></div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold mb-2">Who's Training?</h2>
              <p className="text-[#A8A9AD] mb-8">Add each student who will be training.</p>
              <div className="space-y-4">
                {students.map((s, i) => (
                  <div key={i} className="border border-[#A8A9AD]/20 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold text-[#C9A84C]">Student {i + 1}</span>
                      {students.length > 1 && <button onClick={() => removeStudent(i)} className="text-[#A8A9AD] hover:text-red-400"><Trash2 size={18} /></button>}
                    </div>
                    <div className="grid md:grid-cols-3 gap-3">
                      <input placeholder="First Name" value={s.firstName} onChange={e => updateStudent(i, "firstName", e.target.value)} className="bg-transparent border border-[#A8A9AD]/30 px-3 py-2.5 focus:border-[#C9A84C] focus:outline-none" />
                      <input placeholder="Last Name" value={s.lastName} onChange={e => updateStudent(i, "lastName", e.target.value)} className="bg-transparent border border-[#A8A9AD]/30 px-3 py-2.5 focus:border-[#C9A84C] focus:outline-none" />
                      <input type="date" placeholder="DOB" value={s.dob} onChange={e => updateStudent(i, "dob", e.target.value)} className="bg-transparent border border-[#A8A9AD]/30 px-3 py-2.5 text-[#A8A9AD] focus:border-[#C9A84C] focus:outline-none" />
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={addStudent} className="mt-4 flex items-center gap-2 px-5 py-3 border border-[#C9A84C]/40 text-[#C9A84C] text-sm font-medium hover:bg-[#C9A84C]/10 transition-colors"><UserPlus size={18} /> Add Another Family Member</button>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold mb-2">Choose Your Program</h2>
              <p className="text-[#A8A9AD] mb-8">Select a program for each student.</p>
              <div className="space-y-6">
                {students.map((s, i) => (
                  <div key={i}>
                    <p className="text-sm font-bold mb-3">{s.firstName} {s.lastName}</p>
                    <div className="grid md:grid-cols-2 gap-3">
                      {programs.map(p => (
                        <button key={p.id} onClick={() => updateStudent(i, "program", p.program_name)} className={`text-left p-4 border-2 transition-colors ${s.program === p.program_name ? "border-[#C9A84C] bg-[#C9A84C]/10" : "border-[#A8A9AD]/20 hover:border-[#A8A9AD]/40"}`}>
                          <p className="font-bold">{p.program_name}</p>
                          <p className="text-xs text-[#A8A9AD]">{p.age_group} • ${p.default_monthly_rate}/mo</p>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="text-2xl font-bold mb-2">Liability Waiver</h2>
              <p className="text-[#A8A9AD] mb-4">Please read and sign below.</p>
              <div className="border border-[#A8A9AD]/20 p-4 max-h-48 overflow-y-auto text-sm text-[#A8A9AD] mb-6">
                <p className="mb-3">In consideration of being permitted to participate in martial arts training at Chosen Martial Arts Academy, I hereby release, discharge, and covenant not to sue the academy, its instructors, officers, or agents from any and all liability, claims, demands, or injuries arising from participation in training, sparring, testing, or any academy-related activity.</p>
                <p className="mb-3">I acknowledge that martial arts training involves inherent risks of physical injury. I assume full responsibility for any injuries or damages sustained during participation.</p>
                <p>I certify that I am the parent/legal guardian of the student(s) listed and have the authority to sign this waiver on their behalf.</p>
              </div>
              <p className="text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Sign Here</p>
              <SignaturePad onSign={(signed) => setWaiverSigned(signed)} />
            </div>
          )}

          {step === 5 && (
            <div>
              <h2 className="text-2xl font-bold mb-2">Payment</h2>
              <p className="text-[#A8A9AD] mb-6">Enter your card to complete registration.</p>
              <div className="border border-[#A8A9AD]/20 p-4 mb-6">
                <div className="flex justify-between text-sm mb-2"><span className="text-[#A8A9AD]">Registration Fee</span><span>${REG_FEE}</span></div>
                <div className="flex justify-between text-sm mb-2"><span className="text-[#A8A9AD]">First Month Tuition ({students.length} student{students.length > 1 ? "s" : ""})</span><span>${FIRST_MONTH * students.length}</span></div>
                <div className="border-t border-[#A8A9AD]/20 mt-3 pt-3 flex justify-between font-bold text-lg"><span>Total Due Today</span><span className="text-[#C9A84C]">${total}</span></div>
              </div>
              <div className="space-y-4">
                <div><label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Cardholder Name</label><input value={card.name} onChange={e => setCard({ ...card, name: e.target.value })} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-3 text-lg focus:border-[#C9A84C] focus:outline-none" /></div>
                <div><label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Card Number</label><div className="relative"><CreditCard size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A8A9AD]" /><input value={card.number} onChange={e => setCard({ ...card, number: e.target.value })} placeholder="0000 0000 0000 0000" className="w-full bg-transparent border border-[#A8A9AD]/30 pl-12 pr-4 py-3 text-lg focus:border-[#C9A84C] focus:outline-none" /></div></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Expiry</label><input value={card.expiry} onChange={e => setCard({ ...card, expiry: e.target.value })} placeholder="MM/YY" className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-3 text-lg focus:border-[#C9A84C] focus:outline-none" /></div>
                  <div><label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">CVC</label><input value={card.cvc} onChange={e => setCard({ ...card, cvc: e.target.value })} placeholder="123" className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-3 text-lg focus:border-[#C9A84C] focus:outline-none" /></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between p-6 border-t border-[#A8A9AD]/10">
        <button onClick={prevStep} disabled={step === 1} className="flex items-center gap-2 px-6 py-4 border border-[#A8A9AD]/30 text-sm font-medium text-[#A8A9AD] hover:text-white disabled:opacity-30 transition-colors"><ChevronLeft size={18} /> Back</button>
        {step < 5 ? (
          <button onClick={nextStep} className="flex items-center gap-2 px-8 py-4 bg-[#C9A84C] text-black font-bold text-sm tracking-wide uppercase hover:bg-[#E0C97A] transition-colors">Next <ChevronRight size={18} /></button>
        ) : (
          <button onClick={handleSubmit} disabled={submitting} className="flex items-center gap-2 px-8 py-4 bg-[#C9A84C] text-black font-bold text-sm tracking-wide uppercase hover:bg-[#E0C97A] transition-colors disabled:opacity-50">{submitting ? <><Loader2 size={18} className="animate-spin" /> Processing...</> : `Pay $${total} & Register`}</button>
        )}
      </div>
    </div>
  );
}