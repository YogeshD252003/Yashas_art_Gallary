/** Client-side fallback when server email fails. */
import emailjs from '@emailjs/browser';
import type { OrderLineItem, ShippingAddress } from '../types/commerce';

export interface AdminOrderEmailPayload {
  orderNumber: string;
  total: number;
  items: OrderLineItem[];
  shippingAddress: ShippingAddress;
  userAccountEmail?: string;
  orderTime?: string;
}

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID as string | undefined;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string | undefined;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string | undefined;
const PRIVATE_KEY = import.meta.env.VITE_EMAILJS_PRIVATE_KEY as string | undefined;
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL as string | undefined;

export function isEmailJsConfigured(): boolean {
  return Boolean(SERVICE_ID && TEMPLATE_ID && PUBLIC_KEY);
}

function buildFullAddress(addr: ShippingAddress): string {
  return (
    addr.location ||
    [addr.address_line, addr.landmark, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')
  );
}

export async function sendAdminOrderEmail(payload: AdminOrderEmailPayload): Promise<boolean> {
  if (!isEmailJsConfigured()) return false;

  const { orderNumber, total, items, shippingAddress, userAccountEmail, orderTime } = payload;
  const fullAddress = buildFullAddress(shippingAddress);
  const orderTimestamp =
    orderTime ||
    new Date().toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' });

  const orderItemsText = items
    .map(
      (item, idx) =>
        `${idx + 1}. ${item.name} — Qty: ${item.quantity} — ₹${(item.price * item.quantity).toLocaleString('en-IN')}`,
    )
    .join('\n');

  const message = [
    `NEW ORDER — ${orderNumber}`,
    `Time: ${orderTimestamp}`,
    '',
    '—— CUSTOMER ——',
    `Name: ${shippingAddress.full_name}`,
    `Phone: ${shippingAddress.mobile_number}`,
    `Email: ${shippingAddress.email}`,
    `Account: ${userAccountEmail || shippingAddress.email}`,
    '',
    '—— DELIVERY ——',
    `Address: ${shippingAddress.address_line || fullAddress}`,
    `Landmark: ${shippingAddress.landmark || '—'}`,
    `City: ${shippingAddress.city}`,
    `State: ${shippingAddress.state}`,
    `Pincode: ${shippingAddress.pincode}`,
    `Full: ${fullAddress}`,
    `Notes: ${shippingAddress.order_notes || '—'}`,
    '',
    '—— ITEMS ——',
    orderItemsText,
    '',
    `TOTAL: ₹${total.toLocaleString('en-IN')}`,
  ].join('\n');

  const templateParams = {
    to_email: ADMIN_EMAIL || 'yogeshd252003@gmail.com',
    subject: `🛒 New Order ${orderNumber} — Yashas Art Gallery`,
    order_number: orderNumber,
    order_id: orderNumber,
    customer_name: shippingAddress.full_name,
    customer_phone: shippingAddress.mobile_number,
    customer_email: shippingAddress.email,
    email: shippingAddress.email,
    user_email: userAccountEmail || shippingAddress.email,
    delivery_address: fullAddress,
    street_address: shippingAddress.address_line,
    address_line: shippingAddress.address_line,
    city: shippingAddress.city,
    state: shippingAddress.state,
    pincode: shippingAddress.pincode,
    landmark: shippingAddress.landmark || '—',
    place: shippingAddress.city,
    order_notes: shippingAddress.order_notes || '—',
    order_total: `₹${total.toLocaleString('en-IN')}`,
    order_time: orderTimestamp,
    order_items: orderItemsText,
    message,
    customer_details: message,
    reply_to: shippingAddress.email,
  };

  try {
    await emailjs.send(SERVICE_ID!, TEMPLATE_ID!, templateParams, {
      publicKey: PUBLIC_KEY!,
      ...(PRIVATE_KEY ? { privateKey: PRIVATE_KEY } : {}),
    });
    return true;
  } catch (err) {
    console.error('[EmailJS] Client fallback failed:', err);
    return false;
  }
}
