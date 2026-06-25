import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Webhook endpoint for inbound SMS replies from an SMS provider (e.g. Twilio).
// Configure your SMS provider to POST here on inbound messages.
// Expected payload: { from: "<phone>", body: "<message text>" }
// This endpoint is unauthenticated (webhook) — it uses the service role and
// validates the sender phone against known family groups.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const fromPhone = body.from || body.From || body.FromNumber;
    const text = body.body || body.Body || body.Text;

    if (!fromPhone || !text) {
      return Response.json({ error: 'from and body required' }, { status: 400 });
    }

    // Normalize phone (strip non-digits, keep trailing digits after country code)
    const normalized = fromPhone.replace(/\D/g, '').slice(-10);

    // Find a family group whose cc_phones contains this number
    const families = await base44.asServiceRole.entities.FamilyGroup.list();
    const match = families.find(f => {
      const phones = (f.cc_phones || '').replace(/\D/g, '');
      return phones.includes(normalized);
    });

    if (!match) {
      return Response.json({ error: 'No matching family for this number' }, { status: 404 });
    }

    // The primary contact user on the family is the sender
    const senderId = match.primary_contact_id;
    if (!senderId) {
      return Response.json({ error: 'Family has no primary contact' }, { status: 404 });
    }

    const sender = await base44.asServiceRole.entities.User.get(senderId);
    if (!sender) {
      return Response.json({ error: 'Sender user not found' }, { status: 404 });
    }

    // Find the existing DM thread for this user
    const threads = await base44.asServiceRole.entities.MessageThread.filter({ type: 'dm', dm_participant_id: senderId });
    const thread = threads[0];

    if (!thread) {
      // No active thread — create one so the reply is captured
      const newThread = await base44.asServiceRole.entities.MessageThread.create({
        thread_name: `DM (SMS): ${sender.full_name}`,
        type: 'dm',
        is_admin_managed: true,
        status: 'open',
        dm_participant_id: senderId,
        dm_participant_name: sender.full_name
      });
      await base44.asServiceRole.entities.ThreadParticipant.create({
        thread_id: newThread.id,
        user_id: senderId,
        user_name: sender.full_name,
        joined_date: new Date().toISOString(),
        is_admin: false
      });
      const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
      for (const admin of admins) {
        await base44.asServiceRole.entities.ThreadParticipant.create({
          thread_id: newThread.id,
          user_id: admin.id,
          user_name: admin.full_name,
          joined_date: new Date().toISOString(),
          is_admin: true
        });
      }

      await base44.asServiceRole.entities.Message.create({
        thread_id: newThread.id,
        sender_id: senderId,
        sender_name: sender.full_name,
        content: text,
        message_type: 'private',
        channel_used: 'sms',
        direction: 'inbound'
      });
      await base44.asServiceRole.entities.MessageThread.update(newThread.id, {
        last_message_preview: text.substring(0, 120),
        last_message_date: new Date().toISOString()
      });
      return Response.json({ success: true, threadId: newThread.id });
    }

    // Store the inbound reply
    await base44.asServiceRole.entities.Message.create({
      thread_id: thread.id,
      sender_id: senderId,
      sender_name: sender.full_name,
      content: text,
      message_type: 'private',
      channel_used: 'sms',
      direction: 'inbound'
    });

    await base44.asServiceRole.entities.MessageThread.update(thread.id, {
      last_message_preview: text.substring(0, 120),
      last_message_date: new Date().toISOString()
    });

    // Bump unread for all admin participants
    const participants = await base44.asServiceRole.entities.ThreadParticipant.filter({ thread_id: thread.id });
    for (const p of participants) {
      if (p.is_admin) {
        await base44.asServiceRole.entities.ThreadParticipant.update(p.id, {
          unread_count: (p.unread_count || 0) + 1
        });
      }
    }

    return Response.json({ success: true, threadId: thread.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});