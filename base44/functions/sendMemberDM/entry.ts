import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { targetUserId, content, mediaUrls } = await req.json();
    if (!targetUserId || !content) return Response.json({ error: 'targetUserId and content required' }, { status: 400 });
    if (targetUserId === user.id) return Response.json({ error: 'Cannot message yourself' }, { status: 400 });

    const targetUser = await base44.entities.User.get(targetUserId);
    if (!targetUser) return Response.json({ error: 'User not found' }, { status: 404 });
    if (targetUser.role === 'admin') return Response.json({ error: 'Use Contact Front Desk to reach administrators' }, { status: 403 });

    // Find existing DM thread between these two members (either direction)
    const myDms = await base44.entities.MessageThread.filter({ type: 'dm', dm_participant_id: targetUserId });
    let thread = myDms.find((t: Record<string, unknown>) => t.created_by_id === user.id);

    if (!thread) {
      const theirDms = await base44.asServiceRole.entities.MessageThread.filter({ type: 'dm', dm_participant_id: user.id });
      thread = theirDms.find((t: Record<string, unknown>) => t.created_by_id === targetUserId);
    }

    // Auto-restore archived thread when a new message is sent
    if (thread && thread.status === 'archived') {
      await base44.entities.MessageThread.update(thread.id, { status: 'open' });
      thread.status = 'open';
    }

    if (!thread) {
      thread = await base44.entities.MessageThread.create({
        thread_name: targetUser.full_name,
        type: 'dm',
        created_by_id: user.id,
        is_admin_managed: true,
        status: 'open',
        dm_participant_id: targetUserId,
        dm_participant_name: targetUser.full_name
      });

      // Add sender as participant (regular client — self)
      await base44.entities.ThreadParticipant.create({
        thread_id: thread.id,
        user_id: user.id,
        user_name: user.full_name,
        joined_date: new Date().toISOString(),
        is_admin: false
      });

      // Add target as participant (service role — bypass RLS)
      await base44.asServiceRole.entities.ThreadParticipant.create({
        thread_id: thread.id,
        user_id: targetUserId,
        user_name: targetUser.full_name,
        joined_date: new Date().toISOString(),
        is_admin: false
      });

      // Add all admins as participants for monitoring
      const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
      for (const admin of admins) {
        await base44.asServiceRole.entities.ThreadParticipant.create({
          thread_id: thread.id,
          user_id: admin.id,
          user_name: admin.full_name,
          joined_date: new Date().toISOString(),
          is_admin: true
        });
      }
    }

    // Create the message
    const messageData: Record<string, unknown> = {
      thread_id: thread.id,
      sender_id: user.id,
      sender_name: user.full_name,
      content,
      message_type: 'private',
      channel_used: 'in_app',
      direction: 'outbound',
      subject: thread.thread_name || null
    };
    if (mediaUrls && mediaUrls.length > 0) {
      messageData.media_urls = JSON.stringify(mediaUrls);
    }
    const message = await base44.entities.Message.create(messageData);

    // Update thread preview
    await base44.entities.MessageThread.update(thread.id, {
      last_message_preview: content.substring(0, 120),
      last_message_date: new Date().toISOString()
    });

    // Bump unread count for the target participant
    const targetParticipant = (await base44.asServiceRole.entities.ThreadParticipant.filter({ thread_id: thread.id, user_id: targetUserId }))[0];
    if (targetParticipant) {
      await base44.asServiceRole.entities.ThreadParticipant.update(targetParticipant.id, {
        unread_count: (targetParticipant.unread_count || 0) + 1
      });
    }

    return Response.json({ success: true, threadId: thread.id, messageId: message.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});