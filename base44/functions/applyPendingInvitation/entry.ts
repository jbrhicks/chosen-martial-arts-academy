import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { hashPin } from '../../shared/pinHash.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { email, pin } = body;

    if (!email) return Response.json({ error: "Email is required" }, { status: 400 });

    // Find any pending invitation for this email
    const invitations = await base44.asServiceRole.entities.PendingInvitation.filter({ email, status: "pending" });
    if (invitations.length === 0) {
      return Response.json({ success: false, message: "No pending invitation found" });
    }

    const invitation = invitations[0];

    // Find the user who just registered
    const users = await base44.asServiceRole.entities.User.filter({ email });
    if (users.length === 0) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const user = users[0];

    // Apply role and belt rank from the invitation
    const updates: any = {};
    if (invitation.role && user.role !== 'admin') {
      updates.role = invitation.role;
    }
    if (invitation.belt_rank) {
      updates.belt_rank = invitation.belt_rank;
    }
    updates.account_status = "active";

    // Set PIN if provided
    if (pin && /^\d{4}$/.test(pin)) {
      updates.pin_code = await hashPin(pin, user.id);
    }

    if (Object.keys(updates).length > 0) {
      await base44.asServiceRole.entities.User.update(user.id, updates);
    }

    // Mark the invitation as used
    await base44.asServiceRole.entities.PendingInvitation.update(invitation.id, { status: "used" });

    return Response.json({ success: true, role: invitation.role, belt_rank: invitation.belt_rank });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});