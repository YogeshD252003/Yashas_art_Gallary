export interface OrderNotificationPayload {
  orderNumber: string;
  customerName: string;
  phone: string;
  email?: string;
  place: string;
  deliveryAddress: string;
  items: Array<{ name: string; quantity: number; image?: string; price: number }>;
  total: number;
  orderTime: string;
  geo_latitude?: number | null;
  geo_longitude?: number | null;
}

export interface WhatsAppNotifyResult {
  sentCount: number;
  totalRecipients: number;
  recipients: Array<{ phone: string; sent: boolean; waLink: string }>;
}

/** Normalize to digits-only; 10-digit Indian numbers get 91 prefix. */
export function normalizeAdminPhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) return null;
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

/** Build unique admin phone list from Firestore admin records (+ optional env fallback). */
export function resolveAdminPhoneList(rawPhones: (string | undefined | null)[]): string[] {
  const set = new Set<string>();
  for (const raw of rawPhones) {
    if (!raw) continue;
    const normalized = normalizeAdminPhone(raw);
    if (normalized) set.add(normalized);
  }
  if (set.size === 0 && process.env.ADMIN_WHATSAPP_NUMBER) {
    const fallback = normalizeAdminPhone(process.env.ADMIN_WHATSAPP_NUMBER);
    if (fallback) set.add(fallback);
  }
  return [...set];
}

export function formatWhatsAppMessage(order: OrderNotificationPayload): string {
  const itemLines = order.items
    .map((i) => `• ${i.name} × ${i.quantity} — ₹${(i.price * i.quantity).toLocaleString('en-IN')}`)
    .join('\n');
  const maps =
    order.geo_latitude != null && order.geo_longitude != null
      ? `\n📍 Map: https://maps.google.com/?q=${order.geo_latitude},${order.geo_longitude}`
      : '';

  return [
    '🛒 *New Order Received — Yashas Art Gallery*',
    '',
    `*Order:* ${order.orderNumber}`,
    `*Customer:* ${order.customerName}`,
    `*Phone:* ${order.phone}`,
    order.email ? `*Email:* ${order.email}` : '',
    `*Place:* ${order.place}`,
    `*Delivery:* ${order.deliveryAddress}`,
    maps,
    '',
    '*Ordered Items:*',
    itemLines,
    '',
    `*Total:* ₹${order.total.toLocaleString('en-IN')}`,
    `*Time:* ${new Date(order.orderTime).toLocaleString('en-IN')}`,
  ]
    .filter(Boolean)
    .join('\n');
}

async function sendTwilioWhatsApp(toDigits: string, message: string): Promise<boolean> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;
  if (!accountSid || !authToken || !from) return false;

  try {
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    const to = toDigits.startsWith('whatsapp:') ? toDigits : `whatsapp:+${toDigits}`;
    const fromNum = from.startsWith('whatsapp:') ? from : `whatsapp:${from}`;

    const body = new URLSearchParams({ From: fromNum, To: to, Body: message });
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Send order alert to every admin phone (Twilio when configured, wa.me link always generated). */
export async function sendAdminWhatsAppNotification(
  order: OrderNotificationPayload,
  adminPhones: string[],
): Promise<WhatsAppNotifyResult> {
  const message = formatWhatsAppMessage(order);
  const phones = resolveAdminPhoneList(adminPhones);

  if (phones.length === 0) {
    console.warn('[WhatsApp] No admin phone numbers found in admins collection');
    return { sentCount: 0, totalRecipients: 0, recipients: [] };
  }

  const recipients: WhatsAppNotifyResult['recipients'] = [];
  let sentCount = 0;

  for (const phone of phones) {
    const waLink = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    const sent = await sendTwilioWhatsApp(phone, message);
    if (sent) {
      sentCount++;
      console.log(`[WhatsApp] Order ${order.orderNumber} sent to +${phone}`);
    } else {
      console.log(`[WhatsApp] Order ${order.orderNumber} — manual link for +${phone}`);
    }
    recipients.push({ phone, sent, waLink });
  }

  return { sentCount, totalRecipients: phones.length, recipients };
}
