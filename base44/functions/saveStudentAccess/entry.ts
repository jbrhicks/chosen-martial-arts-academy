import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Computes minor status from a date of birth (under 18 = minor).
function computeIsMinor(dob) {
  if (!dob) return false;
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return false;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) age--;
  return age < 18;
}

// Saves a student's access-control settings.
// Only a family guardian (same family_id, family_role !== "student") or an admin
// may save. The service role is used so RLS on the entity (admin-only writes)
// does not block legitimate guardian saves. Only admins may set admin_locked.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const caller = await base44.auth.me().catch(() => null);
    if (!caller) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { studentId, allowCommunity, allowMemberDirectMessages, adminLocked } = body || {};
    if (!studentId) return Response.json({ error: 'studentId is required' }, { status: 400 });

    const student = await base44.asServiceRole.entities.User.get(studentId).catch(() => null);
    if (!student) return Response.json({ error: 'Student not found' }, { status: 404 });

    const callerIsAdmin = caller.role === 'admin';
    const callerIsGuardian =
      !!student.family_id &&
      caller.family_id === student.family_id &&
      caller.family_role !== 'student';

    if (!callerIsAdmin && !callerIsGuardian) {
      return Response.json(
        { error: 'Only a family guardian or an admin may manage access settings' },
        { status: 403 }
      );
    }

    const isMinor = computeIsMinor(student.dob);

    const existing = await base44.asServiceRole.entities.StudentAccessSettings
      .filter({ student_id: studentId })
      .catch(() => []);
    const record = existing[0];

    // Honor the admin lock: once an admin locks a student's settings,
    // guardians may not change them until the admin lifts the lock.
    if (record?.admin_locked && !callerIsAdmin) {
      return Response.json(
        { error: 'These access settings are locked by an administrator. Please contact the front desk.' },
        { status: 403 }
      );
    }

    const payload = {
      student_id: studentId,
      student_name: student.full_name || '',
      family_id: student.family_id || '',
      is_minor: isMinor,
      allow_community: !!allowCommunity,
      allow_member_direct_messages: !!allowMemberDirectMessages,
      set_by_guardian_id: caller.id,
      set_by_guardian_name: caller.full_name || '',
    };

    // Only admins may set or change the admin lock override.
    if (callerIsAdmin) {
      payload.admin_locked = adminLocked !== undefined ? !!adminLocked : (record?.admin_locked || false);
    } else if (record) {
      payload.admin_locked = record.admin_locked || false;
    }

    let saved;
    if (record) {
      saved = await base44.asServiceRole.entities.StudentAccessSettings.update(record.id, payload);
    } else {
      saved = await base44.asServiceRole.entities.StudentAccessSettings.create(payload);
    }

    return Response.json({ success: true, settings: saved });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});