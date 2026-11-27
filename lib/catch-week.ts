/** Monday 00:00 through the following Monday in Asia/Dubai (UTC+4, no DST). */
export function catchWeek(now = new Date()) {
  const local = new Date(now.getTime() + 4 * 60 * 60 * 1000);
  const day = (local.getUTCDay() + 6) % 7;
  const start = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() - day) - 4 * 60 * 60 * 1000);
  const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
  const format = (date: Date) => new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Dubai', day: 'numeric', month: 'short' }).format(date);
  return { start: start.toISOString(), end: end.toISOString(), label: `${format(start)} – ${format(new Date(end.getTime() - 1))}` };
}
