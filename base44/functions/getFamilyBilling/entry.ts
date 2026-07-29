import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!user.family_id) return Response.json({ success: true, hasFamily: false, billingRecords: [], paymentMethods: [], payments: [], totalRecurring: 0 });

    const [family, members, billingRecords, paymentMethods, tiers, enrollments] = await Promise.all([
      base44.asServiceRole.entities.FamilyGroup.get(user.family_id).catch(() => null),
      base44.asServiceRole.entities.User.filter({ family_id: user.family_id }).catch(() => []),
      base44.asServiceRole.entities.BillingRecord.filter({ family_id: user.family_id }).catch(() => []),
      base44.asServiceRole.entities.PaymentMethod.filter({ family_id: user.family_id }).catch(() => []),
      base44.asServiceRole.entities.SubscriptionTier.filter({ is_active: true }).catch(() => []),
      base44.asServiceRole.entities.Enrollment.filter({ family_id: user.family_id }).catch(() => []),
    ]);

    const paymentPromises = members.map((m: Record<string, unknown>) =>
      base44.asServiceRole.entities.Payment.filter({ user_id: m.id }).catch(() => [])
    );
    const allPayments = await Promise.all(paymentPromises);
    const payments = allPayments.flat().sort((a: Record<string, unknown>, b: Record<string, unknown>) =>
      new Date(b.payment_date || b.created_date || 0).getTime() - new Date(a.payment_date || a.created_date || 0).getTime()
    );

    const totalRecurring = billingRecords
      .filter((b: Record<string, unknown>) => b.status === 'active')
      .reduce((sum: number, b: Record<string, unknown>) => sum + (b.recurring_amount as number || 0), 0);

    return Response.json({
      success: true,
      hasFamily: true,
      family,
      members,
      billingRecords,
      paymentMethods,
      tiers,
      enrollments,
      payments,
      totalRecurring,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});