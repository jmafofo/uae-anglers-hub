/**
 * Email utility using Resend.
 * Sends transactional emails for banner bid notifications.
 */

import { Resend } from 'resend';

const ADMIN_EMAIL = 'info@uaeangler.com';
// Use onboarding@resend.dev for testing (only delivers to your verified email).
// Switch to 'UAE Anglers Hub <noreply@uaeangler.com>' once you verify
// uaeangler.com as a sending domain in Resend.
const FROM_EMAIL = 'UAE Anglers Hub <onboarding@resend.dev>';

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY not set, emails will be logged only');
    return null;
  }
  return new Resend(process.env.RESEND_API_KEY);
}

export async function sendBidApprovalRequest(params: {
  bidId: string;
  businessName: string;
  businessEmail: string;
  slotLabel: string;
  durationDays: number;
  totalAmount: number;
  imageUrl: string;
  targetUrl: string;
  adminUrl: string;
}): Promise<void> {
  const resend = getResend();
  const subject = `New Banner Bid: ${params.businessName} — ${params.slotLabel}`;

  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
      <h2 style="color: #0d1f33;">New Banner Bid Pending Approval</h2>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Business</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${escapeHtml(params.businessName)}</td></tr>
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Email</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${escapeHtml(params.businessEmail)}</td></tr>
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Slot</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${escapeHtml(params.slotLabel)}</td></tr>
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Duration</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${params.durationDays} days</td></tr>
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Total Amount</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">AED ${params.totalAmount.toFixed(2)}</td></tr>
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Target URL</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><a href="${escapeHtml(params.targetUrl)}">${escapeHtml(params.targetUrl)}</a></td></tr>
      </table>
      ${params.imageUrl ? `<p><strong>Banner Preview:</strong></p><img src="${escapeHtml(params.imageUrl)}" alt="Banner" style="max-width: 100%; border: 1px solid #ddd; border-radius: 8px;" />` : ''}
      <p style="margin-top: 24px;">
        <a href="${escapeHtml(params.adminUrl)}" style="display: inline-block; background: #0d1f33; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Review in Admin Dashboard</a>
      </p>
      <p style="color: #666; font-size: 12px; margin-top: 24px;">This bid requires manual approval before the banner goes live and payment is captured.</p>
    </div>
  `;

  if (!resend) {
    console.log('[email] Would send:', { to: ADMIN_EMAIL, subject, html: html.slice(0, 200) + '...' });
    return;
  }

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: ADMIN_EMAIL,
    subject,
    html,
  });

  if (error) {
    console.error('[email] Failed to send approval request:', error);
  }
}

export async function sendBidStatusUpdate(params: {
  to: string;
  businessName: string;
  slotLabel: string;
  status: 'approved' | 'rejected';
  adminNotes?: string | null;
}): Promise<void> {
  const resend = getResend();
  const subject = params.status === 'approved'
    ? `Your banner ad on UAE Anglers Hub is now live`
    : `Your banner bid was not approved`;

  const html = params.status === 'approved'
    ? `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
        <h2 style="color: #0d1f33;">Banner Ad Approved 🎉</h2>
        <p>Hi ${escapeHtml(params.businessName)},</p>
        <p>Your banner ad for <strong>${escapeHtml(params.slotLabel)}</strong> has been approved and is now live on UAE Anglers Hub.</p>
        <p>Payment has been processed. Thank you for advertising with us!</p>
        ${params.adminNotes ? `<p style="color: #666; font-size: 13px;"><strong>Note from admin:</strong> ${escapeHtml(params.adminNotes)}</p>` : ''}
        <p style="margin-top: 24px; color: #666; font-size: 12px;">UAE Anglers Hub — <a href="https://uaeangler.com">uaeangler.com</a></p>
      </div>
    `
    : `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
        <h2 style="color: #0d1f33;">Banner Bid Not Approved</h2>
        <p>Hi ${escapeHtml(params.businessName)},</p>
        <p>Unfortunately, your banner bid for <strong>${escapeHtml(params.slotLabel)}</strong> was not approved at this time.</p>
        <p>No payment has been charged. If you have any questions, please reply to this email or contact us at info@uaeangler.com.</p>
        ${params.adminNotes ? `<p style="color: #666; font-size: 13px;"><strong>Note from admin:</strong> ${escapeHtml(params.adminNotes)}</p>` : ''}
        <p style="margin-top: 24px; color: #666; font-size: 12px;">UAE Anglers Hub — <a href="https://uaeangler.com">uaeangler.com</a></p>
      </div>
    `;

  if (!resend) {
    console.log('[email] Would send:', { to: params.to, subject, html: html.slice(0, 200) + '...' });
    return;
  }

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject,
    html,
  });

  if (error) {
    console.error('[email] Failed to send status update:', error);
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
