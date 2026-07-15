import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { lead_id, admin_name } = await req.json();
    if (!lead_id) {
      return Response.json({ error: 'lead_id is required' }, { status: 400 });
    }

    const lead = await base44.asServiceRole.entities.Lead.get(lead_id);
    if (!lead.email) {
      return Response.json({ error: 'Lead has no email address' }, { status: 400 });
    }

    // 1. Invite the user (platform requires "user" role; we update to "student" after)
    let inviteResult = null;
    try {
      inviteResult = await base44.users.inviteUser(lead.email, 'user');
      // Update role to "student" if the user was created
      try {
        const existingUsers = await base44.asServiceRole.entities.User.filter({ email: lead.email });
        if (existingUsers.length > 0) {
          await base44.asServiceRole.entities.User.update(existingUsers[0].id, { role: 'student' });
        }
      } catch (roleErr) {
        console.error('Role update failed:', roleErr);
      }
    } catch (e) {
      console.error('Invite failed:', e);
      return Response.json({ error: 'Failed to invite user: ' + e.message }, { status: 500 });
    }

    // 2. Update lead to "won" / "enrolled"
    await base44.asServiceRole.entities.Lead.update(lead_id, {
      pipeline_stage: 'won',
      status: 'enrolled',
    });

    // 3. Update LeadPipeline
    try {
      const pipelines = await base44.asServiceRole.entities.LeadPipeline.filter({ lead_id });
      if (pipelines.length > 0) {
        await base44.asServiceRole.entities.LeadPipeline.update(pipelines[0].id, {
          stage: 'won',
          last_contact_date: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.error('Pipeline update failed:', e);
    }

    // 4. Log activity
    try {
      await base44.asServiceRole.entities.LeadActivityLog.create({
        lead_id,
        lead_name: lead.full_name || '',
        action_type: 'enrolled',
        content: `Lead converted to student. Invitation sent to ${lead.email}.`,
        admin_id: user.id,
        admin_name: admin_name || user.full_name || 'Admin',
      });
    } catch (e) {
      console.error('Activity log failed:', e);
    }

    // 5. Cancel any pending follow-up tasks (no longer needed)
    try {
      const tasks = await base44.asServiceRole.entities.FollowUpTask.filter({ lead_id, status: 'pending' });
      for (const task of tasks) {
        await base44.asServiceRole.entities.FollowUpTask.update(task.id, { status: 'completed' });
      }
    } catch (e) {
      console.error('Task cleanup failed:', e);
    }

    return Response.json({ success: true, invite: inviteResult });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});