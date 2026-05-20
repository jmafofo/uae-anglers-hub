/**
 * Shared helpers for the forum UI.
 */
import Link from 'next/link';
import { ReactNode } from 'react';

// Same regex as the DB triggers in add_forum_ugc_moderation_and_quotas.sql —
// keep the two in sync so the UI's link rendering matches the server's
// mention-notification trigger exactly.
const MENTION_RE = /@([A-Za-z0-9_-]{3,30})/g;

/**
 * Split a body string into plain text + @username links. Returns React
 * nodes ready to drop inside a `<p whitespace-pre-wrap>`.
 */
export function renderBodyWithMentions(body: string): ReactNode[] {
  if (!body) return [];
  const out: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  // exec() in a loop on a /g regex — reset lastIndex defensively
  MENTION_RE.lastIndex = 0;
  while ((m = MENTION_RE.exec(body)) !== null) {
    if (m.index > last) out.push(body.slice(last, m.index));
    const username = m[1].toLowerCase();
    out.push(
      <Link
        key={`m-${m.index}`}
        href={`/profile/${username}`}
        className="text-teal-400 hover:underline"
      >
        @{m[1]}
      </Link>,
    );
    last = m.index + m[0].length;
  }
  if (last < body.length) out.push(body.slice(last));
  return out;
}

/**
 * Parse a comma-separated tag input into a validated array. Mirrors the
 * forum_threads_tags_check CHECK constraint in the migration so client
 * and server agree on what's acceptable.
 */
export const TAG_MAX_COUNT = 5;
export const TAG_MAX_LENGTH = 20;
export const TAG_RE = /^[a-z0-9-]+$/;

export function parseTags(input: string): { tags: string[]; error: string | null } {
  const raw = input.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
  if (raw.length > TAG_MAX_COUNT) {
    return { tags: [], error: `At most ${TAG_MAX_COUNT} tags allowed.` };
  }
  for (const t of raw) {
    if (t.length > TAG_MAX_LENGTH) {
      return { tags: [], error: `Tag "${t}" is too long (max ${TAG_MAX_LENGTH} chars).` };
    }
    if (!TAG_RE.test(t)) {
      return { tags: [], error: `Tag "${t}" contains invalid characters (use a-z, 0-9, hyphen).` };
    }
  }
  // Dedupe while preserving order
  return { tags: [...new Set(raw)], error: null };
}

/**
 * Turn a Supabase/PostgREST error into a friendly forum-throttle message
 * when the BEFORE INSERT triggers raise check_violation. Returns null if
 * it's not a throttle error so the caller can fall through to a generic
 * message.
 */
export function friendlyForumError(err: { message?: string; code?: string } | null | undefined): string | null {
  if (!err?.message) return null;
  if (err.message.includes('Daily thread limit reached')) {
    return err.message;
  }
  if (err.message.includes('Daily reply limit reached')) {
    return err.message;
  }
  if (err.message.includes('forum_threads_tags_check')) {
    return 'Tags are invalid — use up to 5 lowercase tags with letters, digits and hyphens only.';
  }
  return null;
}
