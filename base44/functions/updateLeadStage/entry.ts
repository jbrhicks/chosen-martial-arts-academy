import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { lead_id, new_stage, admin_name } = await req.json();
    if (!lead_id || !new_stage) {
      return Response.json({ error: 'lead_id and new_stage are required' }, { status: 400 });
    }

    const STAGE_LABELS = {
      new_lead: 'New Lead',
      contacted: 'Contacted',
      trial_booked: 'Trial Booked',
      showed_up: 'Trial Attended',
      won: 'Won / Enrolled',
      lost: 'Lost',
    };

    // Fetch current lead
    const lead = await base44.asServiceRole.entities.Lead.get(lead_id);
    const oldStage = lead.pipeline_stage || 'new_lead';

    if (oldStage === new_stage) {
      return Response.json({ success: true, message: 'No stage change' });
    }

    // 1. Update lead stage
    await base44.asServiceRole.entities.Lead.update(lead_id, { pipeline_stage: new_stage });

    // 2. Update LeadPipeline record
    try {
      const pipelines = await base44.asServiceRole.entities.LeadPipeline.filter({ lead_id });
      if (pipelines.length > 0) {
        await base44.asServiceRole.entities.LeadPipeline.update(pipelines[0].id, {
          stage: new_stage,
          last_contact_date: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.error('Pipeline update failed:', e);
    }

    // 3. Create activity log
    try {
      await base44.asServiceRole.entities.LeadActivityLog.create({
        lead_id,
        lead_name: lead.full_name || '',
        action_type: 'stage_change',
        content: `Moved from "${STAGE_LABELS[old_stage] || oldStage}" to "${STAGE_LABELS[new_stage] || new_stage}"`,
        admin_id: user.id,
        admin_name: admin_name || user.full_name || 'Admin',
        metadata: JSON.stringify({ old_stage, new_stage }),
      });
    } catch (e) {
      console.error('Activity log failed:', e);
    }

    // 4. Stage-specific automations
    const appUrl = Deno.env.get('BASE44_APP_URL') || '';

    // Trial Attended → "How did it go?" follow-up
    if (new_stage === 'showed_up' && lead.email) {
      try {
        await base44.asServiceRole.functions.invoke('sendBrandedEmail', {
          to: lead.email,
          subject: 'How Was Your First Class?',
          body_lines: [
            `Hi ${lead.full_name || 'there'},`,
            "We hope you enjoyed your trial class today! We'd love to hear how it went.",
            "Your feedback means everything to us — it helps us make sure we're the right fit for you.",
            "Ready to keep training? Reply to this email or give us a call and we'll get you set up with a membership.",
          ],
          action_url: `${appUrl}/register`,
          action_label: 'Join Now',
          footer_note: 'Call us at (555) 123-4567 with any questions.<br><br>Chosen Martial Arts Academy<br>Discipline &bull; Respect &bull; Perseverance',
        });

        await base44.asServiceRole.entities.LeadActivityLog.create({
          lead_id,
          lead_name: lead.full_name || '',
          action_type: 'email',
          content: 'Post-trial "How did it go?" email sent automatically',
          admin_id: user.id,
          admin_name: 'System',
        });
      } catch (e) {
        console.error('Post-trial email failed:', e);
      }

      // Create a follow-up task for the next day
      try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        await base44.asServiceRole.entities.FollowUpTask.create({
          lead_id,
          lead_name: lead.full_name || '',
          task_type: 'call',
          due_date: tomorrow.toISOString().split('T')[0],
          status: 'pending',
          admin_notes: 'Trial attended — call to get feedback and close the enrollment.',
        });
      } catch (e) {
        console.error('Task creation failed:', e);
      }
    }

    return Response.json({ success: true, old_stage: oldStage, new_stage });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});