import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { deliverAlert } from '../../shared/notify.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Require authentication — allows platform scheduler (no user) or admin, blocks anonymous/non-admin
    const isAuth = await base44.auth.isAuthenticated();
    if (!isAuth) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await base44.auth.me().catch(() => null);
    if (user && user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    // Fetch notification settings
    const settingsList = await base44.asServiceRole.entities.NotificationSettings.list().catch(() => []);
    const settings = settingsList[0] || {};
    const channel = settings.billing_alerts_channel || "email";

    const appUrl = Deno.env.get("BASE44_APP_URL") || "";

    const pastDue = await base44.asServiceRole.entities.BillingRecord.filter({ status: "past_due" }).catch(() => []);
    const failed = await base44.asServiceRole.entities.BillingRecord.filter({ status: "failed" }).catch(() => []);
    const allRecords = [...pastDue, ...failed];

    let emailsSent = 0;
    let recordsUpdated = 0;

    for (const record of allRecords) {
      const family = await base44.asServiceRole.entities.FamilyGroup.get(record.family_id).catch(() => null);
      if (!family) continue;

      const contactEmails = (family.cc_emails || "").split(",").map(e => e.trim()).filter(Boolean);
      const primaryUserId = family.primary_contact_id;
      const billingBodyLines = [
        "Hello,",
        "A recent payment for your Chosen Martial Arts Academy membership could not be processed. This may be due to an expired card or insufficient funds.",
        `<strong>Amount Due:</strong> $${(record.recurring_amount || 0).toFixed(2)}`,
        `<strong>Next Billing Date:</strong> ${record.next_billing_date || "N/A"}`,
        "We will automatically retry this charge in 3 days. To avoid any interruption in service, please update your payment method by logging into your member portal.",
      ];
      const billingPlainBody = `Hello,\n\nA recent payment for your Chosen Martial Arts Academy membership could not be processed. This may be due to an expired card or insufficient funds.\n\nAmount Due: $${(record.recurring_amount || 0).toFixed(2)}\nNext Billing Date: ${record.next_billing_date || "N/A"}\n\nWe will automatically retry this charge in 3 days. To avoid any interruption in service, please update your payment method by logging into your member portal.\n\nThank you,\nChosen Martial Arts Academy`;
      const billingInApp = {
        notification_type: "billing",
        preview_text: `Action needed: a payment of $${(record.recurring_amount || 0).toFixed(2)} could not be processed. Tap to update your payment method.`,
        target_type: "billing",
        target_id: record.id,
        sender_name: "Billing System",
      };

      if (channel === "in_app") {
        if (!primaryUserId) continue;
        const res = await deliverAlert(base44, {
          channel: "in_app",
          user_id: primaryUserId,
          inAppPayload: billingInApp,
        });
        if (res.delivered) emailsSent++;
      } else {
        if (contactEmails.length === 0) continue;
        for (const email of contactEmails) {
          const res = await deliverAlert(base44, {
            channel,
            email,
            user_id: primaryUserId,
            subject: channel === "email" ? "Action Needed: Payment Update Required" : "Action Needed: Payment Method Update Required",
            body_lines: billingBodyLines,
            plain_body: billingPlainBody,
            action_url: `${appUrl}/portal/billing`,
            action_label: "Update Payment Method",
            inAppPayload: billingInApp,
          });
          if (res.delivered) emailsSent++;
        }
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