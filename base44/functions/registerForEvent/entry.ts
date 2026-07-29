import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { event_id, is_guest, student_ids, guest_info, custom_field_answers = [], waiver_agreed } = body;

    if (!event_id) return Response.json({ error: 'event_id is required' }, { status: 400 });

    // Fetch event server-side (bypasses RLS so guests can register for public events)
    const event = await base44.asServiceRole.entities.Event.get(event_id).catch(() => null);
    if (!event) return Response.json({ error: 'Event not found' }, { status: 404 });
    if (event.status === 'cancelled') return Response.json({ error: 'This event has been cancelled' }, { status: 400 });

    // Require waiver agreement if the event has a linked waiver
    if (event.linked_waiver_id && !waiver_agreed) {
      return Response.json({ error: 'Waiver agreement is required' }, { status: 400 });
    }

    // --- Member registration: authenticate and verify family membership ---
    let user = null;
    let familyMembers = null;

    if (!is_guest) {
      user = await base44.auth.me().catch(() => null);
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      if (!student_ids || !student_ids.length) {
        return Response.json({ error: 'Select at least one student' }, { status: 400 });
      }
      // Resolve family members and verify every selected student belongs to the caller's family
      familyMembers = user.family_id
        ? await base44.asServiceRole.entities.User.filter({ family_id: user.family_id })
        : [user];
      const familyIds = new Set(familyMembers.map(m => m.id));
      for (const sid of student_ids) {
        if (!familyIds.has(sid)) {
          return Response.json({ error: 'Not authorized for all selected students' }, { status: 403 });
        }
      }
    } else {
      // Guest registration — validate required fields
      if (!guest_info || !guest_info.student_name || !guest_info.parent_name || !guest_info.email) {
        return Response.json({ error: 'Missing required guest information' }, { status: 400 });
      }
    }

    // --- Server-side capacity check (atomic count of active registrations) ---
    const existingRegs = await base44.asServiceRole.entities.EventRegistration.filter({ event_id });
    const activeCount = existingRegs.filter(r => r.status === 'registered' || r.status === 'checked-in').length;
    const waitlistCount = existingRegs.filter(r => r.status === 'waitlisted').length;
    const maxCapacity = event.max_capacity || 0;

    // --- Fetch pricing rules server-side (client-supplied values are untrusted) ---
    const pricingRules = await base44.asServiceRole.entities.EventPricingRule
      .filter({ event_id, is_active: true }).catch(() => []);
    const siblingRule = pricingRules.find(r => r.discount_type === 'sibling');
    const memberRule = pricingRules.find(r => r.discount_type === 'member');

    // --- Build the list of students to register ---
    const studentsToRegister = is_guest
      ? [{ id: null, full_name: guest_info.student_name, belt_rank: guest_info.belt_rank || 'N/A' }]
      : student_ids.map(id => {
          const m = familyMembers.find(m => m.id === id);
          return { id, full_name: m?.full_name || user.full_name, belt_rank: m?.belt_rank || '' };
        });

    // --- Calculate pricing (only members get sibling/member discounts) ---
    const basePrice = event.price || 0;
    let totalPrice = basePrice * studentsToRegister.length;
    if (!is_guest && studentsToRegister.length > 1 && siblingRule) {
      const discountPerSibling = siblingRule.is_percentage
        ? basePrice * (siblingRule.amount / 100)
        : siblingRule.amount;
      totalPrice -= discountPerSibling * (studentsToRegister.length - 1);
    }
    if (!is_guest && memberRule) {
      const memberDiscount = memberRule.is_percentage
        ? totalPrice * (memberRule.amount / 100)
        : memberRule.amount * studentsToRegister.length;
      totalPrice -= memberDiscount;
    }
    totalPrice = Math.max(0, totalPrice);
    const perStudentAmount = studentsToRegister.length > 0 ? totalPrice / studentsToRegister.length : 0;

    // --- Create registrations with server-determined status (registered vs waitlisted) ---
    const registrations = [];
    for (let i = 0; i < studentsToRegister.length; i++) {
      const s = studentsToRegister[i];
      const seatIndex = activeCount + i;
      const isFull = maxCapacity > 0 && seatIndex >= maxCapacity;
      const ticketHash = `${event_id}-${is_guest ? 'guest' : s.id}-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`;

      const reg = await base44.asServiceRole.entities.EventRegistration.create({
        event_id,
        event_title: event.title,
        event_date: event.start_date,
        user_id: is_guest ? null : user.id,
        user_name: is_guest ? guest_info.parent_name : user.full_name,
        user_email: is_guest ? guest_info.email : user.email,
        family_id: is_guest ? null : (user.family_id || null),
        student_id: is_guest ? null : s.id,
        student_name: s.full_name,
        student_belt_rank: s.belt_rank,
        payment_status: basePrice > 0 ? 'pending' : 'paid',
        amount_paid: perStudentAmount,
        registration_date: new Date().toISOString(),
        status: isFull ? 'waitlisted' : 'registered',
        waitlist_position: isFull ? (waitlistCount + i + 1) : null,
        is_guest: !!is_guest,
        ticket_qr_hash: ticketHash,
      });
      registrations.push(reg);

      // Save custom field answers
      for (const ans of custom_field_answers) {
        if (ans.value !== undefined && ans.value !== null && String(ans.value).trim() !== '') {
          const answerValue = Array.isArray(ans.value) ? ans.value.join(', ') : String(ans.value);
          await base44.asServiceRole.entities.EventRegistrationAnswer.create({
            registration_id: reg.id,
            field_id: ans.field_id,
            question_text: ans.question_text || '',
            answer_value: answerValue,
          });
        }
      }
    }

    const anyWaitlisted = registrations.some(r => r.status === 'waitlisted');
    const studentNames = studentsToRegister.map(s => s.full_name).join(', ');
    const recipientEmail = is_guest ? guest_info.email : user.email;
    const recipientName = is_guest ? guest_info.parent_name : user.full_name;

    // --- Send confirmation email ---
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: recipientEmail,
        subject: `Event Registration: ${event.title}`,
        body: `Hi ${recipientName},\n\nYou've been registered for ${event.title}!\n\nStudent(s): ${studentNames}\nDate: ${new Date(event.start_date).toLocaleDateString()}\n${event.location ? `Location: ${event.location}\n` : ''}Total: $${totalPrice.toFixed(2)}${anyWaitlisted ? "\n\nYou have been added to the waitlist. We'll notify you if a spot opens up." : ""}${event.what_to_bring ? `\n\nWhat to bring: ${event.what_to_bring}\n` : ""}\nWe look forward to seeing you there!\n\n- Chosen Martial Arts Academy`,
      });
    } catch (e) {
      console.error('Confirmation email failed:', e);
    }

    return Response.json({
      success: true,
      registrations: registrations.map(r => ({ id: r.id, status: r.status, waitlist_position: r.waitlist_position })),
      total_price: totalPrice,
      any_waitlisted: anyWaitlisted,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}