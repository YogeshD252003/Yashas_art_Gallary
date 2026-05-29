import type { OrderLineItem, ShippingAddress } from '../types/commerce';

export async function placeOrder(
  token: string,
  items: OrderLineItem[],
  shippingAddress: ShippingAddress,
): Promise<{ orderId: string; orderNumber: string }> {
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
  return { orderId: data.orderId, orderNumber: data.orderNumber };
}
