import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    // Disabled in production unless explicitly enabled — fixed PIN "1234" is a known risk.
    if (Deno.env.get('ALLOW_CREATE_TEST_STUDENT') !== 'true') {
      return Response.json({ error: 'createTestStudent is disabled' }, { status: 403 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const email = "teststudent@chosenmaa.com";

    // Check if already exists
    const existing = await base44.asServiceRole.entities.User.filter({ email });
    if (existing.length > 0) {
      return Response.json({ error: 'Test student already exists', userId: existing[0].id });
    }

    // Invite
    await base44.users.inviteUser(email, "user");

    // Lookup with retry (invite is async)
    let testUser = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      await new Promise(r => setTimeout(r, 1500));
      const users = await base44.asServiceRole.entities.User.filter({ email });
      if (users.length > 0) { testUser = users[0]; break; }
    }
    if (!testUser) return Response.json({ error: 'User not found after invite' }, { status: 500 });

    // Update profile
    await base44.asServiceRole.entities.User.update(testUser.id, {
      role: "student",
      belt_rank: "White",
      dob: "2015-03-15",
      join_date: "2026-01-15",
      pin_code: "1234",
      family_role: "student",
      subscription_status: "active",
      is_active: true,
      phone: "555-123-4567",
      account_status: "active",
    });

    // Family
    const family = await base44.asServiceRole.entities.FamilyGroup.create({
      family_name: "Test Student Family",
      primary_contact_id: testUser.id,
      billing_status: "active",
    });
    await base44.asServiceRole.entities.User.update(testUser.id, { family_id: family.id });

    // Enrollment
    await base44.asServiceRole.entities.Enrollment.create({
      user_email: email,
      user_id: testUser.id,
      user_name: "Test Student",
      program: "Tang Soo Do (Youth)",
      program_id: "6a39eb76a361a002801a297d",
      belt_rank: "White",
      start_date: "2026-01-15",
      status: "active",
    });

    // Billing
    await base44.asServiceRole.entities.BillingRecord.create({
      family_id: family.id,
      user_email: email,
      recurring_amount: 120,
      billing_cycle: "1st",
      billing_cycle_date: 1,
      next_billing_date: "2026-07-01",
      payment_type: "credit_card",
      status: "active",
    });

    // Attendance
    const now = new Date();
    const attRecords = [];
    for (let i = 0; i < 8; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 3);
      attRecords.push({
        user_id: testUser.id,
        user_name: "Test Student",
        class_name: "Tang Soo Do (Youth) - Beginner",
        check_in_date: d.toISOString(),
        check_in_method: "QR",
      });
    }
    await base44.asServiceRole.entities.AttendanceRecord.bulkCreate(attRecords);

    // Payment method
    await base44.asServiceRole.entities.PaymentMethod.create({
      family_id: family.id,
      cardholder_name: "Test Student",
      card_brand: "Visa",
      last4: "4242",
      expiration_date: "2028-12-01",
      is_default: true,
    });

    // Progress
    const criteria = await base44.asServiceRole.entities.CurriculumCriteria.filter({ rank_id: "6a39edc97a2db3ae4f60bcee" });
    const progressRecords = criteria.slice(0, 3).map(c => ({
      student_id: testUser.id,
      student_name: "Test Student",
      criteria_id: c.id,
      criteria_title: c.title,
      rank_id: c.rank_id,
      status: "mastered",
      date_mastered: new Date().toISOString().split("T")[0],
    }));
    if (progressRecords.length > 0) {
      await base44.asServiceRole.entities.StudentCriteriaProgress.bulkCreate(progressRecords);
    }

    return Response.json({
      success: true,
      email,
      pin: "1234",
      belt: "White",
      program: "Tang Soo Do (Youth)",
      attendanceCreated: 8,
      progressCreated: progressRecords.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});