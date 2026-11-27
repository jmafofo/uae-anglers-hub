/** AED amounts are stored as integer fils; never calculate commission in floats. */
export const CHARTER_COMMISSION_BPS = 500;
export function charterAmounts(totalFils: number) {
  if (!Number.isSafeInteger(totalFils) || totalFils <= 0) throw new Error('Invalid trip price');
  const commissionFils = Math.round(totalFils * CHARTER_COMMISSION_BPS / 10000);
  return { totalFils, commissionFils, operatorFils: totalFils - commissionFils };
}
export type OrderStatus = 'awaiting_payment' | 'paid' | 'preparing' | 'shipped' | 'delivered' | 'completed' | 'cancelled' | 'refund_pending' | 'refunded';
export function canSellerTransition(kind: 'gear' | 'charter', from: OrderStatus, to: OrderStatus) {
  return kind === 'gear' ? (from === 'paid' && to === 'preparing') || (from === 'preparing' && to === 'shipped')
    : from === 'paid' && to === 'completed';
}
export function isOverdueDelivery(order: { kind: string; status: string; deliverBy: string | null }, now = Date.now()) {
  return order.kind === 'gear' && ['paid', 'preparing', 'shipped'].includes(order.status)
    && !!order.deliverBy && Date.parse(order.deliverBy) < now;
}
export const PROMOTION_LABELS = { featured: 'Featured', new_on_market: 'New on the market', hot_deal: 'Hot deal' } as const;
export type PromotionTag = keyof typeof PROMOTION_LABELS;
export function hasRealDiscount(price: number, previousPrice: number | null) {
  return Number.isFinite(price) && price > 0 && previousPrice !== null && Number.isFinite(previousPrice) && previousPrice > price;
}

export function gearAmounts(subtotalFils: number, shippingFils: number, sellerClass: 'individual' | 'dealer') {
  if (!Number.isSafeInteger(shippingFils) || shippingFils < 0) throw new Error('Invalid delivery price');
  const validated = charterAmounts(subtotalFils);
  const commissionFils = sellerClass === 'dealer' ? 0 : validated.commissionFils;
  const totalFils = subtotalFils + shippingFils;
  if (!Number.isSafeInteger(totalFils)) throw new Error('Invalid total');
  return { totalFils, commissionFils, sellerFils: totalFils - commissionFils };
}

/** Annual rent is twelve months with the user's 20% discount. */
export function dealerRentalAmount(monthlyFils: number, billingCycle: 'monthly' | 'annual') {
  if (!Number.isSafeInteger(monthlyFils) || monthlyFils <= 0 || monthlyFils > Math.floor(Number.MAX_SAFE_INTEGER / 12)) throw new Error('Invalid rental price');
  return billingCycle === 'annual' ? Math.round(monthlyFils * 12 * 0.8) : monthlyFils;
}
