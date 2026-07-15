import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { pin, device_name, action, session_id } = body;

    // Lock action: end the session (verify session exists first)
    if (action === "lock" && session_id) {
      let session = null;
      try {
        session = await base44.asServiceRole.entities.KioskSession.get(session_id);
      } catch (e) {
        return Response.json({ error: "Session not found" }, { status: 404 });
      }
      if (!session || !session.is_active) {
        return Response.json({ error: "Session not active" }, { status: 400 });
      }
      await base44.asServiceRole.entities.KioskSession.update(session_id, {
        end_time: new Date().toISOString(),
        is_active: false,
      });
      return Response.json({ success: true });
    }

    // Unlock action: verify admin PIN
    if (!pin) return Response.json({ error: "PIN is required" }, { status: 400 });

    const admins = await base44.asServiceRole.entities.User.filter({ role: "admin", pin_code: pin });
    if (admins.length === 0) {
      return Response.json({ error: "Invalid PIN" }, { status: 401 });
    }
    const admin = admins[0];

    const session = await base44.asServiceRole.entities.KioskSession.create({
      admin_id: admin.id,
      admin_name: admin.full_name,
      start_time: new Date().toISOString(),
      device_name: device_name || "Front Desk Tablet",
      is_active: true,
    });

    // Return only session_id and display name — do NOT expose admin_id
    return Response.json({ success: true, admin_name: admin.full_name, session_id: session.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});