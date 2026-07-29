import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { challenge_id, logged_value = 1, log_type = 'manual', proof_media_url, proof_description, student_id } = body;

    if (!challenge_id) return Response.json({ error: 'challenge_id required' }, { status: 400 });

    // The student being logged for (defaults to current user; guardians can log for their child)
    const targetStudentId = student_id || user.id;
    const isGuardianLogging = student_id && student_id !== user.id;

    // Fetch challenge
    const challenge = await base44.asServiceRole.entities.Challenge.get(challenge_id).catch(() => null);
    if (!challenge) return Response.json({ error: 'Challenge not found' }, { status: 404 });

    // Get student info
    const student = await base44.asServiceRole.entities.User.get(targetStudentId).catch(() => null);
    if (!student) return Response.json({ error: 'Student not found' }, { status: 404 });

    // Verify guardian relationship if logging for someone else
    if (isGuardianLogging) {
      if (user.role !== 'admin' && student.family_id !== user.family_id) {
        return Response.json({ error: 'Not authorized for this student' }, { status: 403 });
      }
    }

    // Find or create participant record
    let participants = await base44.asServiceRole.entities.ChallengeParticipant.filter({
      challenge_id, student_id: targetStudentId,
    }).catch(() => []);

    let participant = participants[0];
    if (!participant) {
      // Auto-enroll on first log (opt-in)
      participant = await base44.asServiceRole.entities.ChallengeParticipant.create({
        challenge_id, challenge_title: challenge.title,
        student_id: targetStudentId, student_name: student.full_name,
        family_id: student.family_id, status: 'active', current_score: 0,
        enrolled_date: new Date().toISOString(),
      });
      // Add to community group
      if (challenge.linked_group_id) {
        await base44.asServiceRole.entities.GroupMember.create({
          group_id: challenge.linked_group_id, user_id: targetStudentId, user_name: student.full_name,
        }).catch(() => null);
      }
      await base44.asServiceRole.entities.Challenge.update(challenge_id, {
        participant_count: (challenge.participant_count || 0) + 1,
      });
    }

    if (participant.status === 'completed') {
      return Response.json({ success: true, message: 'Already completed', alreadyDone: true });
    }

    // Determine if guardian verification is needed (age 12 and under).
    // COPPA-safe: if DOB is unknown, conservatively require guardian verification
    // rather than defaulting to adult — prevents minors from bypassing the gate
    // by simply not setting their date of birth.
    const studentAge = student.dob
      ? Math.floor((Date.now() - new Date(student.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : 0;
    const requiresGuardian = studentAge <= 12 && (log_type === 'manual' || log_type === 'media_upload');

    // Find guardian if needed
    let guardianId = '';
    let guardianName = '';
    if (requiresGuardian && student.family_id) {
      const familyUsers = await base44.asServiceRole.entities.User.filter({ family_id: student.family_id }).catch(() => []);
      const guardian = familyUsers.find((u: Record<string, unknown>) => u.family_role === 'primary_guardian') ||
                       familyUsers.find((u: Record<string, unknown>) => u.family_role === 'secondary_guardian');
      if (guardian) {
        guardianId = guardian.id as string;
        guardianName = guardian.full_name as string;
      }
    }

    const verificationStatus = requiresGuardian ? 'pending_guardian' : 'auto_verified';

    // Create the log
    const log = await base44.asServiceRole.entities.ChallengeLog.create({
      challenge_id, challenge_title: challenge.title,
      student_id: targetStudentId, student_name: student.full_name,
      family_id: student.family_id,
      logged_value: Number(logged_value), log_type,
      proof_media_url, proof_description,
      verification_status: verificationStatus,
      logged_by_id: user.id, logged_by_name: user.full_name,
      guardian_id: guardianId, guardian_name: guardianName,
      requires_guardian: requiresGuardian,
    });

    let newScore = participant.current_score || 0;
    let completed = false;
    let badgeAwarded = false;

    // Only update score if auto-verified (pending_guardian waits for approval)
    if (verificationStatus === 'auto_verified') {
      newScore = (participant.current_score || 0) + Number(logged_value);
      const target = challenge.target_goal_value || 0;
      completed = newScore >= target;

      await base44.asServiceRole.entities.ChallengeParticipant.update(participant.id, {
        current_score: newScore,
        last_log_date: new Date().toISOString(),
        status: completed ? 'completed' : 'active',
        completion_date: completed ? new Date().toISOString() : undefined,
      });

      // Award badge on completion
      if (completed) {
        const existingBadge = await base44.asServiceRole.entities.ChallengeBadge.filter({
          challenge_id, student_id: targetStudentId,
        }).catch(() => []);

        if (existingBadge.length === 0) {
          await base44.asServiceRole.entities.ChallengeBadge.create({
            student_id: targetStudentId, student_name: student.full_name,
            family_id: student.family_id,
            challenge_id, challenge_title: challenge.title,
            badge_name: challenge.badge_name || `${challenge.title} Champion`,
            badge_graphic_url: challenge.badge_graphic_url,
            date_earned: new Date().toISOString(),
            reward_fulfilled: false,
          });
          badgeAwarded = true;

          // Update completion count
          await base44.asServiceRole.entities.Challenge.update(challenge_id, {
            completion_count: (challenge.completion_count || 0) + 1,
          });

          // Notify admin — Reward Fulfillment Inbox
          await base44.asServiceRole.entities.Notification.create({
            recipient_type: 'admin', recipient_id: null,
            sender_id: user.id, sender_name: 'Challenge Engine',
            notification_type: 'announcement',
            preview_text: `🏆 ${student.full_name} completed "${challenge.title}"! Present their ${challenge.badge_name || 'challenge badge'} at the next class.`,
            target_type: 'post', target_id: challenge_id,
            is_read: false, aggregate_count: 1,
          }).catch(() => null);
        }
      }
    } else {
      // Pending guardian — notify the guardian
      if (guardianId) {
        await base44.asServiceRole.entities.Notification.create({
          recipient_type: 'user', recipient_id: guardianId,
          sender_id: user.id, sender_name: 'Challenge Engine',
          notification_type: 'support',
          preview_text: `📋 ${student.full_name} logged challenge activity for "${challenge.title}". Tap to verify & approve.`,
          target_type: 'message', target_id: log.id,
          is_read: false, aggregate_count: 1,
        }).catch(() => null);
      }
    }

    const progressPct = challenge.target_goal_value > 0
      ? Math.min(100, Math.round((newScore / challenge.target_goal_value) * 100))
      : 0;

    return Response.json({
      success: true, log_id: log.id,
      verification_status: verificationStatus,
      new_score: newScore, target: challenge.target_goal_value,
      progress_pct: progressPct,
      completed, badge_awarded: badgeAwarded,
      milestone: progressPct >= 25 && progressPct < 100,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});