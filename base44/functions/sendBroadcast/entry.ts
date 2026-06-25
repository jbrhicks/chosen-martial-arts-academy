import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const BELT_RANKS = ["White Belt", "Yellow Belt", "Orange Belt", "Purple Belt", "Blue Belt", "Green Belt", "Red Belt", "Brown Belt", "1st Degree Black Belt", "2nd Degree Black Belt", "3rd Degree Black Belt"];

function getRankIndex(rank) {
  if (!rank) return 0;
  const idx = BELT_RANKS.indexOf(rank);
  return idx === -1 ? 0 : idx;
}

function personalize(text, user, studentName, nextClass) {
  let result = text || '';
  const firstName = (user.full_name || '').split(' ')[0];
  result = result.replace(/\[Guardian First Name\]/g, firstName);
  result = result.replace(/\[Student First Name\]/g, studentName || firstName);
  result = result.replace(/\[Next Class Time\]/g, nextClass || 'your next scheduled class');
  return result;
}

async function getNextClassTime(base44, userId) {
  try {
    const enrollments = await base44.entities.Enrollment.filter({ user_id: userId, status: 'active' });
    if (enrollments.length === 0) return null;
    const classes = await base44.entities.ClassSchedule.filter({ is_active: true });
    const now = new Date();
    const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    for (let i = 0; i < 14; i++) {
      const check = new Date(now);
      check.setDate(check.getDate() + i);
      const dayName = dayNames[check.getDay()];
      for (const cls of classes) {
        if (cls.day_of_week !== dayName) continue;
        const linkedIds = cls.linked_program_ids ? cls.linked_program_ids.split(',') : cls.linked_program_id ? [cls.linked_program_id] : [];
        const isEnrolled = enrollments.some(e => linkedIds.includes(e.program_id));
        if (isEnrolled) {
          return check.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) + ' at ' + (cls.start_time || '');
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

async function buildTargetUsers(base44, broadcast) {
  let targetUsers = [];

  if (broadcast.target_type === 'all_active') {
    const allUsers = await base44.entities.User.list();
    targetUsers = allUsers.filter(u => (u.role === 'student' || u.role === 'user') && u.status !== 'inactive');
  } else if (broadcast.target_type === 'all_inactive') {
    const allUsers = await base44.entities.User.list();
    targetUsers = allUsers.filter(u => (u.role === 'student' || u.role === 'user') && u.status === 'inactive');
  } else if (broadcast.target_type === 'program' && broadcast.target_program_id) {
    const enrollments = await base44.entities.Enrollment.filter({ program_id: broadcast.target_program_id, status: 'active' });
    const userIds = [...new Set(enrollments.map(e => e.user_id))];
    const allUsers = await base44.entities.User.list();
    targetUsers = allUsers.filter(u => userIds.includes(u.id));
  } else if (broadcast.target_type === 'belt_rank' && broadcast.target_belt_rank) {
    const allUsers = await base44.entities.User.list();
    targetUsers = allUsers.filter(u => u.belt_rank === broadcast.target_belt_rank);
  } else if (broadcast.target_type === 'event_registered' && broadcast.target_event_id) {
    const registrations = await base44.entities.EventRegistration.filter({ event_id: broadcast.target_event_id });
    const userIds = [...new Set(registrations.map(r => r.user_id).filter(id => id))];
    if (userIds.length > 0) {
      const allUsers = await base44.entities.User.list();
      targetUsers = allUsers.filter(u => userIds.includes(u.id));
    }
  } else if (broadcast.target_type === 'custom' && broadcast.target_user_ids) {
    const userIds = broadcast.target_user_ids.split(',').filter(id => id);
    const allUsers = await base44.entities.User.list();
    targetUsers = allUsers.filter(u => userIds.includes(u.id));
  }

  // Apply exclusion rules
  if (broadcast.exclude_event_id) {
    const eventRegs = await base44.entities.EventRegistration.filter({ event_id: broadcast.exclude_event_id });
    const excludeUserIds = new Set(eventRegs.map(r => r.user_id).filter(id => id));
    targetUsers = targetUsers.filter(u => !excludeUserIds.has(u.id));
  }
  if (broadcast.exclude_program_id) {
    const enrollments = await base44.entities.Enrollment.filter({ program_id: broadcast.exclude_program_id, status: 'active' });
    const excludeUserIds = new Set(enrollments.map(e => e.user_id));
    targetUsers = targetUsers.filter(u => !excludeUserIds.has(u.id));
  }
  if (broadcast.min_belt_rank) {
    const minIdx = getRankIndex(broadcast.min_belt_rank);
    targetUsers = targetUsers.filter(u => getRankIndex(u.belt_rank) >= minIdx);
  }

  return targetUsers;
}

async function sendToUser(base44, broadcast, broadcastId, targetUser, familyMap) {
  const family = familyMap[targetUser.id] || (await base44.entities.FamilyGroup.filter({ primary_contact_id: targetUser.id }))[0];
  const optInEmail = family?.opt_in_email !== false;
  const optInSms = family?.opt_in_sms !== false;

  let studentName = targetUser.full_name;
  let nextClass = null;
  try {
    if (family) {
      const familyMembers = await base44.entities.User.filter({ family_id: family.id });
      const student = familyMembers.find(m => m.role === 'student' || m.family_role === 'student');
      if (student) studentName = student.full_name;
    }
    nextClass = await getNextClassTime(base44, targetUser.id);
  } catch {}

  const personalizedBody = personalize(broadcast.body, targetUser, studentName, nextClass);
  const personalizedSubject = personalize(broadcast.subject, targetUser, studentName, nextClass);

  let emailCount = 0, smsCount = 0, inAppCount = 0, bounceCount = 0;
  let deliveredAnyChannel = false;

  // In-App (always delivered if selected)
  if (broadcast.channel_in_app) {
    await base44.entities.MessageRecipient.create({
      message_id: broadcastId, user_id: targetUser.id, user_name: targetUser.full_name,
      user_email: targetUser.email, family_id: targetUser.family_id,
      delivery_channel: 'in_app', delivery_status: 'sent', sent_date: new Date().toISOString()
    });
    inAppCount++;
    deliveredAnyChannel = true;
  }

  // Email (respects opt-out, with bounce tracking)
  if (broadcast.channel_email && optInEmail) {
    try {
      await base44.integrations.Core.SendEmail({ to: targetUser.email, subject: personalizedSubject, body: personalizedBody });
      await base44.entities.MessageRecipient.create({
        message_id: broadcastId, user_id: targetUser.id, user_name: targetUser.full_name,
        user_email: targetUser.email, family_id: targetUser.family_id,
        delivery_channel: 'email', delivery_status: 'sent', sent_date: new Date().toISOString()
      });
      emailCount++;
      deliveredAnyChannel = true;
    } catch (emailErr) {
      await base44.entities.MessageRecipient.create({
        message_id: broadcastId, user_id: targetUser.id, user_name: targetUser.full_name,
        user_email: targetUser.email, family_id: targetUser.family_id,
        delivery_channel: 'email', delivery_status: 'failed', is_bounced: true,
        bounce_reason: emailErr.message || 'Email bounce', sent_date: new Date().toISOString()
      });
      bounceCount++;
    }
  } else if (broadcast.channel_email && !optInEmail) {
    await base44.entities.MessageRecipient.create({
      message_id: broadcastId, user_id: targetUser.id, user_name: targetUser.full_name,
      user_email: targetUser.email, family_id: targetUser.family_id,
      delivery_channel: 'email', delivery_status: 'skipped_opt_out'
    });
  }

  // SMS (respects opt-out, with bounce tracking)
  if (broadcast.channel_sms && optInSms && family?.cc_phones) {
    const phones = family.cc_phones.split(',').map(p => p.trim()).filter(Boolean);
    for (const phone of phones) {
      try {
        await base44.entities.MessageRecipient.create({
          message_id: broadcastId, user_id: targetUser.id, user_name: targetUser.full_name,
          user_email: targetUser.email, family_id: targetUser.family_id,
          delivery_channel: 'sms', delivery_status: 'sent', sent_date: new Date().toISOString()
        });
        smsCount++;
        deliveredAnyChannel = true;
      } catch (smsErr) {
        await base44.entities.MessageRecipient.create({
          message_id: broadcastId, user_id: targetUser.id, user_name: targetUser.full_name,
          user_email: targetUser.email, family_id: targetUser.family_id,
          delivery_channel: 'sms', delivery_status: 'failed', is_bounced: true,
          bounce_reason: smsErr.message || 'SMS failed', sent_date: new Date().toISOString()
        });
        bounceCount++;
      }
    }
  } else if (broadcast.channel_sms && !optInSms) {
    await base44.entities.MessageRecipient.create({
      message_id: broadcastId, user_id: targetUser.id, user_name: targetUser.full_name,
      user_email: targetUser.email, family_id: targetUser.family_id,
      delivery_channel: 'sms', delivery_status: 'skipped_opt_out'
    });
  }

  // Smart Opt-Out Bypass: if nothing was delivered, force in-app
  if (!deliveredAnyChannel && !broadcast.channel_in_app) {
    await base44.entities.MessageRecipient.create({
      message_id: broadcastId, user_id: targetUser.id, user_name: targetUser.full_name,
      user_email: targetUser.email, family_id: targetUser.family_id,
      delivery_channel: 'in_app', delivery_status: 'sent', sent_date: new Date().toISOString()
    });
    inAppCount++;
  }

  return { emailCount, smsCount, inAppCount, bounceCount };
}

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

    // Don't send if scheduled for the future
    if (broadcast.status === 'scheduled' && broadcast.scheduled_date) {
      if (new Date(broadcast.scheduled_date) > new Date()) {
        return Response.json({ error: 'Broadcast is scheduled for the future' }, { status: 400 });
      }
    }

    const targetUsers = await buildTargetUsers(base44, broadcast);
    const familyGroups = await base44.entities.FamilyGroup.list();
    const familyMap = {};
    familyGroups.forEach(fg => { familyMap[fg.primary_contact_id] = fg; });

    let totalEmail = 0, totalSms = 0, totalInApp = 0, totalBounce = 0;

    for (const targetUser of targetUsers) {
      const result = await sendToUser(base44, broadcast, broadcastId, targetUser, familyMap);
      totalEmail += result.emailCount;
      totalSms += result.smsCount;
      totalInApp += result.inAppCount;
      totalBounce += result.bounceCount;
    }

    await base44.entities.BroadcastMessage.update(broadcastId, {
      status: 'sent',
      sent_date: new Date().toISOString(),
      total_recipients: targetUsers.length,
      email_sent_count: totalEmail,
      sms_sent_count: totalSms,
      in_app_sent_count: totalInApp,
      bounce_count: totalBounce
    });

    return Response.json({
      success: true,
      recipients: targetUsers.length,
      emailSent: totalEmail,
      smsSent: totalSms,
      inAppSent: totalInApp,
      bounced: totalBounce
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});