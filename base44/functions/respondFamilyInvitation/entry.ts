import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const caller = await base44.auth.me().catch(() => null);
    if (!caller) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const invitation_id = body.invitation_id;
    const action = body.action === 'decline' ? 'decline' : 'accept';

    if (!invitation_id) {
      return Response.json({ error: 'invitation_id is required' }, { status: 400 });
    }

    const invitation = await base44.asServiceRole.entities.FamilyInvitation.get(invitation_id).catch(() => null);
    if (!invitation) return Response.json({ error: 'Invitation not found' }, { status: 404 });

    // Only the invitee can respond to their own invitation
    if (invitation.invitee_id !== caller.id && caller.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (invitation.status !== 'pending') {
      return Response.json({ error: 'This invitation has already been responded to' }, { status: 400 });
    }

    if (action === 'decline') {
      await base44.asServiceRole.entities.FamilyInvitation.update(invitation_id, {
        status: 'declined',
        responded_date: new Date().toISOString(),
      });
      return Response.json({ success: true, action: 'declined' });
    }

    // Accept: verify the user doesn't already have a family
    if (caller.family_id) {
      return Response.json({ error: 'You are already in a family group' }, { status: 400 });
    }

    // Link the user to the family with the proposed role
    await base44.asServiceRole.entities.User.update(caller.id, {
      family_id: invitation.family_id,
      family_role: invitation.proposed_role,
    });
    await base44.auth.updateMe({
      family_id: invitation.family_id,
      family_role: invitation.proposed_role,
    });

    await base44.asServiceRole.entities.FamilyInvitation.update(invitation_id, {
      status: 'accepted',
      responded_date: new Date().toISOString(),
    });

    // Notify the inviter that the invitation was accepted
    await base44.asServiceRole.functions.invoke("createNotification", {
      recipient_type: "user",
      recipient_id: invitation.inviter_id,
      notification_type: "announcement",
      preview_text: `${caller.full_name} accepted your invitation to join the ${invitation.family_name}.`,
      target_type: "none",
      sender_name: caller.full_name,
    });

    return Response.json({
      success: true,
      action: 'accepted',
      family_id: invitation.family_id,
      family_role: invitation.proposed_role,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}