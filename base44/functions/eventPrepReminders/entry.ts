import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

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
        if (!reg.user_email) continue;

        const eventDate = new Date(event.start_date);
        const whatToBring = event.what_to_bring ? `\n\nWhat to Bring:\n${event.what_to_bring}` : '';
        const location = event.location ? `\nLocation: ${event.location}` : '';

        await base44.integrations.Core.SendEmail({
          to: reg.user_email,
          subject: `Reminder: ${event.title} is tomorrow!`,
          body: `Hi ${reg.user_name || reg.student_name},\n\nThis is a quick reminder that ${event.title} is happening tomorrow!\n\nDate: ${eventDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}\nTime: ${eventDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}${location}${whatToBring}\n\nSee you there!\n\n- Chosen Martial Arts Academy`,
        });
        remindersSent++;
      }
    }

    return Response.json({ success: true, eventsChecked: upcomingEvents.length, remindersSent });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});