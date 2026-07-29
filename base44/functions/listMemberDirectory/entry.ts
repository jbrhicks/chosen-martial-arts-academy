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

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Authenticated members may see a public directory (no secrets / medical / tokens).
    const all = await base44.asServiceRole.entities.User.list().catch(() => []);

    // Defense-in-depth for parental controls: a minor whose guardian has not
    // enabled member direct messages may only see admins in the directory.
    const callerIsMinor = computeIsMinor(user.dob);
    if (callerIsMinor) {
      const settings = await base44.asServiceRole.entities.StudentAccessSettings
        .filter({ student_id: user.id })
        .catch(() => []);
      const s = settings[0];
      const allowDMs = s && s.allow_member_direct_messages && !s.admin_locked;
      if (!allowDMs) {
        const admins = all
          .filter((u: Record<string, unknown>) => u.role === 'admin' && u.is_active !== false)
          .map((u: Record<string, unknown>) => ({
            id: u.id,
            full_name: u.full_name,
            belt_rank: u.belt_rank,
            profile_photo: u.profile_photo,
            role: u.role,
          }));
        return Response.json({ success: true, users: admins });
      }
    }

    const directory = all
      .filter((u: Record<string, unknown>) =>
        (u.role === 'student' || u.role === 'user' || u.role === 'guest') &&
        u.is_active !== false
      )
      .map((u: Record<string, unknown>) => ({
        id: u.id,
        full_name: u.full_name,
        belt_rank: u.belt_rank,
        profile_photo: u.profile_photo,
        role: u.role,
      }));

    return Response.json({ success: true, users: directory });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});