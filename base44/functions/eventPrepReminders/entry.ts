import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { deliverAlert } from '../../shared/notify.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const isAuth = await base44.auth.isAuthenticated();
    if (!isAuth) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const caller = await base44.auth.me().catch(() => null);
    if (caller && caller.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    // Fetch notification settings
    const settingsList = await base44.asServiceRole.entities.NotificationSettings.list().catch(() => []);
    const settings = settingsList[0] || {};
    const channel = settings.event_reminders_channel || "email";

    const appUrl = Deno.env.get("BASE44_APP_URL") || "";

    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const events = await base44.asServiceRole.entities.Event.list();
    const upcomingEvents = events.filter(e => {
      const startDate = new Date(e.start_date);
      return startDate >= now && startDate <= in24Hours && e.status === 'active';
    });

    let remindersSent = 0;

    for (const event of upcomingEvents) {
      const registrations = await base44.asServiceRole.entities.EventRegistration.filter({
        event_id: event.id
      });
      const activeRegs = registrations.filter(r => r.status === 'registered' || r.status === 'checked-in');

      for (const reg of activeRegs) {
        if (channel === "in_app" ? !reg.user_id : !reg.user_email) continue;

        const eventDate = new Date(event.start_date);
        const dateStr = eventDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
        const timeStr = eventDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

        const bodyLines = [
          `Hi ${reg.user_name || reg.student_name},`,
          `This is a quick reminder that <strong>${event.title}</strong> is happening tomorrow!`,
          `<strong>Date:</strong> ${dateStr}`,
          `<strong>Time:</strong> ${timeStr}`,
        ];
        if (event.location) bodyLines.push(`<strong>Location:</strong> ${event.location}`);
        if (event.what_to_bring) bodyLines.push(`<strong>What to Bring:</strong> ${event.what_to_bring}`);
        bodyLines.push("See you there!");

        const whatToBring = event.what_to_bring ? `\n\nWhat to Bring:\n${event.what_to_bring}` : '';
        const location = event.location ? `\nLocation: ${event.location}` : '';
        const res = await deliverAlert(base44, {
          channel,
          email: reg.user_email,
          user_id: reg.user_id,
          subject: `Reminder: ${event.title} is Tomorrow`,
          body_lines: bodyLines,
          action_url: `${appUrl}/portal/events`,
          action_label: "View Event Details",
          plain_body: `Hi ${reg.user_name || reg.student_name},\n\nThis is a quick reminder that ${event.title} is happening tomorrow!\n\nDate: ${dateStr}\nTime: ${timeStr}${location}${whatToBring}\n\nSee you there!\n\n- Chosen Martial Arts Academy`,
          inAppPayload: {
            notification_type: "new_event",
            preview_text: `Reminder: ${event.title} is tomorrow at ${timeStr}. Tap for details.`,
            target_type: "event",
            target_id: event.id,
            sender_name: "Event System",
          },
        });
        if (res.delivered) remindersSent++;
      }
    }

    return Response.json({ success: true, eventsChecked: upcomingEvents.length, remindersSent });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});