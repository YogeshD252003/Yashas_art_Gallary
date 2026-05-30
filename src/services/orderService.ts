import type { OrderLineItem, ShippingAddress } from '../types/commerce';
import { sendAdminOrderEmail } from './emailService';

export interface PlaceOrderResult {
  orderId: string;
  orderNumber: string;
  emailSent?: boolean;
  emailError?: string;
}

export async function placeOrder(
  token: string,
  items: OrderLineItem[],
  shippingAddress: ShippingAddress,
  userAccountEmail?: string,
): Promise<PlaceOrderResult> {
  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ items, shippingAddress }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to place order');

  let emailSent = Boolean(data.emailSent);
  let emailError = data.emailError as string | undefined;

  if (!emailSent) {
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const clientSent = await sendAdminOrderEmail({
      orderNumber: data.orderNumber,
      total,
      items,
      shippingAddress,
      userAccountEmail,
    });
    if (clientSent) {
      emailSent = true;
      emailError = undefined;
    }
  }

  return {
    orderId: data.orderId,
    orderNumber: data.orderNumber,
    emailSent,
    emailError,
  };
}
