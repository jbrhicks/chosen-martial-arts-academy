import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { student_id, new_belt } = body;

    if (!student_id) return Response.json({ error: 'Student ID required' }, { status: 400 });

    const allUsers = await base44.entities.User.list();
    const student = allUsers.find(s => s.id === student_id);
    if (!student) return Response.json({ error: 'Student not found' }, { status: 404 });

    const enrollments = await base44.entities.Enrollment.filter({ user_id: student_id, status: 'active' });
    const programId = enrollments[0]?.program_id;
    const programName = enrollments[0]?.program;

    let beltName = new_belt;

    if (!beltName && programId) {
      const belts = await base44.entities.RankBelt.filter({ program_id: programId });
      belts.sort((a, b) => (a.rank_order || 0) - (b.rank_order || 0));
      const currentIndex = belts.findIndex(b => b.belt_name === student.belt_rank);
      if (currentIndex >= 0 && currentIndex < belts.length - 1) {
        beltName = belts[currentIndex + 1].belt_name;
      } else if (currentIndex === -1 && belts.length > 0) {
        beltName = belts[0].belt_name;
      }
    }

    if (!beltName) return Response.json({ error: 'Could not determine next belt' }, { status: 400 });

    await base44.entities.User.update(student_id, { belt_rank: beltName });

    let guardianEmail = student.email;
    if (student.family_id) {
      const family = await base44.entities.FamilyGroup.get(student.family_id).catch(() => null);
      if (family?.primary_contact_id) {
        const guardian = allUsers.find(s => s.id === family.primary_contact_id);
        if (guardian?.email) guardianEmail = guardian.email;
      }
    }

    await base44.integrations.Core.SendEmail({
      to: guardianEmail,
      subject: 'Congratulations! Belt Promotion at Chosen Martial Arts Academy',
      body: `Dear Guardian,\n\nWe are thrilled to announce that ${student.full_name} has been promoted to ${beltName}${programName ? ' in ' + programName : ''} at Chosen Martial Arts Academy!\n\nThis achievement reflects their hard work, dedication, and perseverance in training. New training videos and curriculum materials have been automatically unlocked in the member app.\n\nPlease join us in congratulating them on this milestone.\n\nSincerely,\nThe Chosen Martial Arts Academy Team`,
    });

    // Create rank-up announcement post in the Global Feed
    await base44.entities.Post.create({
      author_id: user.id,
      author_name: user.full_name,
      author_role: 'admin',
      content: `Congratulations to ${student.full_name} on earning their ${beltName}!`,
      post_type: 'rank_up',
      rank_up_student_name: student.full_name,
      rank_up_new_belt: beltName,
      like_count: 0,
      comment_count: 0,
      share_count: 0,
      bow_count: 0,
      high_five_count: 0,
    });

    return Response.json({ success: true, new_belt: beltName, student_name: student.full_name });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});