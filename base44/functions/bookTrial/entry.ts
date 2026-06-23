import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { lead_id, class_id, class_name, trial_date } = body;

    if (!lead_id || !class_id || !trial_date) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Update the lead with trial booking info
    await base44.asServiceRole.entities.Lead.update(lead_id, {
      trial_class_id: class_id,
      trial_class_name: class_name,
      trial_date: trial_date,
      pipeline_stage: "trial_booked",
    });

    // Update LeadPipeline if exists
    try {
      const pipelines = await base44.asServiceRole.entities.LeadPipeline.filter({ lead_id });
      if (pipelines.length > 0) {
        await base44.asServiceRole.entities.LeadPipeline.update(pipelines[0].id, {
          stage: "trial_booked",
          last_contact_date: new Date().toISOString(),
        });
      }
    } catch (pipeErr) {
      console.error("Pipeline update failed:", pipeErr);
    }

    // Get lead info for confirmation email
    let lead = null;
    try {
      lead = await base44.asServiceRole.entities.Lead.get(lead_id);
    } catch (e) {
      console.error("Lead fetch failed:", e);
    }

    // Send confirmation email
    if (lead && lead.email) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: lead.email,
          subject: "Trial Class Confirmed — Chosen Martial Arts Academy",
          body: `Hi ${lead.full_name || "there"},\n\nYour trial class has been booked!\n\nClass: ${class_name}\nDate: ${new Date(trial_date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}\n\nWhat to bring:\n- Comfortable workout clothes\n- A water bottle\n- A positive attitude!\n\nWe can't wait to see you on the mat. If you need to reschedule, call us at (555) 123-4567.\n\n— The Chosen Martial Arts Academy Team`,
        });
      } catch (e) {
        console.error("Confirmation email failed:", e);
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});