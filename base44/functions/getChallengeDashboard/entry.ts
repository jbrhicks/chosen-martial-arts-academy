import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Get all active challenges
    const challenges = await base44.asServiceRole.entities.Challenge.filter({ status: 'active' }).catch(() => []);

    // Get user's participation
    const myParticipation = await base44.asServiceRole.entities.ChallengeParticipant.filter({
      student_id: user.id,
    }).catch(() => []);

    // Get user's badges (Trophy Case)
    const myBadges = await base44.asServiceRole.entities.ChallengeBadge.filter({
      student_id: user.id,
    }).catch(() => []);

    // Get pending guardian verifications (if user is a guardian)
    let pendingVerifications = [];
    const isGuardian = user.family_role === 'primary_guardian' || user.family_role === 'secondary_guardian';
    if (isGuardian && user.family_id) {
      pendingVerifications = await base44.asServiceRole.entities.ChallengeLog.filter({
        family_id: user.family_id,
        verification_status: 'pending_guardian',
      }).catch(() => []);
      pendingVerifications = pendingVerifications
        .filter((l: Record<string, unknown>) => l.student_id !== user.id)
        .sort((a: Record<string, unknown>, b: Record<string, unknown>) =>
          new Date(b.created_date as string).getTime() - new Date(a.created_date as string).getTime()
        );
    }

    // Compute progress per challenge
    // For "attendance" type: count attendance records in date range
    // For "task"/"media_proof": sum approved/auto_verified logs
    const challengeIds = challenges.map((c: Record<string, unknown>) => c.id);

    const [allLogs, allAttendance] = await Promise.all([
      challengeIds.length > 0
        ? base44.asServiceRole.entities.ChallengeLog.list(5000).catch(() => [])
        : Promise.resolve([]),
      Promise.resolve(null), // lazy-loaded below only if needed
    ]);

    // Only fetch attendance if there's an attendance-type challenge
    const hasAttendanceChallenge = challenges.some((c: Record<string, unknown>) => c.goal_type === 'attendance');
    const allAttendanceRecords = hasAttendanceChallenge
      ? await base44.asServiceRole.entities.AttendanceRecord.list(5000).catch(() => [])
      : [];

    // Build leaderboard data for challenges with has_leaderboard
    const allParticipants = await base44.asServiceRole.entities.ChallengeParticipant.list(5000).catch(() => []);

    const leaderboards = challenges
      .filter((c: Record<string, unknown>) => c.has_leaderboard)
      .map((ch: Record<string, unknown>) => {
        const chParticipants = allParticipants.filter((p: Record<string, unknown>) =>
          p.challenge_id === ch.id && p.status !== 'failed'
        );
        const entries = chParticipants
          .map((p: Record<string, unknown>) => ({
            student_id: p.student_id,
            student_name: p.student_name,
            value: p.current_score || 0,
            is_me: p.student_id === user.id,
          }))
          .sort((a: any, b: any) => b.value - a.value)
          .slice(0, 10);
        return { challenge_id: ch.id, entries };
      });

    // Build my progress per challenge
    const myProgress = challenges.map((ch: Record<string, unknown>) => {
      const chType = ch.goal_type as string;
      const target = ch.target_goal_value as number;
      const startDate = ch.start_date ? new Date(ch.start_date as string) : new Date(0);
      const endDate = ch.end_date ? new Date(ch.end_date as string) : new Date(8640000000000000);

      let currentValue = 0;
      const myParticipant = myParticipation.find((p: Record<string, unknown>) => p.challenge_id === ch.id);

      if (chType === 'attendance') {
        currentValue = allAttendanceRecords.filter((a: Record<string, unknown>) =>
          a.user_id === user.id &&
          new Date(a.check_in_date as string) >= startDate &&
          new Date(a.check_in_date as string) <= endDate
        ).length;
      } else {
        // Sum approved/auto_verified logs
        const myLogs = allLogs.filter((l: Record<string, unknown>) =>
          l.challenge_id === ch.id &&
          l.student_id === user.id &&
          (l.verification_status === 'approved' || l.verification_status === 'auto_verified')
        );
        currentValue = myLogs.reduce((sum: number, l: Record<string, unknown>) => sum + (l.logged_value as number || 0), 0);
      }

      const progressPct = target > 0 ? Math.min(100, Math.round((currentValue / target) * 100)) : 0;
      const isEnrolled = !!myParticipant;
      const status = myParticipant?.status || (isEnrolled ? 'active' : 'not_enrolled');

      return {
        challenge_id: ch.id,
        current_value: currentValue,
        target_value: target,
        progress_pct: progressPct,
        enrolled: isEnrolled,
        status,
        completion_date: myParticipant?.completion_date,
      };
    });

    return Response.json({
      success: true,
      challenges,
      myProgress,
      myBadges,
      pendingVerifications,
      leaderboards,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});