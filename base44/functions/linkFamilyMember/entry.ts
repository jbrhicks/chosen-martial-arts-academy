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

    // Check for an existing pending invitation to avoid duplicates
    const existingInv = await base44.asServiceRole.entities.FamilyInvitation.filter({
      invitee_id: target.id,
      family_id: familyId,
      status: 'pending',
    }).catch(() => []);
    if (existingInv.length > 0) {
      return Response.json({ error: 'An invitation has already been sent to this user' }, { status: 400 });
    }

    // Create a pending invitation — the target user MUST consent before being
    // linked. This prevents a guardian from silently attaching another user
    // (and gaining read access to their private data) without consent.
    await base44.asServiceRole.entities.FamilyInvitation.create({
      family_id: familyId,
      family_name: family.family_name,
      inviter_id: caller.id,
      inviter_name: caller.full_name,
      invitee_id: target.id,
      invitee_email: target.email,
      proposed_role: familyRole,
      status: 'pending',
    });

    // Notify the target user about the pending invitation
    await base44.asServiceRole.functions.invoke("createNotification", {
      recipient_type: "user",
      recipient_id: target.id,
      notification_type: "announcement",
      preview_text: `${caller.full_name} invited you to join the ${family.family_name} family. Go to Family to accept.`,
      target_type: "none",
      sender_name: caller.full_name,
    });

    return Response.json({
      success: true,
      invitation_sent: true,
      message: `Invitation sent to ${target.full_name || target.email}. They must accept it before being added to your family.`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});