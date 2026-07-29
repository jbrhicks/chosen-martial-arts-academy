import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const challenges = await base44.asServiceRole.entities.FamilyChallenge.filter({ status: 'active' }).catch(() => []);

    if (!user.family_id) {
      return Response.json({ success: true, challenges, myProgress: [], leaderboard: [] });
    }

    const [allFamilies, allUsers] = await Promise.all([
      base44.asServiceRole.entities.FamilyGroup.list().catch(() => []),
      base44.asServiceRole.entities.User.list().catch(() => []),
    ]);

    // Build family-to-students map
    const familyStudentsMap: Record<string, string[]> = {};
    allUsers.forEach((u: Record<string, unknown>) => {
      const fid = u.family_id as string;
      if (fid && u.family_role === 'student') {
        if (!familyStudentsMap[fid]) familyStudentsMap[fid] = [];
        familyStudentsMap[fid].push(u.id as string);
      }
    });

    // Fetch all attendance and progress in bulk
    const allAttendance = await base44.asServiceRole.entities.AttendanceRecord.list('-check_in_date', 5000).catch(() => []);
    const allProgress = await base44.asServiceRole.entities.StudentProgress.filter({ status: 'completed' }).catch(() => []);

    const myStudentIds = familyStudentsMap[user.family_id] || [];

    // Compute my family's progress per challenge
    const myProgress = challenges.map((ch: Record<string, unknown>) => {
      const chType = ch.challenge_type as string;
      const target = ch.target_value as number;
      const startDate = ch.start_date ? new Date(ch.start_date as string) : new Date(0);
      const endDate = ch.end_date ? new Date(ch.end_date as string) : new Date(8640000000000000);

      let currentValue = 0;
      if (chType === 'attendance_count') {
        currentValue = allAttendance.filter((a: Record<string, unknown>) =>
          myStudentIds.includes(a.user_id as string) &&
          new Date(a.check_in_date as string) >= startDate &&
          new Date(a.check_in_date as string) <= endDate
        ).length;
      } else if (chType === 'goal_completions') {
        currentValue = allProgress.filter((p: Record<string, unknown>) =>
          myStudentIds.includes(p.user_id as string)
        ).length;
      }

      return {
        challenge_id: ch.id,
        current_value: currentValue,
        target_value: target,
        progress_pct: target > 0 ? Math.min(100, Math.round((currentValue / target) * 100)) : 0,
      };
    });

    // Build leaderboard per challenge
    const leaderboard = challenges.map((ch: Record<string, unknown>) => {
      const chType = ch.challenge_type as string;
      const startDate = ch.start_date ? new Date(ch.start_date as string) : new Date(0);
      const endDate = ch.end_date ? new Date(ch.end_date as string) : new Date(8640000000000000);

      const entries: Array<{ family_name: string; family_id: string; value: number; is_me: boolean }> = [];
      for (const fam of allFamilies) {
        const famStudentIds = familyStudentsMap[fam.id as string] || [];
        if (famStudentIds.length === 0) continue;

        let value = 0;
        if (chType === 'attendance_count') {
          value = allAttendance.filter((a: Record<string, unknown>) =>
            famStudentIds.includes(a.user_id as string) &&
            new Date(a.check_in_date as string) >= startDate &&
            new Date(a.check_in_date as string) <= endDate
          ).length;
        } else if (chType === 'goal_completions') {
          value = allProgress.filter((p: Record<string, unknown>) =>
            famStudentIds.includes(p.user_id as string)
          ).length;
        }

        entries.push({
          family_name: fam.family_name as string,
          family_id: fam.id as string,
          value,
          is_me: fam.id === user.family_id,
        });
      }

      entries.sort((a, b) => b.value - a.value);
      return { challenge_id: ch.id, entries: entries.slice(0, 10) };
    });

    return Response.json({
      success: true,
      challenges,
      myProgress,
      leaderboard,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});