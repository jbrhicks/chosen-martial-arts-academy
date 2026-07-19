import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Authenticated members may see a public directory (no secrets / medical / tokens).
    const all = await base44.asServiceRole.entities.User.list().catch(() => []);
    const directory = all
      .filter((u: Record<string, unknown>) =>
        (u.role === 'student' || u.role === 'user' || u.role === 'guest') &&
        u.is_active !== false
      )
      .map((u: Record<string, unknown>) => ({
        id: u.id,
        full_name: u.full_name,
        belt_rank: u.belt_rank,
        profile_photo: u.profile_photo,
        role: u.role,
      }));

    return Response.json({ success: true, users: directory });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
