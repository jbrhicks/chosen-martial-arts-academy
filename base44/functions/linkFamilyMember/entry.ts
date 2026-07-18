import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const caller = await base44.auth.me().catch(() => null);
    if (!caller) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const email = String(body.email || '').trim().toLowerCase();
    const familyRole = body.family_role === 'secondary_guardian' ? 'secondary_guardian' : 'student';
    const familyId = body.family_id || caller.family_id;

    if (!email || !familyId) {
      return Response.json({ error: 'email and family_id are required' }, { status: 400 });
    }

    const family = await base44.asServiceRole.entities.FamilyGroup.get(familyId).catch(() => null);
    if (!family) return Response.json({ error: 'Family not found' }, { status: 404 });

    const isPrimary = family.primary_contact_id === caller.id || caller.family_role === 'primary_guardian';
    if (!isPrimary && caller.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (caller.role !== 'admin' && caller.family_id !== familyId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const users = await base44.asServiceRole.entities.User.filter({ email }).catch(() => []);
    if (users.length === 0) {
      return Response.json({ error: 'No user found with that email' }, { status: 404 });
    }
    const target = users[0];
    if (target.family_id) {
      return Response.json({ error: 'This user is already in a family group' }, { status: 400 });
    }

    await base44.asServiceRole.entities.User.update(target.id, {
      family_id: familyId,
      family_role: familyRole,
    });

    return Response.json({
      success: true,
      user: { id: target.id, full_name: target.full_name, email: target.email },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
