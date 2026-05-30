import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: resolve(root, '.env') });

const serviceId = process.env.EMAILJS_SERVICE_ID;
const templateId = process.env.EMAILJS_TEMPLATE_ID;
const publicKey = process.env.EMAILJS_PUBLIC_KEY;
const privateKey = process.env.EMAILJS_PRIVATE_KEY;
const toEmail = process.env.ADMIN_EMAIL || 'yogeshd252003@gmail.com';

const message = [
  'NEW ORDER — ORD-TEST123',
  '',
  '—— CUSTOMER ——',
  'Name: Rahul Kumar',
  'Phone: 9876543210',
  'Email: rahul@example.com',
  '',
  '—— DELIVERY ——',
  'Address: 12 MG Road, Banjara Hills',
  'City: Hyderabad',
  'State: Telangana',
  'Pincode: 500034',
  'Landmark: Near City Mall',
  'Notes: Please call before delivery',
  '',
  '—— ITEMS ——',
  '1. Sunset Canvas — Qty: 1 — ₹2,500',
  '2. Abstract Print — Qty: 2 — ₹1,600',
  '',
  'TOTAL: ₹4,100',
].join('\n');

const template_params = {
  to_email: toEmail,
  subject: '🛒 New Order ORD-TEST123 — Yashas Art Gallery',
  order_number: 'ORD-TEST123',
  customer_name: 'Rahul Kumar',
  customer_phone: '9876543210',
  customer_email: 'rahul@example.com',
  user_email: 'rahul@example.com',
  street_address: '12 MG Road, Banjara Hills',
  city: 'Hyderabad',
  state: 'Telangana',
  pincode: '500034',
  landmark: 'Near City Mall',
  delivery_address: '12 MG Road, Banjara Hills, Hyderabad, Telangana, 500034',
  order_notes: 'Please call before delivery',
  order_total: '₹4,100',
  order_time: new Date().toLocaleString('en-IN'),
  order_items: '1. Sunset Canvas — Qty: 1 — ₹2,500\n2. Abstract Print — Qty: 2 — ₹1,600',
  message,
  customer_details: message,
  reply_to: 'rahul@example.com',
};

const payload = {
  service_id: serviceId,
  template_id: templateId,
  user_id: publicKey,
  accessToken: privateKey,
  template_params,
};

console.log('Sending detailed test email to:', toEmail);
const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});
console.log('Status:', res.status, await res.text());
