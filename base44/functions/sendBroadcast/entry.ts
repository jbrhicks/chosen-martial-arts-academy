import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { broadcastId } = await req.json();
    if (!broadcastId) return Response.json({ error: 'Broadcast ID required' }, { status: 400 });

    const broadcast = await base44.entities.BroadcastMessage.get(broadcastId);
    if (!broadcast) return Response.json({ error: 'Broadcast not found' }, { status: 404 });

    let targetUsers = [];

    if (broadcast.target_type === 'all') {
      const allUsers = await base44.entities.User.list();
      targetUsers = allUsers.filter(u => u.role === 'student' || u.role === 'user');
    } else if (broadcast.target_type === 'program' && broadcast.target_program_id) {
      const enrollments = await base44.entities.Enrollment.filter({ 
        program_id: broadcast.target_program_id,
        status: 'active'
      });
      const userIds = [...new Set(enrollments.map(e => e.user_id))];
      const allUsers = await base44.entities.User.list();
      targetUsers = allUsers.filter(u => userIds.includes(u.id));
    } else if (broadcast.target_type === 'belt_rank' && broadcast.target_belt_rank) {
      const allUsers = await base44.entities.User.list();
      targetUsers = allUsers.filter(u => u.belt_rank === broadcast.target_belt_rank);
    } else if (broadcast.target_type === 'custom' && broadcast.target_user_ids) {
      const userIds = JSON.parse(broadcast.target_user_ids);
      const allUsers = await base44.entities.User.list();
      targetUsers = allUsers.filter(u => userIds.includes(u.id));
    }

    const familyGroups = await base44.entities.FamilyGroup.list();
    const familyMap = {};
    familyGroups.forEach(fg => {
      familyMap[fg.primary_contact_id] = fg;
    });

    let emailCount = 0;
    let smsCount = 0;
    let inAppCount = 0;

    for (const targetUser of targetUsers) {
      const family = familyMap[targetUser.id] || (await base44.entities.FamilyGroup.filter({ primary_contact_id: targetUser.id }))[0];
      const optInEmail = family?.opt_in_email !== false;
      const optInSms = family?.opt_in_sms !== false;

      if (broadcast.channel_in_app) {
        await base44.entities.MessageRecipient.create({
          message_id: broadcastId,
          user_id: targetUser.id,
          user_name: targetUser.full_name,
          user_email: targetUser.email,
          family_id: targetUser.family_id,
          delivery_channel: 'in_app',
          delivery_status: 'sent',
          sent_date: new Date().toISOString()
        });
        inAppCount++;
      }

      if (broadcast.channel_email && optInEmail) {
        await base44.integrations.Core.SendEmail({
          to: targetUser.email,
          subject: broadcast.subject,
          body: broadcast.body
        });
        await base44.entities.MessageRecipient.create({
          message_id: broadcastId,
          user_id: targetUser.id,
          user_name: targetUser.full_name,
          user_email: targetUser.email,
          family_id: targetUser.family_id,
          delivery_channel: 'email',
          delivery_status: 'sent',
          sent_date: new Date().toISOString()
        });
        emailCount++;
      } else if (broadcast.channel_email && !optInEmail) {
        await base44.entities.MessageRecipient.create({
          message_id: broadcastId,
          user_id: targetUser.id,
          user_name: targetUser.full_name,
          user_email: targetUser.email,
          family_id: targetUser.family_id,
          delivery_channel: 'email',
          delivery_status: 'skipped_opt_out'
        });
      }

      if (broadcast.channel_sms && optInSms && family?.cc_phones) {
        const phones = family.cc_phones.split(',').map(p => p.trim());
        for (const phone of phones) {
          await base44.entities.MessageRecipient.create({
            message_id: broadcastId,
            user_id: targetUser.id,
            user_name: targetUser.full_name,
            user_email: targetUser.email,
            family_id: targetUser.family_id,
            delivery_channel: 'sms',
            delivery_status: 'sent',
            sent_date: new Date().toISOString()
          });
          smsCount++;
        }
      } else if (broadcast.channel_sms && !optInSms) {
        await base44.entities.MessageRecipient.create({
          message_id: broadcastId,
          user_id: targetUser.id,
          user_name: targetUser.full_name,
          user_email: targetUser.email,
          family_id: targetUser.family_id,
          delivery_channel: 'sms',
          delivery_status: 'skipped_opt_out'
        });
      }
    }

    await base44.entities.BroadcastMessage.update(broadcastId, {
      status: 'sent',
      sent_date: new Date().toISOString(),
      total_recipients: targetUsers.length,
      email_sent_count: emailCount,
      sms_sent_count: smsCount,
      in_app_sent_count: inAppCount
    });

    return Response.json({ 
      success: true, 
      recipients: targetUsers.length,
      emailSent: emailCount,
      smsSent: smsCount,
      inAppSent: inAppCount
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});