import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { hashPin } from '../../shared/pinHash.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { token, pin } = body;

    if (!token) return Response.json({ error: "Token is required" }, { status: 400 });

    // 1. Check if a User has this activation token (existing user — e.g., resend activation)
    const users = await base44.asServiceRole.entities.User.filter({ activation_token: token });
    if (users.length > 0) {
      const user = users[0];

      // Check token expiration
      if (user.token_expiration) {
        const expiration = new Date(user.token_expiration);
        if (expiration < new Date()) {
          return Response.json({ valid: false, reason: "expired", email: user.email });
        }
      }

      // No PIN — return verification status
      if (!pin) {
        return Response.json({
          valid: true,
          first_name: user.full_name ? user.full_name.split(" ")[0] : "there",
          email: user.email,
          needs_registration: false,
        });
      }

      // PIN provided — activate the account
      if (!/^\d{4}$/.test(pin)) {
        return Response.json({ error: "PIN must be exactly 4 digits" }, { status: 400 });
      }

      const hashedPin = await hashPin(pin, user.id);
      await base44.asServiceRole.entities.User.update(user.id, {
        pin_code: hashedPin,
        account_status: "active",
        activation_token: "",
        token_expiration: "",
      });

      // Sync role based on billing
      try {
        const billingRecords = await base44.asServiceRole.entities.BillingRecord
          .filter({ family_id: user.family_id || '___none___' })
          .catch(() => []);
        const emailBilling = await base44.asServiceRole.entities.BillingRecord
          .filter({ user_email: user.email })
          .catch(() => []);
        const allBilling = [...billingRecords, ...emailBilling.filter(eb => !billingRecords.some(b => b.id === eb.id))];
        const hasActive = allBilling.some((b: any) => b.status === 'active');
        const newRole = hasActive ? 'student' : 'guest';
        const newSubStatus = hasActive ? 'active' : 'none';
        if (user.role !== 'admin') {
          await base44.asServiceRole.entities.User.update(user.id, { role: newRole, subscription_status: newSubStatus });
        }
      } catch (e) {
        console.error('Role sync failed:', e);
      }

      return Response.json({ success: true, email: user.email });
    }

    // 2. No User found — check PendingInvitation (new user who hasn't registered yet)
    const invitations = await base44.asServiceRole.entities.PendingInvitation.filter({ token, status: "pending" });
    if (invitations.length === 0) {
      return Response.json({ valid: false, reason: "invalid" });
    }

    const invitation = invitations[0];

    // Check token expiration
    if (invitation.token_expiration) {
      const expiration = new Date(invitation.token_expiration);
      if (expiration < new Date()) {
        await base44.asServiceRole.entities.PendingInvitation.update(invitation.id, { status: "expired" });
        return Response.json({ valid: false, reason: "expired", email: invitation.email });
      }
    }

    // No PIN — return invitation info (user needs to register first)
    if (!pin) {
      return Response.json({
        valid: true,
        first_name: invitation.first_name || "there",
        email: invitation.email,
        role: invitation.role,
        needs_registration: true,
      });
    }

    // PIN provided — user should have registered by now via the frontend register flow
    if (!/^\d{4}$/.test(pin)) {
      return Response.json({ error: "PIN must be exactly 4 digits" }, { status: 400 });
    }

    // Find the user record (created by register + verifyOtp)
    const registeredUsers = await base44.asServiceRole.entities.User.filter({ email: invitation.email });
    if (registeredUsers.length === 0) {
      return Response.json({ error: "Please complete the email verification step first" }, { status: 400 });
    }

    const registeredUser = registeredUsers[0];

    // Set PIN, belt rank, and activate the account
    const hashedPin = await hashPin(pin, registeredUser.id);
    await base44.asServiceRole.entities.User.update(registeredUser.id, {
      pin_code: hashedPin,
      account_status: "active",
      belt_rank: invitation.belt_rank || registeredUser.belt_rank,
      activation_token: "",
      token_expiration: "",
    });

    // Set role from the invitation (only if not already admin)
    if (invitation.role && registeredUser.role !== 'admin') {
      await base44.asServiceRole.entities.User.update(registeredUser.id, { role: invitation.role });
    }

    // Mark the invitation as used
    await base44.asServiceRole.entities.PendingInvitation.update(invitation.id, { status: "used" });

    return Response.json({ success: true, email: invitation.email });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});