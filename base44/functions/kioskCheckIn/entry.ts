import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 40;

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

    const ip = clientKey(req);
    if (!rateLimit(`checkin:${ip}`)) {
      return Response.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
    }

    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { user_id, class_name, check_in_method = 'PIN', override = false, drop_in = false } = body;

    if (!user_id || !class_name) {
      return Response.json({ error: 'user_id and class_name are required' }, { status: 400 });
    }

    const user = await base44.asServiceRole.entities.User.get(user_id).catch(() => null);
    if (!user || user.role === 'admin' || user.is_active === false) {
      return Response.json({ error: 'Invalid member' }, { status: 400 });
    }

    let dropInPrice = 0;
    if (!override && !drop_in) {
      const enrollments = await base44.asServiceRole.entities.Enrollment
        .filter({ user_id, status: 'active' })
        .catch(() => []);
      const enrollment = enrollments[0];
      if (enrollment?.linked_tier_id) {
        const tiers = await base44.asServiceRole.entities.SubscriptionTier.list().catch(() => []);
        const tier = tiers.find((t: { id: string }) => t.id === enrollment.linked_tier_id);
        if (tier && tier.classes_allowed_per_week > 0) {
          const now = new Date();
          const day = now.getDay();
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
          weekStart.setHours(0, 0, 0, 0);
          const weekAtt = await base44.asServiceRole.entities.AttendanceRecord
            .filter({ user_id })
            .catch(() => []);
          const thisWeek = weekAtt.filter((a: { check_in_date: string }) =>
            new Date(a.check_in_date) >= weekStart
          );
          if (thisWeek.length >= tier.classes_allowed_per_week) {
            return Response.json({
              success: false,
              cap_reached: true,
              weekCount: thisWeek.length,
              limit: tier.classes_allowed_per_week,
              tier_name: tier.tier_name,
            });
          }
        }
      }
    }

    if (drop_in) {
      const enrollments = await base44.asServiceRole.entities.Enrollment
        .filter({ user_id, status: 'active' })
        .catch(() => []);
      const enrollment = enrollments[0];
      const programs = await base44.asServiceRole.entities.Program.list().catch(() => []);
      const program = enrollment
        ? programs.find((p: { id: string }) => p.id === enrollment.program_id)
        : null;
      dropInPrice = program?.drop_in_price || 0;
      if (dropInPrice === 0) {
        return Response.json({
          error: 'Drop-in class purchase is not available for this program. Please see the front desk.',
        }, { status: 400 });
      }
      await base44.asServiceRole.entities.GeneralLedger.create({
        type: 'income',
        amount: dropInPrice,
        date: new Date().toISOString(),
        category: 'tuition',
        description: `Drop-in class: ${class_name} — ${user.full_name}`,
      });
    }

    await base44.asServiceRole.entities.AttendanceRecord.create({
      user_id: user.id,
      user_name: user.full_name,
      class_name,
      check_in_date: new Date().toISOString(),
      check_in_method: drop_in ? 'kiosk' : (override ? 'Manual' : check_in_method),
    });

    return Response.json({
      success: true,
      user_name: user.full_name,
      drop_in_price: dropInPrice || undefined,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
