import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Automation/scheduler (authenticated) or admin; authenticated users may only link their own email
    const isAuth = await base44.auth.isAuthenticated();
    if (!isAuth) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const caller = await base44.auth.me().catch(() => null);

    const body = await req.json();

    // Supports two invocation modes:
    // 1. Entity automation payload: { event: { entity_id, ... }, data: { email, ... } }
    // 2. Direct invocation: { email } or { user_id, email }
    let userId: string | undefined;
    let email: string | undefined;

    if (body.event?.entity_id) {
      userId = body.event.entity_id;
      email = body.data?.email;
    } else {
      userId = body.user_id;
      email = body.email;
    }

    if (!email) {
      return Response.json({ error: "Missing email" }, { status: 400 });
    }

    if (caller && caller.role !== 'admin') {
      if (caller.email?.toLowerCase() !== String(email).toLowerCase()) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
      userId = caller.id;
    }

    // If we don't have a userId yet (direct invocation with email only), look it up
    if (!userId) {
      const users = await base44.asServiceRole.entities.User.filter({ email }).catch(() => []);
      if (users.length > 0) {
        userId = users[0].id;
      }
    }

    if (!userId) {
      return Response.json({ error: "User not found for this email" }, { status: 404 });
    }

    // Find all leads with matching email that haven't been linked yet
    const leads = await base44.asServiceRole.entities.Lead.filter({ email });
    const unlinkedLeads = leads.filter((l: any) => !l.linked_user_id);

    let linked = 0;
    for (const lead of unlinkedLeads) {
      await base44.asServiceRole.entities.Lead.update(lead.id, {
        linked_user_id: userId,
      });

      await base44.asServiceRole.entities.LeadActivityLog.create({
        lead_id: lead.id,
        lead_name: lead.full_name || '',
        action_type: 'enrolled',
        content: 'Lead created a member account with matching email — automatically linked.',
        admin_name: 'System',
      }).catch(() => {});

      linked++;
    }

    return Response.json({ success: true, linked, totalMatches: leads.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});