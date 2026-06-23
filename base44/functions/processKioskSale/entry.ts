import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { items, user_id, user_name, user_email, payment_method, discount_code } = body;

    if (!items || !items.length) return Response.json({ error: "No items in cart" }, { status: 400 });

    // Deduct inventory and calculate total
    let total = 0;
    const receiptItems = [];
    for (const item of items) {
      const inv = await base44.asServiceRole.entities.Inventory.get(item.id);
      if (!inv) return Response.json({ error: `${item.item_name} not found` }, { status: 400 });
      if (inv.stock_quantity < item.quantity) {
        return Response.json({ error: `${inv.item_name} is out of stock (only ${inv.stock_quantity} left)` }, { status: 400 });
      }
      const lineTotal = inv.price * item.quantity;
      total += lineTotal;
      receiptItems.push({ name: inv.item_name, quantity: item.quantity, price: inv.price, lineTotal });
      await base44.asServiceRole.entities.Inventory.update(item.id, {
        stock_quantity: inv.stock_quantity - item.quantity,
      });
    }

    // Apply discount if code provided
    let discountAmount = 0;
    let appliedPromo = null;
    if (discount_code) {
      const promos = await base44.asServiceRole.entities.DiscountsPromos.filter({ promo_code: discount_code, is_active: true });
      const promo = promos[0];
      if (!promo) return Response.json({ error: "Invalid discount code" }, { status: 400 });
      if (promo.expiration_date && new Date(promo.expiration_date) < new Date()) {
        return Response.json({ error: "This discount code has expired" }, { status: 400 });
      }
      if (promo.usage_limit && (promo.usage_count || 0) >= promo.usage_limit) {
        return Response.json({ error: "This discount code has reached its usage limit" }, { status: 400 });
      }
      discountAmount = promo.discount_type === "percentage"
        ? total * (promo.amount / 100)
        : Math.min(promo.amount, total);
      total = Math.max(0, total - discountAmount);
      appliedPromo = promo;

      // Track redemption
      try {
        await base44.asServiceRole.entities.DiscountRedemption.create({
          discount_id: promo.id,
          user_name: user_name || "Kiosk Sale",
          user_email: user_email || "",
          date_redeemed: new Date().toISOString(),
        });
      } catch (e) { console.error("Redemption tracking failed:", e); }

      // Increment usage count
      try {
        await base44.asServiceRole.entities.DiscountsPromos.update(promo.id, {
          usage_count: (promo.usage_count || 0) + 1,
        });
      } catch (e) { console.error("Usage count update failed:", e); }
    }

    // Create payment record
    const payment = await base44.asServiceRole.entities.Payment.create({
      user_id: user_id || "kiosk_pos",
      user_name: user_name || "Kiosk Sale",
      amount: total,
      payment_type: "retail",
      description: receiptItems.map(i => `${i.name} x${i.quantity}`).join(", ") + (appliedPromo ? ` (Discount: ${appliedPromo.promo_code})` : ""),
      status: "succeeded",
      payment_date: new Date().toISOString(),
    });

    // Email receipt
    if (user_email) {
      try {
        const itemLines = receiptItems.map(i => `${i.name} x${i.quantity} — $${i.lineTotal.toFixed(2)}`).join("\n");
        const subtotal = total + discountAmount;
        const discountLine = appliedPromo ? `\nDiscount (${appliedPromo.promo_code}): −$${discountAmount.toFixed(2)}\nSubtotal: $${subtotal.toFixed(2)}` : "";
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: user_email,
          subject: "Your Receipt from Chosen Martial Arts Academy",
          body: `Thank you for your purchase!\n\n${itemLines}${discountLine}\n\nTotal: $${total.toFixed(2)}\nPayment Method: ${payment_method}\n\nChosen Martial Arts Academy`,
        });
      } catch (e) { console.error("Receipt email failed:", e); }
    }

    return Response.json({ success: true, total, discount_amount: discountAmount, payment_id: payment.id, items: receiptItems });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});