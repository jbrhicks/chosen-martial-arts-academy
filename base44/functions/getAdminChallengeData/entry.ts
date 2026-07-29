import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    // Get all challenges
    const challenges = await base44.asServiceRole.entities.Challenge.list('-created_date', 500).catch(() => []);

    // Get reward fulfillment queue — badges earned but not yet fulfilled
    const allBadges = await base44.asServiceRole.entities.ChallengeBadge.list('-date_earned', 500).catch(() => []);
    const rewardQueue = allBadges.filter((b: Record<string, unknown>) => !b.reward_fulfilled);

    // Get recent logs
    const recentLogs = await base44.asServiceRole.entities.ChallengeLog.list('-created_date', 50).catch(() => []);

    // Get all participants for stats
    const allParticipants = await base44.asServiceRole.entities.ChallengeParticipant.list(5000).catch(() => []);

    // Build challenge stats
    const challengesWithStats = challenges.map((ch: Record<string, unknown>) => {
      const chParticipants = allParticipants.filter((p: Record<string, unknown>) => p.challenge_id === ch.id);
      const completed = chParticipants.filter((p: Record<string, unknown>) => p.status === 'completed');
      const activeCount = chParticipants.filter((p: Record<string, unknown>) => p.status === 'active').length;

      return {
        ...ch,
        participant_count: chParticipants.length,
        active_count: activeCount,
        completion_count: completed.length,
        completion_rate: chParticipants.length > 0
          ? Math.round((completed.length / chParticipants.length) * 100)
          : 0,
      };
    });

    return Response.json({
      success: true,
      challenges: challengesWithStats,
      rewardQueue,
      recentLogs,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});