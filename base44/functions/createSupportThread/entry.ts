import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { subject, category = 'general', initialMessage } = await req.json();

    const thread = await base44.entities.MessageThread.create({
      thread_name: subject || `Support: ${user.full_name}`,
      type: 'support',
      created_by_id: user.id,
      support_category: category,
      is_admin_managed: true
    });

    await base44.entities.ThreadParticipant.create({
      thread_id: thread.id,
      user_id: user.id,
      user_name: user.full_name,
      joined_date: new Date().toISOString(),
      is_admin: user.role === 'admin'
    });

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

    if (initialMessage) {
      await base44.entities.Message.create({
        thread_id: thread.id,
        sender_id: user.id,
        sender_name: user.full_name,
        content: initialMessage,
        message_type: 'private',
        channel_used: 'in_app'
      });
    }

    return Response.json({ success: true, threadId: thread.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});