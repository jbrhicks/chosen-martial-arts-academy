import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    // Require authentication — blocks unauthenticated external callers from
    // injecting notifications via direct HTTP POST
    const caller = await base44.auth.me().catch(() => null);
    if (!caller) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const {
      recipient_type = 'user',
      recipient_id,
      sender_id,
      sender_name = 'System',
      notification_type,
      preview_text,
      target_type = 'none',
      target_id,
      aggregate_window_minutes = 10,
    } = body;

    if (!notification_type || !preview_text) {
      return Response.json({ error: 'notification_type and preview_text required' }, { status: 400 });
    }

    // Broadcast/admin notifications require admin or service-role privileges.
    // Service-role is detected by the no-reply email pattern used for internal
    // function-to-function calls (e.g. deliverAlert, triggerNotification).
    const isServiceRole = (caller.email || '').startsWith('service+') || (caller.email || '').includes('@no-reply.base44.com');
    if (recipient_type === 'all' || recipient_type === 'admin') {
      if (caller.role !== 'admin' && !isServiceRole) {
        return Response.json({ error: 'Forbidden — admin privileges required for broadcasts' }, { status: 403 });
      }
    }

    // Admin-shared notifications: throttle/aggregate high-volume alerts (e.g. new leads)
    if (recipient_type === 'admin') {
      const windowMs = aggregate_window_minutes * 60 * 1000;
      const since = new Date(Date.now() - windowMs);
      const recent = await base44.asServiceRole.entities.Notification.filter({
        recipient_type: 'admin',
        notification_type,
        is_read: false,
      });
      const inWindow = recent.find(n => new Date(n.created_date) >= since);
      if (inWindow) {
        const count = (inWindow.aggregate_count || 1) + 1;
        const label = notification_type === 'new_lead' ? 'leads' : 'alerts';
        await base44.asServiceRole.entities.Notification.update(inWindow.id, {
          aggregate_count: count,
          preview_text: `${count} new ${label} received — tap to review.`,
          target_id: target_id || inWindow.target_id,
        });
        return Response.json({ success: true, aggregated: true, id: inWindow.id });
      }
      const n = await base44.asServiceRole.entities.Notification.create({
        recipient_type: 'admin',
        recipient_id: null,
        sender_id,
        sender_name,
        notification_type,
        preview_text,
        target_type,
        target_id,
        is_read: false,
        aggregate_count: 1,
      });
      return Response.json({ success: true, id: n.id });
    }

    // Broadcast to every user (fan-out so each has own read state)
    if (recipient_type === 'all') {
      const users = await base44.asServiceRole.entities.User.list();
      const records = users.map(u => ({
        recipient_type: 'user',
        recipient_id: u.id,
        sender_id,
        sender_name,
        notification_type,
        preview_text,
        target_type,
        target_id,
        is_read: false,
        aggregate_count: 1,
      }));
      await base44.asServiceRole.entities.Notification.bulkCreate(records);
      return Response.json({ success: true, fanned_out: records.length });
    }

    // Single user
    const n = await base44.asServiceRole.entities.Notification.create({
      recipient_type: 'user',
      recipient_id,
      sender_id,
      sender_name,
      notification_type,
      preview_text,
      target_type,
      target_id,
      is_read: false,
      aggregate_count: 1,
    });
    return Response.json({ success: true, id: n.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}