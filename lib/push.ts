/**
 * Expo Push Notification service client.
 *
 * Sends push notifications via Expo's HTTP/2 API.
 * Batches tokens into chunks of ~100, handles receipts,
 * and deletes invalid (DeviceNotRegistered) tokens automatically.
 */

import { getSupabaseAdmin } from './supabase-admin';

const EXPO_PUSH_API = 'https://exp.host/--/api/v2/push/send';
const BATCH_SIZE = 100;

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: object;
  sound?: string;
  badge?: number;
}

interface ExpoPushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: {
    error?: string;
    [key: string]: unknown;
  };
}

/**
 * Send push notifications to a list of Expo push tokens.
 *
 * @param tokens         Array of Expo push tokens (e.g. ExponentPushToken[xxx])
 * @param title          Notification title
 * @param body           Notification body
 * @param data           Optional payload data for deep-linking
 */
export async function sendPushNotifications(
  tokens: string[],
  title: string,
  body: string,
  data?: object
): Promise<void> {
  if (!tokens.length) return;

  const batches: string[][] = [];
  for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
    batches.push(tokens.slice(i, i + BATCH_SIZE));
  }

  const allTickets: { token: string; ticket: ExpoPushTicket }[] = [];

  for (const batch of batches) {
    const messages: ExpoPushMessage[] = batch.map((token) => ({
      to: token,
      title,
      body,
      data: data ?? {},
      sound: 'default',
      badge: 1,
    }));

    try {
      const res = await fetch(EXPO_PUSH_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
        },
        body: JSON.stringify(messages),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        console.error('[sendPushNotifications] Expo HTTP error:', res.status, text);
        continue;
      }

      const json = (await res.json()) as { data?: ExpoPushTicket[] };
      const tickets: ExpoPushTicket[] = json?.data ?? [];

      for (let i = 0; i < batch.length; i++) {
        allTickets.push({ token: batch[i], ticket: tickets[i] });
      }
    } catch (err) {
      console.error('[sendPushNotifications] Network error:', err);
    }
  }

  // Collect invalid tokens and purge them
  const invalidTokens: string[] = [];
  for (const { token, ticket } of allTickets) {
    if (ticket?.status === 'error') {
      const errorDetail = ticket.details?.error;
      console.error(
        `[sendPushNotifications] Push error for ${token}:`,
        ticket.message,
        errorDetail
      );
      if (
        errorDetail === 'DeviceNotRegistered' ||
        ticket.message?.includes('DeviceNotRegistered')
      ) {
        invalidTokens.push(token);
      }
    }
  }

  if (invalidTokens.length > 0) {
    await deleteInvalidTokens(invalidTokens);
  }
}

async function deleteInvalidTokens(tokens: string[]): Promise<void> {
  try {
    const admin = getSupabaseAdmin();
    const { error } = await admin
      .from('push_tokens')
      .delete()
      .in('expo_push_token', tokens);
    if (error) {
      console.error('[deleteInvalidTokens] Failed to delete tokens:', error);
    }
  } catch (err) {
    console.error('[deleteInvalidTokens] Error:', err);
  }
}
