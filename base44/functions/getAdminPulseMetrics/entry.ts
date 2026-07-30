import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    // 48-hour threshold for stale leads
    const staleThreshold = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    const [staleLeads, overdueBilling, pendingFlags, pendingMembershipRequests, newLeads] = await Promise.all([
      base44.asServiceRole.entities.Lead.filter({ status: 'new', created_date: { $lt: staleThreshold } }).catch(() => []),
      base44.asServiceRole.entities.BillingRecord.filter({ status: 'past_due' }).catch(() => []),
      base44.asServiceRole.entities.InstructorStudentFlag.filter({ status: 'pending' }).catch(() => []),
      base44.asServiceRole.entities.MembershipRequest.filter({ status: 'pending' }).catch(() => []),
      base44.asServiceRole.entities.Lead.filter({ status: 'new' }).catch(() => []),
    ]);

    return Response.json({
      stale_leads: staleLeads.length,
      new_leads: newLeads.length,
      overdue_invoices: overdueBilling.length,
      pending_flags: pendingFlags.length,
      pending_membership_requests: pendingMembershipRequests.length,
      total_requires_action: staleLeads.length + overdueBilling.length + pendingFlags.length + pendingMembershipRequests.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}