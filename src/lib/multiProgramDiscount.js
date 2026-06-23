/**
 * Multi-Program Discount calculation utility.
 *
 * @param {Array<{programName: string, price: number}>} programPrices - prices for a single student's programs
 * @param {{discount_type: string, amount: number, applies_to: string}|null} discountConfig - the multi_program discount rule
 * @returns {{discountAmount: number, breakdown: Array<{programName: string, price: number, discount: number, net: number}>}}
 */
export function calculateMultiProgramDiscount(programPrices, discountConfig) {
  if (!discountConfig || !programPrices || programPrices.length <= 1) {
    return {
      discountAmount: 0,
      breakdown: (programPrices || []).map(p => ({ programName: p.programName, price: p.price, discount: 0, net: p.price })),
    };
  }

  // Sort by price descending — highest-priced program stays full price
  const sorted = [...programPrices].sort((a, b) => b.price - a.price);
  const breakdown = sorted.map(p => ({ programName: p.programName, price: p.price, discount: 0, net: p.price }));

  if (discountConfig.applies_to === "total_invoice") {
    // Flat discount per additional program, applied to the total
    const additionalCount = sorted.length - 1;
    const discountAmount = Math.max(0, (discountConfig.amount || 0) * additionalCount);
    // Distribute the discount across additional programs for display purposes
    if (additionalCount > 0) {
      const perProgram = discountAmount / additionalCount;
      for (let i = 1; i <= additionalCount; i++) {
        breakdown[i].discount = perProgram;
        breakdown[i].net = breakdown[i].price - perProgram;
      }
    }
    return { discountAmount, breakdown };
  }

  if (discountConfig.applies_to === "second_program") {
    // Discount on the 2nd (lower-priced) program only
    const target = breakdown[1];
    if (target) {
      target.discount = discountConfig.discount_type === "percentage"
        ? target.price * (discountConfig.amount || 0) / 100
        : Math.min(discountConfig.amount || 0, target.price);
      target.net = target.price - target.discount;
    }
  } else if (discountConfig.applies_to === "all_additional_programs") {
    // Discount on all programs after the first
    for (let i = 1; i < breakdown.length; i++) {
      breakdown[i].discount = discountConfig.discount_type === "percentage"
        ? breakdown[i].price * (discountConfig.amount || 0) / 100
        : Math.min(discountConfig.amount || 0, breakdown[i].price);
      breakdown[i].net = breakdown[i].price - breakdown[i].discount;
    }
  } else {
    // Default: treat as "all_additional_programs"
    for (let i = 1; i < breakdown.length; i++) {
      breakdown[i].discount = discountConfig.discount_type === "percentage"
        ? breakdown[i].price * (discountConfig.amount || 0) / 100
        : Math.min(discountConfig.amount || 0, breakdown[i].price);
      breakdown[i].net = breakdown[i].price - breakdown[i].discount;
    }
  }

  const discountAmount = breakdown.reduce((sum, b) => sum + b.discount, 0);
  return { discountAmount: Math.max(0, discountAmount), breakdown };
}

/**
 * Resolves the price for a program enrollment.
 * Uses the enrollment's locked_in_price, then the linked tier's price, then the program's default_monthly_rate.
 */
export function resolveProgramPrice(enrollment, programs, tiers) {
  if (enrollment.locked_in_price && enrollment.locked_in_price > 0) return enrollment.locked_in_price;
  const tier = tiers.find(t => t.id === enrollment.linked_tier_id);
  if (tier && tier.price > 0) return tier.price;
  const program = programs.find(p => p.id === enrollment.program_id || p.program_name === enrollment.program);
  return program?.default_monthly_rate || 0;
}