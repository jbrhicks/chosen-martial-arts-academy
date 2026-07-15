import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function escapeHtml(str: string): string {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatTime(time: string): string {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  if (isNaN(h)) return time;
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

function generateGoogleCalendarUrl(title: string, description: string, startDate: string, startTime: string, endTime: string, location: string): string {
  const start = new Date(`${startDate}T${startTime || "09:00"}:00`);
  const end = endTime ? new Date(`${startDate}T${endTime}:00`) : new Date(start.getTime() + 60 * 60 * 1000);
  const formatDate = (date: Date) => date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${formatDate(start)}/${formatDate(end)}`,
    details: description,
  });
  if (location) params.set("location", location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { lead_id, class_id, class_name, trial_date, start_time, end_time, instructor, location, student_age, lead_email } = body;

    if (!lead_id || !class_id || !trial_date) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Fetch lead and class to validate age eligibility
    let lead = null;
    try {
      lead = await base44.asServiceRole.entities.Lead.get(lead_id);
    } catch (e) {
      return Response.json({ error: "Lead not found" }, { status: 404 });
    }

    // Verify caller identity matches the lead (self-service access control)
    if (!lead_email || lead.email.toLowerCase() !== lead_email.toLowerCase()) {
      return Response.json({ error: "Email does not match this lead record" }, { status: 403 });
    }

    let cls = null;
    try {
      cls = await base44.asServiceRole.entities.ClassSchedule.get(class_id);
    } catch (e) {
      return Response.json({ error: "Class not found" }, { status: 404 });
    }

    // Use student_age from request if provided (frontend doesn't have admin access to update lead)
    const effectiveAge = student_age != null ? student_age : lead.student_age;

    // Server-side age validation
    if (effectiveAge != null && cls) {
      const age = effectiveAge;
      let minAge = cls.min_age || 0;
      let maxAge = cls.max_age || 0;
      // Derive from age_preset if explicit bounds not set
      if (minAge === 0 && maxAge === 0) {
        if (cls.age_preset === "Youth") { minAge = 4; maxAge = 12; }
        else if (cls.age_preset === "Teen/Adult") { minAge = 13; maxAge = 99; }
      }
      if (minAge > 0 && age < minAge) {
        return Response.json({ error: `This class requires age ${minAge}+. The student is ${age}.` }, { status: 403 });
      }
      if (maxAge > 0 && maxAge < 99 && age > maxAge) {
        return Response.json({ error: `This class is for ages ${minAge}-${maxAge}. The student is ${age}.` }, { status: 403 });
      }
    }

    // Update the lead with trial booking info (and sync student_age from the form)
    const leadUpdate: Record<string, any> = {
      trial_class_id: class_id,
      trial_class_name: class_name,
      trial_date: trial_date,
      pipeline_stage: "trial_booked",
    };
    if (student_age != null) leadUpdate.student_age = student_age;
    await base44.asServiceRole.entities.Lead.update(lead_id, leadUpdate);

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

    // Send branded confirmation email
    if (lead && lead.email) {
      try {
        const appUrl = Deno.env.get("BASE44_APP_URL") || "";
        const formattedDate = new Date(trial_date + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
        const timeStr = start_time ? `${formatTime(start_time)}${end_time ? ` – ${formatTime(end_time)}` : ""}` : "TBD";

        const safeClassName = escapeHtml(class_name);
        const safeInstructor = escapeHtml(instructor);
        const safeLocation = escapeHtml(location);
        const safeFullName = escapeHtml(lead.full_name);

        const calDescription = `Free Trial Class at Chosen Martial Arts Academy\n\nClass: ${class_name}\nDate: ${formattedDate}\nTime: ${timeStr}\nInstructor: ${instructor || "TBD"}\n\nWhat to bring:\n- Comfortable workout clothes\n- A water bottle\n- A positive attitude!\n\nWe can't wait to see you on the mat!`;
        const calUrl = generateGoogleCalendarUrl(`Free Trial — ${class_name}`, calDescription, trial_date, start_time, end_time, location || "");

        await base44.asServiceRole.functions.invoke("sendBrandedEmail", {
          to: lead.email,
          subject: "Trial Class Confirmed!",
          body_lines: [
            `Hi ${safeFullName || "there"},`,
            "Your trial class is officially booked! Here are your details:",
            `<strong>Class:</strong> ${safeClassName}`,
            `<strong>Date:</strong> ${formattedDate}`,
            `<strong>Time:</strong> ${timeStr}`,
            safeInstructor ? `<strong>Instructor:</strong> ${safeInstructor}` : "",
            safeLocation ? `<strong>Location:</strong> ${safeLocation}` : "",
            "",
            "<strong>What to bring:</strong> Comfortable workout clothes, a water bottle, and a positive attitude!",
            `Add this class to your calendar so you don't forget: <a href="${calUrl}" style="color:#C9A84C;text-decoration:underline;">Google Calendar</a>`,
            "",
            "Want to get a head start? Create your free member account to explore our curriculum, meet the community, and track your progress after your trial.",
          ].filter(Boolean),
          action_url: `${appUrl}/register`,
          action_label: "Create Your Free Account",
          footer_note: "Need to reschedule? Call us at (555) 123-4567.<br><br>Chosen Martial Arts Academy<br>Discipline &bull; Respect &bull; Perseverance",
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