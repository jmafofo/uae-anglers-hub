/** Only captured, approved, current bookings can earn homepage exposure. */
export type PaidBooking = {
  user_id: string; business_name: string; status: string;
  stripe_capture_status: string | null; stripe_payment_intent_id: string | null;
  start_date: string | null; ends_at: string | null;
};
export function isCurrentPaidBooking(booking: PaidBooking, now = Date.now()): boolean {
  const start = booking.start_date ? Date.parse(`${booking.start_date}T00:00:00+04:00`) : NaN;
  const end = booking.ends_at ? Date.parse(booking.ends_at) : NaN;
  return booking.status === 'active' && booking.stripe_capture_status === 'captured'
    && Boolean(booking.stripe_payment_intent_id) && start <= now && end > now;
}
export function isHttpsUrl(value: string): boolean {
  try { return new URL(value).protocol === 'https:'; } catch { return false; }
}
export type SponsoredProduct = { id: string; title: string; price: number; image: string; dealer: string; emirate: string | null };
export type FilmBrand = { videoId: string; name: string; logo: string | null; url: string };
