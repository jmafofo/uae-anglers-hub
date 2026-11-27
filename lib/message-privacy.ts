/** Keep message tombstones without exposing deleted or moderated content. */
export function redactMessage<T extends {
  body: string;
  deleted_at: string | null;
  moderation_status: string | null;
}>(message: T): T {
  if (message.deleted_at || message.moderation_status === 'flagged' || message.moderation_status === 'removed') {
    return { ...message, body: '' };
  }
  return message;
}
