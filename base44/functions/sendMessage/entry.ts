import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { threadId, content, channel = 'in_app', mediaUrls } = await req.json();
    if (!threadId || !content) return Response.json({ error: 'Thread ID and content required' }, { status: 400 });

    const thread = await base44.entities.MessageThread.get(threadId);
    if (!thread) return Response.json({ error: 'Thread not found' }, { status: 404 });

    const messageData = {
      thread_id: threadId,
      sender_id: user.id,
      sender_name: user.full_name,
      content,
      channel_used: channel,
      direction: user.role === 'admin' ? 'outbound' : 'inbound',
      subject: thread.thread_name || null
    };
    if (mediaUrls && mediaUrls.length > 0) {
      messageData.media_urls = JSON.stringify(mediaUrls);
    }

    const message = await base44.entities.Message.create(messageData);

    const participants = await base44.entities.ThreadParticipant.filter({ thread_id: threadId });

    // Update thread preview so the inbox list reflects the latest message
    await base44.entities.MessageThread.update(threadId, {
      last_message_preview: content.substring(0, 120),
      last_message_date: new Date().toISOString()
    });

    for (const participant of participants) {
      if (participant.user_id === user.id) continue;

      const targetUser = await base44.entities.User.get(participant.user_id);
      if (!targetUser) continue;

      const familyGroups = await base44.entities.FamilyGroup.filter({ primary_contact_id: participant.user_id });
      const family = familyGroups[0];
      const optInEmail = family?.opt_in_email !== false;
      const optInSms = family?.opt_in_sms !== false;

      if (channel === 'email' && optInEmail && targetUser.email) {
        await base44.integrations.Core.SendEmail({
          to: targetUser.email,
          subject: `Re: ${thread.thread_name || 'Message'}`,
          body: content
        });
      }

      if (channel === 'sms' && optInSms && family?.cc_phones) {
        // SMS sending would require an SMS provider integration
        console.log('SMS would be sent to:', family.cc_phones);
      }

      await base44.entities.ThreadParticipant.update(participant.id, {
        unread_count: (participant.unread_count || 0) + 1
      });
    }

    return Response.json({ success: true, messageId: message.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});