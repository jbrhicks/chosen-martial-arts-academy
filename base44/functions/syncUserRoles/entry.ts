import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { user_id, email } = body;

    // If a specific user is requested, sync just that one; otherwise sync all non-admin users
    let targetUsers = [];
    if (user_id || email) {
      const filter = user_id ? { id: user_id } : { email };
      targetUsers = await base44.asServiceRole.entities.User.filter(filter).catch(() => []);
    } else {
      const allUsers = await base44.asServiceRole.entities.User.list();
      targetUsers = allUsers.filter((u: any) => u.role !== 'admin');
    }

    let updated = 0;
    const results = [];

    for (const target of targetUsers) {
      // Never touch admins
      if (target.role === 'admin') continue;

      // Find billing records linked to this user's family_id or email
      const billingRecords = await base44.asServiceRole.entities.BillingRecord
        .filter({ family_id: target.family_id || '___none___' })
        .catch(() => []);

      // Also check by email in case family_id isn't set
      const emailBilling = await base44.asServiceRole.entities.BillingRecord
        .filter({ user_email: target.email })
        .catch(() => []);

      const allBilling = [...billingRecords, ...emailBilling.filter(eb => !billingRecords.some(b => b.id === eb.id))];

      const hasActive = allBilling.some((b: any) => b.status === 'active');
      const hasPaused = allBilling.some((b: any) => b.status === 'paused');
      const hasCanceled = allBilling.some((b: any) => b.status === 'canceled');

      let newRole;
      let newSubStatus;

      if (hasActive) {
        newRole = 'student';
        newSubStatus = 'active';
      } else if (hasPaused) {
        newRole = 'guest';
        newSubStatus = 'canceled'; // frozen = treated as not actively paying
      } else if (hasCanceled) {
        newRole = 'guest';
        newSubStatus = 'canceled';
      } else {
        newRole = 'guest';
        newSubStatus = 'none';
      }

      // Only update if something changed
      if (target.role !== newRole || target.subscription_status !== newSubStatus) {
        await base44.asServiceRole.entities.User.update(target.id, {
          role: newRole,
          subscription_status: newSubStatus,
        });
        updated++;
        results.push({ email: target.email, old_role: target.role, new_role: newRole, subscription_status: newSubStatus });
      }
    }

    return Response.json({ success: true, synced: updated, total: targetUsers.length, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});