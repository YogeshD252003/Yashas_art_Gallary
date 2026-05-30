import type { OrderNotificationPayload } from './orderNotifications.js';
import { buildOrderEmailParams } from './buildOrderEmailParams.js';

export interface EmailNotifyResult {
  sent: boolean;
  recipients: string[];
  error?: string;
}

function getEmailJsConfig() {
  return {
    serviceId: process.env.EMAILJS_SERVICE_ID || process.env.VITE_EMAILJS_SERVICE_ID,
    templateId: process.env.EMAILJS_TEMPLATE_ID || process.env.VITE_EMAILJS_TEMPLATE_ID,
    publicKey: process.env.EMAILJS_PUBLIC_KEY || process.env.VITE_EMAILJS_PUBLIC_KEY,
    privateKey: process.env.EMAILJS_PRIVATE_KEY,
  };
}

export function isEmailJsConfigured(): boolean {
  const { serviceId, templateId, publicKey } = getEmailJsConfig();
  return Boolean(serviceId && templateId && publicKey);
}

async function sendEmailJsToRecipient(
  toEmail: string,
  order: OrderNotificationPayload,
): Promise<boolean> {
  const { serviceId, templateId, publicKey, privateKey } = getEmailJsConfig();
  if (!serviceId || !templateId || !publicKey) return false;

  if (!privateKey) {
    console.error(
      '[EmailJS] EMAILJS_PRIVATE_KEY is required (strict mode). Get it from:',
      'https://dashboard.emailjs.com/admin/account/security → API keys → Private Key',
    );
    return false;
  }

  const payload: Record<string, unknown> = {
    service_id: serviceId,
    template_id: templateId,
    user_id: publicKey,
    accessToken: privateKey,
    template_params: buildOrderEmailParams(order, toEmail),
  };

  try {
    const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error(`[EmailJS] Failed for ${toEmail} (${res.status}):`, text);
      return false;
    }
    console.log(`[EmailJS] Order ${order.orderNumber} emailed to ${toEmail}`);
    return true;
  } catch (err) {
    console.error(`[EmailJS] Error emailing ${toEmail}:`, err);
    return false;
  }
}

/** Notify all admin emails via EmailJS REST API (server-side). */
export async function sendAdminOrderEmailNotification(
  order: OrderNotificationPayload,
  adminEmails: string[],
): Promise<EmailNotifyResult> {
  if (!isEmailJsConfigured()) {
    console.warn(
      '[EmailJS] Not configured — add EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY to .env',
    );
    return { sent: false, recipients: [], error: 'EmailJS not configured' };
  }

  if (adminEmails.length === 0) {
    console.warn('[EmailJS] No admin email addresses found');
    return { sent: false, recipients: [], error: 'No admin emails' };
  }

  const sentTo: string[] = [];
  for (const email of adminEmails) {
    const ok = await sendEmailJsToRecipient(email, order);
    if (ok) sentTo.push(email);
  }

  const needsPrivateKey = isEmailJsConfigured() && !process.env.EMAILJS_PRIVATE_KEY;
  return {
    sent: sentTo.length > 0,
    recipients: sentTo,
    error:
      sentTo.length === 0
        ? needsPrivateKey
          ? 'Add EMAILJS_PRIVATE_KEY to .env (EmailJS strict mode)'
          : 'All email sends failed — check server logs and EmailJS History'
        : undefined,
  };
}
