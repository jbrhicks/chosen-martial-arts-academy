import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const pastDue = await base44.asServiceRole.entities.BillingRecord.filter({ status: "past_due" }).catch(() => []);
    const failed = await base44.asServiceRole.entities.BillingRecord.filter({ status: "failed" }).catch(() => []);
    const allRecords = [...pastDue, ...failed];

    let emailsSent = 0;
    let recordsUpdated = 0;

    for (const record of allRecords) {
      const family = await base44.asServiceRole.entities.FamilyGroup.get(record.family_id).catch(() => null);
      if (!family) continue;

      const contactEmails = (family.cc_emails || "").split(",").map(e => e.trim()).filter(Boolean);
      if (contactEmails.length === 0) continue;

      for (const email of contactEmails) {
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: email,
            subject: "Action Needed: Payment Method Update Required",
            body: `Hello,\n\nA recent payment for your Chosen Martial Arts Academy membership could not be processed. This may be due to an expired card or insufficient funds.\n\nAmount Due: $${(record.recurring_amount || 0).toFixed(2)}\nNext Billing Date: ${record.next_billing_date || "N/A"}\n\nWe will automatically retry this charge in 3 days. To avoid any interruption in service, please update your payment method by logging into your member portal.\n\nThank you,\nChosen Martial Arts Academy`,
          });
          emailsSent++;
        } catch (e) { console.error("Dunning email failed", e); }
      }

      const attempts = (record.dunning_attempts || 0) + 1;
      await base44.asServiceRole.entities.BillingRecord.update(record.id, {
        dunning_attempts: attempts,
        last_dunning_date: new Date().toISOString(),
      }).catch(() => {});
      recordsUpdated++;
    }

    return Response.json({
      success: true,
      recordsProcessed: allRecords.length,
      emailsSent,
      recordsUpdated,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});