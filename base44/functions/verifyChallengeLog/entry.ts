import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { log_id, action = 'approve' } = body; // action: approve | reject

    const log = await base44.asServiceRole.entities.ChallengeLog.get(log_id).catch(() => null);
    if (!log) return Response.json({ error: 'Log not found' }, { status: 404 });

    // Verify the user is the guardian for this log's family
    if (user.role !== 'admin') {
      if (!user.family_id || log.family_id !== user.family_id) {
        return Response.json({ error: 'Not authorized — must be the family guardian' }, { status: 403 });
      }
    }

    const newStatus = action === 'reject' ? 'rejected' : 'approved';

    await base44.asServiceRole.entities.ChallengeLog.update(log_id, {
      verification_status: newStatus,
      guardian_id: user.id,
      guardian_name: user.full_name,
      verified_date: new Date().toISOString(),
    });

    if (action === 'reject') {
      return Response.json({ success: true, status: 'rejected' });
    }

    // Approved — update participant score
    const participants = await base44.asServiceRole.entities.ChallengeParticipant.filter({
      challenge_id: log.challenge_id, student_id: log.student_id,
    }).catch(() => []);

    const participant = participants[0];
    if (!participant) return Response.json({ success: true, status: 'approved' });

    const challenge = await base44.asServiceRole.entities.Challenge.get(log.challenge_id).catch(() => null);
    const newScore = (participant.current_score || 0) + (log.logged_value || 0);
    const target = challenge?.target_goal_value || 0;
    const completed = newScore >= target && target > 0;

    await base44.asServiceRole.entities.ChallengeParticipant.update(participant.id, {
      current_score: newScore,
      last_log_date: new Date().toISOString(),
      status: completed ? 'completed' : 'active',
      completion_date: completed ? new Date().toISOString() : undefined,
    });

    // Award badge on completion
    let badgeAwarded = false;
    if (completed && challenge) {
      const existingBadge = await base44.asServiceRole.entities.ChallengeBadge.filter({
        challenge_id: log.challenge_id, student_id: log.student_id,
      }).catch(() => []);

      if (existingBadge.length === 0) {
        await base44.asServiceRole.entities.ChallengeBadge.create({
          student_id: log.student_id, student_name: log.student_name,
          family_id: log.family_id,
          challenge_id: log.challenge_id, challenge_title: log.challenge_title,
          badge_name: challenge.badge_name || `${challenge.title} Champion`,
          badge_graphic_url: challenge.badge_graphic_url,
          date_earned: new Date().toISOString(),
          reward_fulfilled: false,
        });
        badgeAwarded = true;

        await base44.asServiceRole.entities.Challenge.update(log.challenge_id, {
          completion_count: (challenge.completion_count || 0) + 1,
        });

        // Notify admin — Reward Fulfillment Inbox
        await base44.asServiceRole.entities.Notification.create({
          recipient_type: 'admin', recipient_id: null,
          sender_id: user.id, sender_name: 'Challenge Engine',
          notification_type: 'announcement',
          preview_text: `🏆 ${log.student_name} completed "${log.challenge_title}"! Present their ${challenge.badge_name || 'challenge badge'} at the next class.`,
          target_type: 'post', target_id: log.challenge_id,
          is_read: false, aggregate_count: 1,
        }).catch(() => null);
      }
    }

    const progressPct = target > 0 ? Math.min(100, Math.round((newScore / target) * 100)) : 0;

    return Response.json({
      success: true, status: 'approved',
      new_score: newScore, target, progress_pct: progressPct,
      completed, badge_awarded: badgeAwarded,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});