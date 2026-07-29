/**
 * Delivers an alert via the configured NotificationSettings channel, with an
 * automatic in-app fallback when an external channel (email/sms) fails.
 *
 *   "email"  -> branded formatted email (sendBrandedEmail)
 *   "sms"    -> plain-text email (Core.SendEmail)
 *   "in_app" -> in-app notification only (createNotification)
 *
 * On external delivery failure, falls back to an in-app notification when a
 * user_id is available (or recipient_type is "admin"), so an alert still
 * reaches someone even when email/SMS delivery breaks.
 *
 * Returns { delivered: boolean, usedChannel: string }.
 */
export async function deliverAlert(base44, opts) {
  const {
    channel = "email",
    email,
    user_id,
    subject,
    body_lines,
    plain_body,
    action_url,
    action_label,
    inAppPayload,
  } = opts;

  const sendInApp = async () => {
    if (!inAppPayload) return false;
    try {
      await base44.asServiceRole.functions.invoke("createNotification", {
        recipient_id: user_id || undefined,
        recipient_type: user_id ? "user" : (inAppPayload.recipient_type || "admin"),
        notification_type: inAppPayload.notification_type,
        preview_text: inAppPayload.preview_text,
        target_type: inAppPayload.target_type || "none",
        target_id: inAppPayload.target_id,
        sender_name: inAppPayload.sender_name,
      });
      return true;
    } catch (e) {
      console.error("in-app delivery failed", e);
      return false;
    }
  };

  if (channel === "in_app") {
    const ok = await sendInApp();
    return { delivered: ok, usedChannel: "in_app" };
  }

  try {
    if (!email) throw new Error("No email address available");
    if (channel === "email") {
      await base44.asServiceRole.functions.invoke("sendBrandedEmail", {
        to: email,
        subject,
        body_lines: body_lines || [],
        action_url,
        action_label,
      });
    } else {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: email,
        subject,
        body: plain_body,
      });
    }
    return { delivered: true, usedChannel: channel };
  } catch (e) {
    console.error(`${channel} delivery failed for ${email}, attempting in-app fallback`, e);
    const ok = await sendInApp();
    return { delivered: ok, usedChannel: ok ? "in_app" : "failed" };
  }
}