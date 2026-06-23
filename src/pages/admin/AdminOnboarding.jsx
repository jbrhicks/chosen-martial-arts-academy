import { useState } from "react";
import { base44 } from "@/api/base44Client";
import StepIndicator from "@/components/admin/onboarding/StepIndicator";
import StepContact from "@/components/admin/onboarding/StepContact";
import StepEmergency from "@/components/admin/onboarding/StepEmergency";
import StepProgram from "@/components/admin/onboarding/StepProgram";
import StepWaiver from "@/components/admin/onboarding/StepWaiver";
import StepBilling from "@/components/admin/onboarding/StepBilling";
import StepConfirmation from "@/components/admin/onboarding/StepConfirmation";
import { ChevronLeft, ChevronRight } from "lucide-react";

const STEPS = ["Contact", "Emergency", "Programs", "Waiver", "Billing"];

const createEmptyMember = () => ({
  firstName: "", lastName: "", dob: "", email: "", phone: "", address: "",
  beltSize: "", uniformSize: "", medicalConditions: "", beltRank: "White",
  emergencyContact: { name: "", relationship: "", phone: "", altPhone: "" },
  programs: [], startDate: "",
  customFields: {},
});

const defaultBilling = {
  registrationFee: 75, firstMonthTuition: 120, equipmentPackage: 0,
  autoPay: true, monthlyAmount: 120, billingCycle: "1st", billingCycleDate: 1,
  paymentType: "credit_card", cardName: "", cardNumber: "", cardExpiry: "", cardCvc: "",
  achName: "", achAccount: "", achRouting: "",
  prorateEnabled: true, siblingDiscountEnabled: true, payInFull: false,
  appliedDiscountId: "", splitBillingEnabled: false, splitRatioA: 50,
  secondPaymentType: "credit_card", secondCardName: "", secondCardNumber: "", secondCardExpiry: "", secondCardCvc: "",
  secondAchName: "", secondAchAccount: "", secondAchRouting: "",
};

const defaultHousehold = {
  splitEnabled: false, secondaryAddress: "", secondaryContactName: "",
  secondaryContactPhone: "", custodyNotes: "", sendToBothHouseholds: true,
};

export default function AdminOnboarding() {
  const [step, setStep] = useState(1);
  const [members, setMembers] = useState([createEmptyMember()]);
  const [billing, setBilling] = useState(defaultBilling);
  const [household, setHousehold] = useState(defaultHousehold);
  const [waiverSigned, setWaiverSigned] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState(null);

  const updateMember = (index, field, value) => {
    setMembers(members.map((m, i) => i === index ? { ...m, [field]: value } : m));
  };

  const updateHousehold = (field, value) => {
    setHousehold({ ...household, [field]: value });
  };

  const updateEmergencyContact = (index, field, value) => {
    setMembers(members.map((m, i) => i === index ? { ...m, emergencyContact: { ...m.emergencyContact, [field]: value } } : m));
  };

  const toggleProgram = (index, program) => {
    setMembers(members.map((m, i) => {
      if (i !== index) return m;
      const programs = m.programs.includes(program)
        ? m.programs.filter(p => p !== program)
        : [...m.programs, program];
      return { ...m, programs };
    }));
  };

  const addMember = () => setMembers([...members, createEmptyMember()]);
  const removeMember = (index) => setMembers(members.filter((_, i) => i !== index));

  const validateStep = (stepNum) => {
    if (stepNum === 1) {
      for (const m of members) {
        if (!m.firstName || !m.lastName || !m.email) {
          alert("Please fill in first name, last name, and email for all members.");
          return false;
        }
      }
    }
    if (stepNum === 2) {
      for (const m of members) {
        if (!m.emergencyContact.name || !m.emergencyContact.phone) {
          alert("Please fill in emergency contact name and phone for all members.");
          return false;
        }
      }
    }
    if (stepNum === 3) {
      for (const m of members) {
        if (m.programs.length === 0 || !m.startDate) {
          alert("Please select at least one program and a start date for all members.");
          return false;
        }
      }
    }
    if (stepNum === 4 && !waiverSigned) {
      alert("The waiver must be signed before proceeding.");
      return false;
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(step)) setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // 1. Create FamilyGroup
      const familyCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const familyGroup = await base44.entities.FamilyGroup.create({
        family_name: `${members[0].lastName || "New"} Family`,
        primary_contact_id: "",
        billing_status: "active",
        cc_emails: members.map(m => m.email).filter(Boolean).join(", "),
        cc_phones: members.map(m => m.phone).filter(Boolean).join(", "),
        invite_code: familyCode,
        secondary_household_address: household.splitEnabled ? household.secondaryAddress : "",
        secondary_contact_name: household.splitEnabled ? household.secondaryContactName : "",
        secondary_contact_phone: household.splitEnabled ? household.secondaryContactPhone : "",
        custody_notes: household.splitEnabled ? household.custodyNotes : "",
        split_billing_enabled: household.splitEnabled,
        send_to_both_households: household.splitEnabled ? household.sendToBothHouseholds : true,
      });

      // 2. Invite each member and generate activation token
      for (const member of members) {
        if (member.email) {
          try { await base44.users.inviteUser(member.email, "user"); } catch (e) { console.error("Invite failed for", member.email, e); }
          try {
            await base44.functions.invoke("generateActivationToken", { email: member.email, first_name: member.firstName });
          } catch (e) { console.error("Activation email failed for", member.email, e); }
        }
      }

      // 3. Create EmergencyContact records
      for (const member of members) {
        if (member.emergencyContact.name) {
          await base44.entities.EmergencyContact.create({
            user_email: member.email,
            contact_name: member.emergencyContact.name,
            relationship: member.emergencyContact.relationship,
            phone: member.emergencyContact.phone,
            alt_phone: member.emergencyContact.altPhone,
          });
        }
      }

      // 4. Create Enrollment records
      const allPrograms = await base44.entities.Program.list();
      const allTiers = await base44.entities.SubscriptionTier.list();
      for (const member of members) {
        for (const programName of member.programs) {
          const prog = allPrograms.find(p => p.program_name === programName);
          const defaultTier = prog ? allTiers.filter(t => t.linked_program_id === prog.id && t.is_active !== false).sort((a, b) => (a.display_order || 0) - (b.display_order || 0))[0] : null;
          await base44.entities.Enrollment.create({
            user_email: member.email,
            user_name: `${member.firstName} ${member.lastName}`,
            program: programName,
            program_id: prog?.id || "",
            start_date: member.startDate,
            status: "active",
            custom_fields_data: member.customFields ? JSON.stringify(member.customFields) : "",
            linked_tier_id: defaultTier?.id || "",
            locked_in_price: defaultTier?.price || 0,
          });
        }
      }

      // 5. Calculate proration
      const startDate = members[0]?.startDate;
      let proratedAmount = 0;
      if (startDate && billing.prorateEnabled) {
        const d = new Date(startDate);
        const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
        proratedAmount = (billing.monthlyAmount / daysInMonth) * (daysInMonth - d.getDate() + 1);
      }

      // 6. Create BillingRecord(s)
      if (billing.autoPay && billing.monthlyAmount > 0) {
        const nextDate = new Date();
        const day = billing.billingCycleDate || 1;
        nextDate.setDate(day);
        if (nextDate < new Date()) nextDate.setMonth(nextDate.getMonth() + 1);
        const billingCycleLabel = day === 1 ? "1st" : day === 15 ? "15th" : "custom";

        if (billing.splitBillingEnabled) {
          const ratioA = billing.splitRatioA || 50;
          for (const ratio of [ratioA, 100 - ratioA]) {
            await base44.entities.BillingRecord.create({
              family_id: familyGroup.id,
              recurring_amount: billing.monthlyAmount * ratio / 100,
              billing_cycle: billingCycleLabel,
              billing_cycle_date: day,
              next_billing_date: nextDate.toISOString().split("T")[0],
              payment_type: billing.paymentType,
              status: "active",
              prorated_initial_amount: proratedAmount * ratio / 100,
              applied_discount_id: billing.appliedDiscountId || "",
              split_billing_enabled: true,
              split_billing_ratio: `${ratioA}/${100 - ratioA}`,
            });
          }
        } else {
          await base44.entities.BillingRecord.create({
            family_id: familyGroup.id,
            recurring_amount: billing.monthlyAmount,
            billing_cycle: billingCycleLabel,
            billing_cycle_date: day,
            next_billing_date: nextDate.toISOString().split("T")[0],
            payment_type: billing.paymentType,
            status: "active",
            prorated_initial_amount: proratedAmount,
            applied_discount_id: billing.appliedDiscountId || "",
            split_billing_enabled: false,
          });
        }
      }

      // 7. Create Payment record for one-time charges
      const annualAmount = (billing.monthlyAmount || 0) * 12;
      const payInFullDiscount = billing.payInFull ? annualAmount * 0.10 : 0;
      const tuitionAmount = billing.payInFull ? annualAmount - payInFullDiscount : (billing.prorateEnabled ? proratedAmount : (billing.firstMonthTuition || 0));
      const siblingDiscount = members.length > 1 && billing.siblingDiscountEnabled ? (billing.monthlyAmount * 0.10) * (members.length - 1) : 0;
      const totalDue = Math.max(0, (billing.registrationFee || 0) + tuitionAmount + (billing.equipmentPackage || 0) - siblingDiscount);
      if (totalDue > 0) {
        await base44.entities.Payment.create({
          user_id: "admin_onboarding",
          user_name: `${members[0].firstName} ${members[0].lastName}`,
          amount: totalDue,
          payment_type: "subscription",
          description: `New student onboarding: ${members.length} member(s)`,
          status: "succeeded",
          payment_date: new Date().toISOString(),
        });
      }

      // 8. Track discount redemption
      if (billing.appliedDiscountId) {
        try {
          await base44.entities.DiscountRedemption.create({
            discount_id: billing.appliedDiscountId,
            user_name: `${members[0].firstName} ${members[0].lastName}`,
            user_email: members[0].email,
            date_redeemed: new Date().toISOString(),
          });
        } catch (e) { console.error("Redemption tracking failed", e); }
      }

      setConfirmation({ familyGroup, members, totalDue });
    } catch (e) {
      alert("Failed to complete onboarding: " + e.message);
    }
    setSubmitting(false);
  };

  const reset = () => {
    setStep(1);
    setMembers([createEmptyMember()]);
    setBilling(defaultBilling);
    setHousehold(defaultHousehold);
    setWaiverSigned(false);
    setConfirmation(null);
  };

  if (confirmation) {
    return <StepConfirmation confirmation={confirmation} onReset={reset} />;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <p className="text-xs tracking-widest uppercase text-[#C9A84C] mb-2">New Student Registration</p>
        <h1 className="text-3xl font-bold">Onboarding Wizard</h1>
      </div>

      <StepIndicator currentStep={step} steps={STEPS} />

      <div className="mb-8">
        {step === 1 && <StepContact members={members} updateMember={updateMember} addMember={addMember} removeMember={removeMember} household={household} updateHousehold={updateHousehold} />}
        {step === 2 && <StepEmergency members={members} updateMember={updateMember} updateEmergencyContact={updateEmergencyContact} />}
        {step === 3 && <StepProgram members={members} updateMember={updateMember} toggleProgram={toggleProgram} />}
        {step === 4 && <StepWaiver waiverSigned={waiverSigned} setWaiverSigned={setWaiverSigned} />}
        {step === 5 && <StepBilling billing={billing} setBilling={setBilling} members={members} onSubmit={handleSubmit} submitting={submitting} />}
      </div>

      {/* Navigation */}
      {step < 5 ? (
        <div className="flex justify-between">
          <button onClick={prevStep} disabled={step === 1} className="flex items-center gap-2 px-5 py-3 border border-[#A8A9AD]/30 text-sm font-medium text-[#A8A9AD] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <ChevronLeft size={18} /> Back
          </button>
          <button onClick={nextStep} className="flex items-center gap-2 px-6 py-3 bg-[#C9A84C] text-black font-bold text-sm tracking-wide uppercase hover:bg-[#E0C97A] transition-colors">
            Next <ChevronRight size={18} />
          </button>
        </div>
      ) : (
        <div className="flex justify-start">
          <button onClick={prevStep} className="flex items-center gap-2 px-5 py-3 border border-[#A8A9AD]/30 text-sm font-medium text-[#A8A9AD] hover:text-white transition-colors">
            <ChevronLeft size={18} /> Back
          </button>
        </div>
      )}
    </div>
  );
}