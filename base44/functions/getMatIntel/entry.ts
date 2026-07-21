import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Only instructors or admins can access mat intel
    if (!user.is_instructor && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const classFilter = body.class_name || null;

    // Get today's attendance records
    const todayStr = new Date().toISOString().split('T')[0];
    const allAttendance = await base44.asServiceRole.entities.AttendanceRecord.list('-check_in_date', 500).catch(() => []);
    const todayAtt = allAttendance.filter((a: Record<string, unknown>) => {
      if (!a.check_in_date) return false;
      return new Date(a.check_in_date as string).toISOString().split('T')[0] === todayStr;
    });

    const relevantAtt = classFilter
      ? todayAtt.filter((a: Record<string, unknown>) => a.class_name === classFilter)
      : todayAtt;

    // Fetch all users for attendee info
    const allUsers = await base44.asServiceRole.entities.User.list().catch(() => []);
    const userMap: Record<string, Record<string, unknown>> = {};
    allUsers.forEach((u: Record<string, unknown>) => { userMap[u.id as string] = u; });

    // Fetch today's pending flags
    const allFlags = await base44.asServiceRole.entities.InstructorStudentFlag.filter({ status: 'pending' }).catch(() => []);
    const todayFlags = allFlags.filter((f: Record<string, unknown>) => {
      if (!f.created_date) return false;
      return new Date(f.created_date as string).toISOString().split('T')[0] === todayStr;
    });

    const now = new Date();
    const todayMonth = now.getMonth();
    const todayDate = now.getDate();

    const flagsByStudent: Record<string, Record<string, unknown>[]> = {};
    todayFlags.forEach((f: Record<string, unknown>) => {
      const sid = f.student_id as string;
      if (!flagsByStudent[sid]) flagsByStudent[sid] = [];
      flagsByStudent[sid].push(f);
    });

    const roster = relevantAtt.map((att: Record<string, unknown>) => {
      const u = userMap[att.user_id as string];
      const alerts: Array<{ type: string; label: string }> = [];

      if (u) {
        // Birthday alert
        if (u.dob) {
          const dob = new Date(u.dob as string);
          if (dob.getMonth() === todayMonth && dob.getDate() === todayDate) {
            alerts.push({ type: 'birthday', label: 'Birthday today!' });
          }
        }

        // Injury alert from medical conditions
        if (u.medical_conditions) {
          alerts.push({ type: 'injury', label: 'Medical condition on file' });
        }

        // Trial student alert
        if (u.role === 'guest' || u.subscription_status === 'none') {
          alerts.push({ type: 'trial', label: 'Trial student' });
        }
      }

      // Instructor-submitted flags
      const studentFlags = flagsByStudent[att.user_id as string] || [];
      studentFlags.forEach((f: Record<string, unknown>) => {
        const fType = f.flag_type as string;
        const existing = alerts.find(a => a.type === fType);
        if (!existing) {
          const labelMap: Record<string, string> = {
            ready_to_test: 'Ready to test',
            needs_help: f.notes as string || 'Needs help',
            behavior: f.notes as string || 'Behavior note',
            injury: f.notes as string || 'Injury flagged',
          };
          alerts.push({ type: fType, label: labelMap[fType] || 'Flagged' });
        }
      });

      return {
        user_id: u?.id || att.user_id,
        full_name: u?.full_name || att.user_name,
        belt_rank: u?.belt_rank || '',
        profile_photo: u?.profile_photo || '',
        class_name: att.class_name,
        check_in_time: att.check_in_date,
        alerts,
      };
    });

    // Get today's classes for the filter dropdown
    const todayWeekday = now.toLocaleDateString('en-US', { weekday: 'long' });
    const todayClasses = await base44.asServiceRole.entities.ClassSchedule.filter({ is_active: true, day_of_week: todayWeekday }).catch(() => []);

    return Response.json({
      success: true,
      roster,
      classes: todayClasses.sort((a: Record<string, unknown>, b: Record<string, unknown>) =>
        String(a.start_time || '').localeCompare(String(b.start_time || ''))
      ),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});