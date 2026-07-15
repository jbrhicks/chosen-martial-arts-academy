import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const LOGO_URL = "https://media.base44.com/images/public/6a395a5a04e2d6cac8d5ae37/aed888868_CMAALogoNobackground.png";

function buildBrandedEmail(subject, bodyLines, actionUrl, actionLabel, footerNote) {
  const bodyHtml = bodyLines
    .map(line => `<p style="margin:0 0 12px;color:#ffffff;font-size:15px;line-height:1.6;">${line}</p>`)
    .join('');

  const actionButton = actionUrl && actionLabel
    ? `<tr><td align="center" style="padding:8px 40px 32px;"><a href="${actionUrl}" style="display:inline-block;background:#C9A84C;color:#000000;font-weight:bold;font-size:14px;text-transform:uppercase;letter-spacing:1px;padding:14px 36px;text-decoration:none;border-radius:4px;">${actionLabel}</a></td></tr>`
    : '';

  const footer = footerNote || 'Chosen Martial Arts Academy<br>Discipline &bull; Respect &bull; Perseverance';

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0A;">
<tr><td align="center" style="padding:32px 16px;">
<table width="600" cellpadding="0" cellspacing="0" style="background:#111111;border:1px solid #333333;max-width:600px;">
<tr><td align="center" style="padding:32px 0 12px;"><img src="${LOGO_URL}" alt="Chosen Martial Arts Academy" width="72" height="72" style="display:block;" /></td></tr>
<tr><td align="center" style="padding:0 32px 8px;"><h1 style="color:#C9A84C;font-size:20px;font-weight:bold;text-transform:uppercase;letter-spacing:2px;margin:0;">${subject}</h1></td></tr>
<tr><td align="center" style="padding:8px 0 24px;"><div style="width:60px;height:2px;background:#C9A84C;">&nbsp;</div></td></tr>
<tr><td style="padding:0 40px 8px;">${bodyHtml}</td></tr>
${actionButton}
<tr><td style="padding:24px 40px 32px;border-top:1px solid #333333;text-align:center;"><p style="color:#A8A9AD;font-size:12px;margin:0;line-height:1.5;">${footer}</p></td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const isAuth = await base44.auth.isAuthenticated();
    if (!isAuth) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await base44.auth.me().catch(() => null);
    if (user && user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    const { to, subject, body_lines, action_url, action_label, footer_note } = await req.json();

    if (!to || !subject || !body_lines) {
      return Response.json({ error: "to, subject, and body_lines are required" }, { status: 400 });
    }

    const html = buildBrandedEmail(subject, body_lines, action_url, action_label, footer_note);

    await base44.asServiceRole.integrations.Core.SendEmail({
      to,
      subject,
      body: html,
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});