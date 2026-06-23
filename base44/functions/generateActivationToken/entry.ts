import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { email, first_name } = body;

    if (!email) return Response.json({ error: "Email is required" }, { status: 400 });

    // Find the user by email
    const users = await base44.asServiceRole.entities.User.filter({ email });
    if (users.length === 0) return Response.json({ error: "User not found" }, { status: 404 });
    const user = users[0];

    // Generate cryptographic token
    const token = crypto.randomUUID();
    const expiration = new Date();
    expiration.setHours(expiration.getHours() + 48);

    // Store token on user record
    await base44.asServiceRole.entities.User.update(user.id, {
      activation_token: token,
      token_expiration: expiration.toISOString(),
      account_status: "pending_activation",
    });

    // Build activation URL
    const baseUrl = Deno.env.get("BASE44_APP_URL") || "";
    const activationUrl = `${baseUrl}/activate?token=${token}`;
    const firstName = first_name || (user.full_name ? user.full_name.split(" ")[0] : "there");

    // Send welcome email with HTML template
    const htmlBody = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:Helvetica,Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#0A0A0A;">
    <div style="background:#000;padding:40px 20px;text-align:center;border-bottom:2px solid #C9A84C;">
      <div style="display:inline-block;width:60px;height:60px;border:3px solid #C9A84C;margin-bottom:16px;line-height:54px;">
        <span style="font-size:32px;color:#C9A84C;font-weight:bold;">C</span>
      </div>
      <h1 style="color:#fff;font-size:22px;margin:0;letter-spacing:2px;text-transform:uppercase;">Chosen Martial Arts Academy</h1>
      <p style="color:#A8A9AD;font-size:11px;letter-spacing:3px;text-transform:uppercase;margin-top:8px;">Discipline &bull; Respect &bull; Perseverance</p>
    </div>
    <div style="padding:40px 30px;">
      <h2 style="color:#C9A84C;font-size:20px;margin-bottom:20px;">Welcome to the family, ${firstName}!</h2>
      <p style="color:#fff;font-size:16px;line-height:1.6;">Your enrollment is complete. To access your digital curriculum, view the class schedule, and join our private community feed, please activate your app account.</p>
      <div style="text-align:center;margin:36px 0;">
        <a href="${activationUrl}" style="display:inline-block;background:#C9A84C;color:#000;font-weight:bold;font-size:14px;letter-spacing:2px;text-transform:uppercase;padding:16px 40px;text-decoration:none;">Activate My Account</a>
      </div>
      <p style="color:#A8A9AD;font-size:13px;line-height:1.6;">This link will expire in 48 hours. If you did not expect this email, please ignore it.</p>
      <hr style="border:none;border-top:1px solid #333;margin:32px 0;">
      <div style="text-align:center;">
        <p style="color:#A8A9AD;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin-bottom:16px;">Download Our App</p>
        <div style="display:inline-block;margin:0 4px;">
          <span style="display:inline-block;background:#1a1a1a;color:#fff;border:1px solid #A8A9AD;padding:10px 20px;font-size:13px;border-radius:8px;">&#63743; App Store</span>
        </div>
        <div style="display:inline-block;margin:0 4px;">
          <span style="display:inline-block;background:#1a1a1a;color:#fff;border:1px solid #A8A9AD;padding:10px 20px;font-size:13px;border-radius:8px;">&#9654; Google Play</span>
        </div>
      </div>
    </div>
    <div style="padding:20px 30px;border-top:1px solid #333;text-align:center;">
      <p style="color:#A8A9AD;font-size:11px;">&copy; 2026 Chosen Martial Arts Academy. All rights reserved.</p>
      <p style="color:#A8A9AD;font-size:11px;margin-top:4px;">Discipline &bull; Respect &bull; Perseverance</p>
    </div>
  </div>
</body>
</html>`;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: email,
      subject: "Welcome to Chosen Martial Arts Academy — Activate Your Account",
      body: htmlBody,
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});