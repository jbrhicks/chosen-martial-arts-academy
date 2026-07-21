import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { hashPin, verifyPin } from '../../shared/pinHash.ts';

const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function clientKey(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('cf-connecting-ip')
    || req.headers.get('x-real-ip')
    || 'unknown';
}

function rateLimit(key: string): boolean {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || now >= entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  entry.count += 1;
  return entry.count <= MAX_ATTEMPTS;
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { pin, device_name, action, session_id } = body;

    // Lock action: end the session (verify session exists first)
    if (action === 'lock' && session_id) {
      let session = null;
      try {
        session = await base44.asServiceRole.entities.KioskSession.get(session_id);
      } catch {
        return Response.json({ error: 'Session not found' }, { status: 404 });
      }
      if (!session || !session.is_active) {
        return Response.json({ error: 'Session not active' }, { status: 400 });
      }
      await base44.asServiceRole.entities.KioskSession.update(session_id, {
        end_time: new Date().toISOString(),
        is_active: false,
      });
      return Response.json({ success: true });
    }

    // Unlock action: verify admin PIN only (never student check-in PINs)
    const ip = clientKey(req);
    if (!rateLimit(`unlock:${ip}`)) {
      return Response.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
    }

    if (!pin) return Response.json({ error: 'PIN is required' }, { status: 400 });
    const normalizedPin = String(pin).trim();
    if (!/^\d{4,6}$/.test(normalizedPin)) {
      return Response.json({ error: 'Invalid PIN' }, { status: 401 });
    }

    const admins = await base44.asServiceRole.entities.User.filter({
      role: 'admin',
    }).catch(() => []);
    let admin = null;
    for (const a of admins) {
      if (!a.pin_code) continue;
      const { valid, needsUpgrade } = await verifyPin(normalizedPin, String(a.pin_code));
      if (valid) {
        admin = a;
        if (needsUpgrade) {
          const hashedPin = await hashPin(normalizedPin, a.id);
          await base44.asServiceRole.entities.User.update(a.id, { pin_code: hashedPin }).catch(() => {});
        }
        break;
      }
    }
    if (!admin) {
      return Response.json({ error: 'Invalid PIN' }, { status: 401 });
    }

    const session = await base44.asServiceRole.entities.KioskSession.create({
      admin_id: admin.id,
      admin_name: admin.full_name,
      start_time: new Date().toISOString(),
      device_name: device_name || 'Front Desk Tablet',
      is_active: true,
    });

    // Return only session_id and display name — do NOT expose admin_id or PIN
    return Response.json({ success: true, admin_name: admin.full_name, session_id: session.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});