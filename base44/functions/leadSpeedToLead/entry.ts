import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const lead = body.data || body;

    if (!lead || !lead.id) {
      return Response.json({ error: "No lead data provided" }, { status: 400 });
    }

    // Fetch notification settings
    const settingsList = await base44.asServiceRole.entities.NotificationSettings.list().catch(() => []);
    const settings = settingsList[0] || {};
    const channel = settings.lead_alerts_channel || "email";

    const leadName = lead.full_name || "there";
    const appUrl = Deno.env.get("BASE44_APP_URL") || "";
    const trialLink = `${appUrl}/trial-booking?lead=${lead.id}`;

    // 1. Send welcome email to prospect
    if (lead.email) {
      try {
        if (channel === "email") {
          await base44.asServiceRole.functions.invoke("sendBrandedEmail", {
            to: lead.email,
            subject: "Welcome to Chosen Martial Arts Academy",
            body_lines: [
              `Hi ${leadName},`,
              "Thank you for your interest in Chosen Martial Arts Academy! We're excited to welcome you to our dojo.",
              "Your free trial pass is ready. Click the button below to book your first class.",
              "<strong>What to bring:</strong> Comfortable workout clothes, a water bottle, and a positive attitude!"
            ],
            action_url: trialLink,
            action_label: "Book Your First Class",
          });
        } else {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: lead.email,
            subject: "Welcome to Chosen Martial Arts Academy — Let's Get Your First Class Scheduled!",
            body: `Hi ${leadName},\n\nThank you for your interest in Chosen Martial Arts Academy! We're excited to welcome you to our dojo.\n\nYour free trial pass is ready. Click the link below to book your first class:\n${trialLink}\n\nWhat to bring:\n- Comfortable workout clothes\n- A water bottle\n- A positive attitude!\n\nIf you have any questions, call us at (555) 123-4567 or reply to this email.\n\nWe look forward to training with you.\n\n— The Chosen Martial Arts Academy Team\nDiscipline • Respect • Perseverance`,
          });
        }
      } catch (emailErr) {
        console.error("Welcome email failed:", emailErr);
      }
    }

    // 2. Create LeadPipeline record
    try {
      await base44.asServiceRole.entities.LeadPipeline.create({
        lead_id: lead.id,
        lead_name: lead.full_name || "",
        stage: "new_lead",
        last_contact_date: new Date().toISOString(),
      });
    } catch (pipeErr) {
      console.error("Pipeline creation failed:", pipeErr);
    }

    // 3. Create follow-up tasks (only if we have a name — not for exit-intent email-only leads)
    if (lead.full_name) {
      const today = new Date();
      const addDays = (date, days) => {
        const d = new Date(date);
        d.setDate(d.getDate() + days);
        return d.toISOString().split("T")[0];
      };

      try {
        await base44.asServiceRole.entities.FollowUpTask.bulkCreate([
          {
            lead_id: lead.id,
            lead_name: lead.full_name,
            task_type: "call",
            due_date: addDays(today, 1),
            status: "pending",
            admin_notes: "Day 1 follow-up: Call to welcome and schedule trial class.",
          },
          {
            lead_id: lead.id,
            lead_name: lead.full_name,
            task_type: "text",
            due_date: addDays(today, 3),
            status: "pending",
            admin_notes: "Day 3 follow-up: Text to check in and remind about trial.",
          },
        ]);
      } catch (taskErr) {
        console.error("Task creation failed:", taskErr);
      }
    }

    // 4. Send in-app notification to admins (no integration credits used)
    try {
      const admins = await base44.asServiceRole.entities.User.filter({ role: "admin" });
      const leadDisplayName = lead.full_name || lead.email || "New Prospect";
      const alertBody = [
        `A new lead has just submitted a trial request!`,
        `Name: ${lead.full_name || "N/A"}`,
        `Email: ${lead.email || "N/A"}`,
        `Phone: ${lead.phone || "N/A"}`,
        `Program: ${lead.program_of_interest || lead.interest || "Not specified"}`,
        `Inquiring for: ${lead.inquiry_type === "child" ? "My Child" : "Myself"}`,
        `Source: ${lead.lead_source || "Website"}`,
        `View this lead in the CRM to follow up immediately.`,
      ].join("\n");

      const thread = await base44.asServiceRole.entities.MessageThread.create({
        thread_name: `⚡ New Lead — ${leadDisplayName}`,
        type: "support",
        created_by_id: lead.linked_user_id || null,
        support_category: "general",
        is_admin_managed: true,
        last_message_preview: alertBody.slice(0, 140),
        last_message_date: new Date().toISOString(),
      });

      for (const admin of admins) {
        await base44.asServiceRole.entities.ThreadParticipant.create({
          thread_id: thread.id,
          user_id: admin.id,
          user_name: admin.full_name,
          joined_date: new Date().toISOString(),
          is_admin: true,
          unread_count: 1,
        });
      }

      await base44.asServiceRole.entities.Message.create({
        thread_id: thread.id,
        sender_id: admins[0]?.id || null,
        sender_name: "Lead System",
        content: alertBody,
        message_type: "private",
        channel_used: "in_app",
      });
    } catch (adminErr) {
      console.error("Admin in-app alert failed:", adminErr);
    }

    // 5. Mark welcome email as sent
    try {
      await base44.asServiceRole.entities.Lead.update(lead.id, { welcome_email_sent: true });
    } catch (updateErr) {
      console.error("Lead update failed:", updateErr);
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});