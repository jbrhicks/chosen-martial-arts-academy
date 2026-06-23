import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all leads that haven't booked a trial or enrolled
    const allLeads = await base44.asServiceRole.entities.Lead.list();
    const activeLeads = allLeads.filter(l =>
      (l.pipeline_stage === "new_lead" || l.pipeline_stage === "contacted" || !l.pipeline_stage) &&
      l.email
    );

    const now = new Date();
    let processed = 0;

    for (const lead of activeLeads) {
      const createdDate = new Date(lead.created_date);
      const daysSince = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
      const trialLink = `${Deno.env.get("BASE44_APP_URL") || ""}/trial-booking?lead=${lead.id}`;
      const leadName = lead.full_name || "there";

      // Day 2: Send testimonial email
      if (daysSince === 2) {
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: lead.email,
            subject: "See What Our Students Say About Chosen Martial Arts",
            body: `Hi ${leadName},\n\nStill thinking about trying martial arts? Don't just take our word for it — hear from our students themselves:\n\n"My son has gained so much confidence and discipline since joining Chosen. It's been life-changing." — Sarah M., Parent\n\n"I was nervous to start as an adult, but the instructors made me feel welcome from day one. Best decision I've ever made." — James T., Student\n\nReady to see for yourself? Book your free trial: ${trialLink}\n\n— The Chosen Martial Arts Academy Team`,
          });
          processed++;
        } catch (e) { console.error("Day 2 email failed:", e); }
      }

      // Day 4: Send facility/benefits email
      if (daysSince === 4) {
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: lead.email,
            subject: "Why Martial Arts Is More Than Just Kicks & Punches",
            body: `Hi ${leadName},\n\nAt Chosen Martial Arts Academy, we believe martial arts is about more than just physical training. It's about building:\n\n• Discipline & Focus\n• Confidence & Self-Esteem\n• Respect & Character\n• Fitness & Healthy Habits\n\nOur experienced instructors create a supportive environment where students of all ages and abilities can thrive.\n\nReady to start your journey? Book your free trial today: ${trialLink}\n\n— The Chosen Martial Arts Academy Team`,
          });
          processed++;
        } catch (e) { console.error("Day 4 email failed:", e); }
      }

      // Day 7: Final nurture email + admin task
      if (daysSince === 7) {
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: lead.email,
            subject: "Last Chance: Your Free Trial Offer Is Waiting!",
            body: `Hi ${leadName},\n\nThis is your last chance to claim your FREE 2-week trial at Chosen Martial Arts Academy!\n\nDon't miss out on this opportunity to transform your life through martial arts training. Our community is waiting to welcome you.\n\nBook now before you forget: ${trialLink}\n\n— The Chosen Martial Arts Academy Team`,
          });

          // Create a final follow-up task for the admin
          await base44.asServiceRole.entities.FollowUpTask.create({
            lead_id: lead.id,
            lead_name: lead.full_name || "",
            task_type: "call",
            due_date: now.toISOString().split("T")[0],
            status: "pending",
            admin_notes: "Day 7 follow-up: Final attempt to convert lead. Call to offer incentive (e.g., free uniform).",
          });
          processed++;
        } catch (e) { console.error("Day 7 email failed:", e); }
      }
    }

    return Response.json({ success: true, processed, totalLeads: activeLeads.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});