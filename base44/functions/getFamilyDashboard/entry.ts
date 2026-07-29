import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!user.family_id) return Response.json({ success: true, hasFamily: false, students: [], billing: [], actionItems: [] });

    const [family, members] = await Promise.all([
      base44.asServiceRole.entities.FamilyGroup.get(user.family_id).catch(() => null),
      base44.asServiceRole.entities.User.filter({ family_id: user.family_id }).catch(() => []),
    ]);

    const students = members.filter((m: Record<string, unknown>) => m.family_role === 'student');

    const studentData = await Promise.all(students.map(async (s: Record<string, unknown>) => {
      const [progress, flags, attendance, enrollments] = await Promise.all([
        base44.asServiceRole.entities.StudentProgress.filter({ user_id: s.id }).catch(() => []),
        base44.asServiceRole.entities.InstructorStudentFlag.filter({ student_id: s.id, status: 'pending' }).catch(() => []),
        base44.asServiceRole.entities.AttendanceRecord.filter({ user_id: s.id }).catch(() => []),
        base44.asServiceRole.entities.Enrollment.filter({ user_id: s.id }).catch(() => []),
      ]);
      return { ...s, progress, flags, attendance, enrollments };
    }));

    const billing = await base44.asServiceRole.entities.BillingRecord.filter({ family_id: user.family_id }).catch(() => []);
    const waivers = await base44.asServiceRole.entities.Waiver.filter({ is_active: true }).catch(() => []);

    // Aggregate action items
    const actionItems: Record<string, unknown>[] = [];
    studentData.forEach((s: Record<string, unknown>) => {
      (s.flags as Record<string, unknown>[]).forEach((f) => {
        const flagType = f.flag_type as string;
        actionItems.push({
          type: 'flag',
          severity: flagType === 'ready_to_test' ? 'success' : flagType === 'injury' ? 'danger' : 'warning',
          title: `${s.full_name}: ${flagType.replace(/_/g, ' ')}`,
          detail: f.notes || '',
          date: f.created_date,
        });
      });
    });
    billing.forEach((b: Record<string, unknown>) => {
      const status = b.status as string;
      if (status === 'past_due' || status === 'failed') {
        actionItems.push({
          type: 'billing',
          severity: 'danger',
          title: `Payment ${status.replace(/_/g, ' ')}`,
          detail: `$${b.recurring_amount} — next billing: ${b.next_billing_date || 'N/A'}`,
          date: b.next_billing_date,
        });
      }
    });

    return Response.json({
      success: true,
      hasFamily: true,
      family,
      members,
      students: studentData,
      billing,
      waivers,
      actionItems,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});