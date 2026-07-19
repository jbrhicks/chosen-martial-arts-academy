import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// In-memory rate limit (per isolate). Enough to blunt PIN spraying on public kiosk.
const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_PIN_ATTEMPTS = 10;
const MAX_LOOKUP_ATTEMPTS = 30;

function clientKey(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('cf-connecting-ip')
    || req.headers.get('x-real-ip')
    || 'unknown';
}

function rateLimit(key: string, max: number): boolean {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || now >= entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  entry.count += 1;
  return entry.count <= max;
}

function publicUser(u: Record<string, unknown>) {
  return {
    id: u.id,
    full_name: u.full_name,
    email: u.email,
    phone: u.phone,
    family_id: u.family_id,
    belt_rank: u.belt_rank,
    profile_photo: u.profile_photo,
    role: u.role,
    is_active: u.is_active,
  };
}

function isCheckInEligible(u: Record<string, unknown>): boolean {
  if (u.role === 'admin') return false;
  if (u.is_active === false) return false;
  if (u.account_status === 'pending_activation') return false;
  return true;
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const action = body.action || (body.pin ? 'pin' : null);
    const ip = clientKey(req);

    if (!action) {
      return Response.json({ error: 'action is required' }, { status: 400 });
    }

    if (action === 'pin') {
      if (!rateLimit(`pin:${ip}`, MAX_PIN_ATTEMPTS)) {
        return Response.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
      }
      const pin = String(body.pin || '').trim();
      if (!/^\d{4,6}$/.test(pin)) {
        return Response.json({ error: 'Invalid PIN' }, { status: 401 });
      }

      const matches = await base44.asServiceRole.entities.User.filter({ pin_code: pin }).catch(() => []);
      const user = matches.find(isCheckInEligible);
      if (!user) {
        return Response.json({ error: 'Invalid PIN' }, { status: 401 });
      }
      return Response.json({ success: true, user: publicUser(user) });
    }

    if (!rateLimit(`lookup:${ip}`, MAX_LOOKUP_ATTEMPTS)) {
      return Response.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
    }

    if (action === 'id') {
      const id = String(body.id || '').trim();
      if (!id) return Response.json({ error: 'id is required' }, { status: 400 });
      const user = await base44.asServiceRole.entities.User.get(id).catch(() => null);
      if (!user || !isCheckInEligible(user)) {
        return Response.json({ error: 'Not found' }, { status: 404 });
      }
      return Response.json({ success: true, user: publicUser(user) });
    }

    if (action === 'phone') {
      const phone = String(body.phone || '').trim();
      if (!phone) return Response.json({ error: 'phone is required' }, { status: 400 });
      const digits = phone.replace(/\D/g, '');
      const all = await base44.asServiceRole.entities.User.list().catch(() => []);
      const user = all.find((u: Record<string, unknown>) => {
        if (!isCheckInEligible(u) || !u.phone) return false;
        const ud = String(u.phone).replace(/\D/g, '');
        return ud === digits || ud.endsWith(digits) || digits.endsWith(ud);
      });
      if (!user) return Response.json({ error: 'Not found' }, { status: 404 });
      return Response.json({ success: true, user: publicUser(user) });
    }

    if (action === 'search') {
      const query = String(body.query || '').trim().toLowerCase();
      // Require 3+ characters to make directory harvesting impractical
      if (query.length < 3) {
        return Response.json({ success: true, users: [] });
      }
      const all = await base44.asServiceRole.entities.User.list().catch(() => []);
      const users = all
        .filter((u: Record<string, unknown>) => {
          if (!isCheckInEligible(u)) return false;
          const name = String(u.full_name || '').toLowerCase();
          // Match on name only (not email) to prevent PII harvesting via email fragments
          return name.includes(query);
        })
        .slice(0, 10)
        // Return only id + full_name — no email, phone, belt_rank, or other PII
        .map((u: Record<string, unknown>) => ({
          id: u.id,
          full_name: u.full_name,
        }));
      return Response.json({ success: true, users });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});