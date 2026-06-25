import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const { targetUserId, content, channel = 'in_app' } = await req.json();
    if (!targetUserId || !content) return Response.json({ error: 'targetUserId and content required' }, { status: 400 });

    const targetUser = await base44.entities.User.get(targetUserId);
    if (!targetUser) return Response.json({ error: 'Target user not found' }, { status: 404 });

    // Find existing DM thread between this admin team and the user
    const existing = await base44.entities.MessageThread.filter({ type: 'dm', dm_participant_id: targetUserId });
    let thread = existing[0];

    if (!thread) {
      thread = await base44.entities.MessageThread.create({
        thread_name: `DM: ${targetUser.full_name}`,
        type: 'dm',
        created_by_id: user.id,
        is_admin_managed: true,
        status: 'open',
        assigned_admin_id: user.id,
        assigned_admin_name: user.full_name,
        dm_participant_id: targetUserId,
        dm_participant_name: targetUser.full_name
      });

      // Add the target user as a participant
      await base44.entities.ThreadParticipant.create({
        thread_id: thread.id,
        user_id: targetUserId,
        user_name: targetUser.full_name,
        joined_date: new Date().toISOString(),
        is_admin: false
      });

      // Add all admins as participants so the whole team sees the thread
      const admins = await base44.entities.User.filter({ role: 'admin' });
      for (const admin of admins) {
        await base44.entities.ThreadParticipant.create({
          thread_id: thread.id,
          user_id: admin.id,
          user_name: admin.full_name,
          joined_date: new Date().toISOString(),
          is_admin: true
        });
      }
    }

    // Create the outbound message
    const message = await base44.entities.Message.create({
      thread_id: thread.id,
      sender_id: user.id,
      sender_name: user.full_name,
      content,
      message_type: 'private',
      channel_used: channel,
      direction: 'outbound',
      subject: thread.thread_name || null
    });

    // Update thread preview
    await base44.entities.MessageThread.update(thread.id, {
      last_message_preview: content.substring(0, 120),
      last_message_date: new Date().toISOString()
    });

    // Deliver via the selected channel (in-app is always stored above)
    const familyGroups = await base44.entities.FamilyGroup.filter({ primary_contact_id: targetUserId });
    const family = familyGroups[0];
    const optInEmail = family?.opt_in_email !== false;
    const optInSms = family?.opt_in_sms !== false;

    if (channel === 'email' && optInEmail && targetUser.email) {
      await base44.integrations.Core.SendEmail({
        to: targetUser.email,
        subject: `Message from Chosen Martial Arts: ${user.full_name}`,
        body: content
      });
    }

    if (channel === 'sms' && optInSms && family?.cc_phones) {
      // SMS delivery requires an SMS provider integration (e.g. Twilio).
      // The message is stored in-app regardless; SMS send hook goes here once configured.
      console.log('SMS direct message queued for:', family.cc_phones);
    }

    // Bump unread count for the target user participant
    const targetParticipant = (await base44.entities.ThreadParticipant.filter({ thread_id: thread.id, user_id: targetUserId }))[0];
    if (targetParticipant) {
      await base44.entities.ThreadParticipant.update(targetParticipant.id, {
        unread_count: (targetParticipant.unread_count || 0) + 1
      });
    }

    return Response.json({ success: true, threadId: thread.id, messageId: message.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});