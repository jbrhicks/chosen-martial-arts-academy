import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { token, first_name, email, phone } = body;

    if (!token) {
      return Response.json({ error: "Token is required" }, { status: 400 });
    }

    // Look up the pass by token (service role bypasses RLS)
    const passes = await base44.asServiceRole.entities.ReferralsGuestPass
      .filter({ pass_token: token })
      .catch(() => []);

    if (passes.length === 0) {
      return Response.json({ valid: false, error: "Pass not found" }, { status: 404 });
    }

    const pass = passes[0];

    // Validate pass is still in "generated" (unclaimed) state
    if (pass.pass_status !== "generated") {
      return Response.json({ valid: false, error: "Pass already claimed or invalid" }, { status: 410 });
    }

    const referringStudentName = pass.referring_student_name || "a Chosen student";

    // If no guest info provided, this is a validation-only request (page load)
    if (!first_name || !email) {
      return Response.json({
        valid: true,
        referring_student_name: referringStudentName,
        date_created: pass.date_created,
      });
    }

    // Claim the pass — update with guest info using service role
    await base44.asServiceRole.entities.ReferralsGuestPass.update(pass.id, {
      guest_first_name: first_name,
      guest_email: email,
      guest_phone: phone || "",
      pass_status: "claimed",
      date_claimed: new Date().toISOString(),
    });

    // Create the associated Lead with correct schema fields
    const lead = await base44.asServiceRole.entities.Lead.create({
      full_name: first_name,
      first_name: first_name,
      last_name: "",
      email: email,
      phone: phone || "",
      lead_source: "Guest Pass",
      status: "new",
      pipeline_stage: "new_lead",
      message: `Referred by ${referringStudentName} via guest pass ${token}`,
    });

    // Link the lead back to the guest pass
    await base44.asServiceRole.entities.ReferralsGuestPass.update(pass.id, {
      linked_lead_id: lead.id,
    });

    return Response.json({
      success: true,
      referring_student_name: referringStudentName,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});