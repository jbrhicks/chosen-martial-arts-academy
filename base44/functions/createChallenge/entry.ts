import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const body = await req.json();
    const {
      title, description, target_audience_type = 'all', target_program_id, target_program_name,
      target_rank, min_age = 0, max_age = 100, enrollment_type = 'opt_in',
      start_date, end_date, goal_type = 'attendance', target_goal_value = 10,
      unit_label = 'classes', has_leaderboard = true, badge_name, badge_graphic_url, status = 'active',
    } = body;

    if (!title) return Response.json({ error: 'Title required' }, { status: 400 });

    // Auto-archive date = end of end_date
    const autoArchiveDate = end_date ? new Date(end_date + 'T23:59:59').toISOString() : undefined;

    // Create the challenge
    const challenge = await base44.asServiceRole.entities.Challenge.create({
      title, description, target_audience_type, target_program_id, target_program_name,
      target_rank, min_age: Number(min_age), max_age: Number(max_age), enrollment_type,
      start_date, end_date, goal_type, target_goal_value: Number(target_goal_value),
      unit_label, has_leaderboard, badge_name, badge_graphic_url,
      auto_archive_date: autoArchiveDate, status,
      created_by_id: user.id, created_by_name: user.full_name,
      participant_count: 0, completion_count: 0,
    });

    // Pop-Up Community Engine: auto-create a dedicated sub-group
    const group = await base44.asServiceRole.entities.Group.create({
      group_name: `🏆 ${title}`,
      description: description || `Challenge hub for ${title}`,
      group_type: 'Challenge',
      linked_challenge_id: challenge.id,
      auto_archive_date: autoArchiveDate,
      is_private: false,
      created_by_id: user.id,
      created_by_name: user.full_name,
    }).catch(() => null);

    if (group) {
      await base44.asServiceRole.entities.Challenge.update(challenge.id, { linked_group_id: group.id });
    }

    // Auto-enroll matching participants
    let enrolledCount = 0;
    if (enrollment_type === 'auto') {
      const allUsers = await base44.asServiceRole.entities.User.list(5000).catch(() => []);
      let matching = allUsers.filter((u: Record<string, unknown>) =>
        u.role === 'student' && u.is_active !== false
      );

      if (target_audience_type === 'rank') {
        matching = matching.filter((u: Record<string, unknown>) => u.belt_rank === target_rank);
      } else if (target_audience_type === 'age_group') {
        matching = matching.filter((u: Record<string, unknown>) => {
          if (!u.dob) return false;
          const age = Math.floor((Date.now() - new Date(u.dob as string).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
          return age >= Number(min_age) && age <= Number(max_age);
        });
      } else if (target_audience_type === 'family') {
        matching = matching.filter((u: Record<string, unknown>) => !!u.family_id);
      } else if (target_audience_type === 'program' && target_program_id) {
        const enrollments = await base44.asServiceRole.entities.Enrollment.list(5000).catch(() => []);
        const matchingIds = new Set(enrollments
          .filter((e: Record<string, unknown>) =>
            (e.program_id === target_program_id || e.linked_program_id === target_program_id) &&
            e.status !== 'canceled'
          )
          .map((e: Record<string, unknown>) => e.user_id as string));
        matching = matching.filter((u: Record<string, unknown>) => matchingIds.has(u.id as string));
      }

      if (matching.length > 0) {
        const now = new Date().toISOString();
        const participants = matching.map((u: Record<string, unknown>) => ({
          challenge_id: challenge.id,
          challenge_title: title,
          student_id: u.id,
          student_name: u.full_name,
          family_id: u.family_id,
          status: 'active',
          current_score: 0,
          enrolled_date: now,
        }));
        await base44.asServiceRole.entities.ChallengeParticipant.bulkCreate(participants).catch(() => null);
        enrolledCount = matching.length;

        // Add to community group
        if (group) {
          const groupMembers = matching.map((u: Record<string, unknown>) => ({
            group_id: group.id,
            user_id: u.id,
            user_name: u.full_name,
          }));
          await base44.asServiceRole.entities.GroupMember.bulkCreate(groupMembers).catch(() => null);
        }

        await base44.asServiceRole.entities.Challenge.update(challenge.id, { participant_count: enrolledCount });
      }
    }

    return Response.json({ success: true, challenge_id: challenge.id, group_id: group?.id, enrolled: enrolledCount });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});