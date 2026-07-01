import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Find leads linked to this user (by linked_user_id or matching email)
    const leads = await base44.asServiceRole.entities.Lead.filter({
      linked_user_id: user.id,
    }).catch(() => []);

    // Also check by email in case linking hasn't happened yet
    const emailLeads = await base44.asServiceRole.entities.Lead.filter({
      email: user.email,
    }).catch(() => []);

    const allLeads = [...leads, ...emailLeads.filter(el => !leads.some(l => l.id === el.id))];

    // Find the most recent lead with a trial booked
    const trialLeads = allLeads
      .filter((l: any) => l.trial_class_id && l.trial_date)
      .sort((a: any, b: any) => new Date(b.trial_date).getTime() - new Date(a.trial_date).getTime());

    if (trialLeads.length === 0) {
      return Response.json({ hasTrial: false });
    }

    const lead = trialLeads[0];

    // Fetch the class details
    let classDetails = null;
    if (lead.trial_class_id) {
      try {
        classDetails = await base44.asServiceRole.entities.ClassSchedule.get(lead.trial_class_id);
      } catch (e) {
        // Class might have been deleted
      }
    }

    return Response.json({
      hasTrial: true,
      trial: {
        lead_id: lead.id,
        class_name: lead.trial_class_name || classDetails?.class_name,
        trial_date: lead.trial_date,
        start_time: classDetails?.start_time || null,
        end_time: classDetails?.end_time || null,
        instructor: classDetails?.instructor || null,
        location: classDetails?.location || null,
        pipeline_stage: lead.pipeline_stage,
        class_id: lead.trial_class_id,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});