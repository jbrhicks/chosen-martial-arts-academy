import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { token, pin } = body;

    if (!token) return Response.json({ error: "Token is required" }, { status: 400 });

    // Find the user with this activation token
    const users = await base44.asServiceRole.entities.User.filter({ activation_token: token });
    if (users.length === 0) {
      return Response.json({ valid: false, reason: "invalid" });
    }
    const user = users[0];

    // Check if token is expired
    if (user.token_expiration) {
      const expiration = new Date(user.token_expiration);
      if (expiration < new Date()) {
        return Response.json({ valid: false, reason: "expired", email: user.email });
      }
    }

    // If no PIN provided, just return verification status
    if (!pin) {
      return Response.json({
        valid: true,
        email: user.email,
        first_name: user.full_name ? user.full_name.split(" ")[0] : "there",
      });
    }

    // Validate PIN
    if (!/^\d{4}$/.test(pin)) {
      return Response.json({ error: "PIN must be exactly 4 digits" }, { status: 400 });
    }

    // Activate the account: save PIN, mark active, destroy token
    await base44.asServiceRole.entities.User.update(user.id, {
      pin_code: pin,
      account_status: "active",
      activation_token: "",
      token_expiration: "",
    });

    // Sync role based on billing (student if they have active billing, guest otherwise)
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
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});