import type { OrderNotificationPayload } from './orderNotifications.js';

function formatOrderItemsText(items: OrderNotificationPayload['items']): string {
  return items
    .map(
      (item, idx) =>
        `${idx + 1}. ${item.name} — Qty: ${item.quantity} — ₹${(item.price * item.quantity).toLocaleString('en-IN')}`,
    )
    .join('\n');
}

function formatProductImagesHtml(items: OrderNotificationPayload['items']): string {
  const withImages = items.filter((item) => item.image);
  if (withImages.length === 0) return '<p style="color:#999">No product images</p>';
  return withImages
    .map(
      (item) =>
        `<div style="margin:8px 0;display:inline-block;text-align:center;margin-right:12px"><img src="${item.image}" alt="${item.name}" width="100" height="100" style="object-fit:cover;border-radius:8px;border:1px solid #c9a227" /><br/><small style="color:#ccc">${item.name}<br/>× ${item.quantity}</small></div>`,
    )
    .join('');
}

function formatCustomerDetailsHtml(order: OrderNotificationPayload): string {
  const mapLink =
    order.geo_latitude != null && order.geo_longitude != null
      ? `<tr><td style="color:#999;padding:8px 0">Map</td><td style="color:#c9a227"><a href="https://maps.google.com/?q=${order.geo_latitude},${order.geo_longitude}" style="color:#c9a227">Open in Google Maps</a></td></tr>`
      : '';

  const rows = [
    ['Customer name', order.customerName],
    ['Phone', order.phone],
    ['Email', order.email || '—'],
    ['Account email', order.userAccountEmail || order.email || '—'],
    ['Street address', order.addressLine || order.deliveryAddress],
    ['Landmark', order.landmark || '—'],
    ['City', order.city || order.place || '—'],
    ['State', order.state || '—'],
    ['Pincode', order.pincode || '—'],
    ['Full delivery address', order.deliveryAddress],
    ['Order notes', order.orderNotes || '—'],
  ];

  return (
    `<table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:12px">` +
    rows
      .map(
        ([label, value]) =>
          `<tr><td style="color:#999;padding:8px 12px;width:160px;vertical-align:top;border-bottom:1px solid #333">${label}</td><td style="color:#fff;padding:8px 12px;border-bottom:1px solid #333"><strong>${value}</strong></td></tr>`,
      )
      .join('') +
    mapLink +
    `</table>`
  );
}

function formatFullMessage(order: OrderNotificationPayload): string {
  const mapLine =
    order.geo_latitude != null && order.geo_longitude != null
      ? `Map: https://maps.google.com/?q=${order.geo_latitude},${order.geo_longitude}\n`
      : '';

  return [
    `NEW ORDER — ${order.orderNumber}`,
    `Time: ${new Date(order.orderTime).toLocaleString('en-IN')}`,
    '',
    '—— CUSTOMER ——',
    `Name: ${order.customerName}`,
    `Phone: ${order.phone}`,
    `Email: ${order.email || '—'}`,
    `Account: ${order.userAccountEmail || order.email || '—'}`,
    '',
    '—— DELIVERY ——',
    `Address: ${order.addressLine || order.deliveryAddress}`,
    `Landmark: ${order.landmark || '—'}`,
    `City: ${order.city || order.place || '—'}`,
    `State: ${order.state || '—'}`,
    `Pincode: ${order.pincode || '—'}`,
    `Full: ${order.deliveryAddress}`,
    mapLine,
    `Notes: ${order.orderNotes || '—'}`,
    '',
    '—— ITEMS ——',
    formatOrderItemsText(order.items),
    '',
    `TOTAL: ₹${order.total.toLocaleString('en-IN')}`,
  ]
    .filter(Boolean)
    .join('\n');
}

/** All EmailJS template variables for admin order notification. */
export function buildOrderEmailParams(order: OrderNotificationPayload, toEmail: string) {
  const orderTime = new Date(order.orderTime).toLocaleString('en-IN', {
    dateStyle: 'full',
    timeStyle: 'short',
  });
  const mapLink =
    order.geo_latitude != null && order.geo_longitude != null
      ? `https://maps.google.com/?q=${order.geo_latitude},${order.geo_longitude}`
      : '';

  return {
    to_email: toEmail,
    subject: `🛒 New Order ${order.orderNumber} — Yashas Art Gallery`,
    order_number: order.orderNumber,
    order_id: order.orderNumber,
    customer_name: order.customerName,
    name: order.customerName,
    customer_phone: order.phone,
    phone: order.phone,
    customer_email: order.email || '—',
    email: order.email || '—',
    user_email: order.userAccountEmail || order.email || '—',
    delivery_address: order.deliveryAddress,
    address: order.deliveryAddress,
    street_address: order.addressLine || order.deliveryAddress,
    address_line: order.addressLine || order.deliveryAddress,
    city: order.city || order.place || '—',
    state: order.state || '—',
    pincode: order.pincode || '—',
    landmark: order.landmark || '—',
    place: order.place,
    order_notes: order.orderNotes || '—',
    order_total: `₹${order.total.toLocaleString('en-IN')}`,
    total: `₹${order.total.toLocaleString('en-IN')}`,
    order_time: orderTime,
    order_items: formatOrderItemsText(order.items),
    product_images_html: formatProductImagesHtml(order.items),
    customer_details_html: formatCustomerDetailsHtml(order),
    customer_details: formatFullMessage(order),
    message: formatFullMessage(order),
    map_link: mapLink,
    reply_to: order.email || toEmail,
  };
}
