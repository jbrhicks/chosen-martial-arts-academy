import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const isAuth = await base44.auth.isAuthenticated();
    if (!isAuth) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const caller = await base44.auth.me().catch(() => null);
    if (caller && caller.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const events = await base44.asServiceRole.entities.Event.list();
    const recentEvents = events.filter(e => {
      const endDate = e.end_date ? new Date(e.end_date) : new Date(e.start_date);
      return endDate >= yesterday && endDate <= now && e.status === 'active';
    });

    let emailsSent = 0;

    for (const event of recentEvents) {
      const registrations = await base44.asServiceRole.entities.EventRegistration.filter({
        event_id: event.id
      });
      const activeRegs = registrations.filter(r => r.status === 'registered' || r.status === 'checked-in');

      for (const reg of activeRegs) {
        if (!reg.user_email) continue;

        if (reg.is_guest) {
          await base44.integrations.Core.SendEmail({
            to: reg.user_email,
            subject: `Did ${reg.student_name || 'your child'} love ${event.title}?`,
            body: `Hi ${reg.user_name},\n\nWe hope you enjoyed ${event.title}!\n\nDid ${reg.student_name || 'your child'} have a great time? We'd love to invite you to try a $49 Trial Course at Chosen Martial Arts Academy.\n\nClick here to grab your trial: ${Deno.env.get('BASE44_APP_URL') || ''}/trial-booking\n\nWe can't wait to see you on the mat!\n\n- Chosen Martial Arts Academy`,
          });
        } else if (event.media_gallery_url) {
          await base44.integrations.Core.SendEmail({
            to: reg.user_email,
            subject: `Photos from ${event.title} are here!`,
            body: `Hi ${reg.user_name},\n\nThank you for joining us at ${event.title}!\n\nWe've uploaded photos and videos from the event. Check them out here:\n${event.media_gallery_url}\n\nFeel free to share and tag us on social media!\n\n- Chosen Martial Arts Academy`,
          });
        }
        emailsSent++;
      }

      await base44.asServiceRole.entities.Event.update(event.id, { status: 'completed' });
    }

    return Response.json({ success: true, eventsProcessed: recentEvents.length, emailsSent });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});