#!/usr/bin/env node
/**
 * Validates EmailJS config and prints one-time setup steps.
 * Run: npm run setup:emailjs
 */
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

function loadEnv() {
  const envPath = resolve(root, '.env');
  if (!existsSync(envPath)) return {};
  const lines = readFileSync(envPath, 'utf8').split('\n');
  const env = {};
  for (const line of lines) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}

const env = loadEnv();
const serviceId = env.EMAILJS_SERVICE_ID || env.VITE_EMAILJS_SERVICE_ID;
const templateId = env.EMAILJS_TEMPLATE_ID || env.VITE_EMAILJS_TEMPLATE_ID;
const publicKey = env.EMAILJS_PUBLIC_KEY || env.VITE_EMAILJS_PUBLIC_KEY;
const privateKey = env.EMAILJS_PRIVATE_KEY;
const adminEmail = env.ADMIN_EMAIL || env.VITE_ADMIN_EMAIL || 'yogeshd252003@gmail.com';

const templatePath = resolve(root, 'email-templates', 'admin-order.html');
const templateExists = existsSync(templatePath);

console.log('\n📧 Yashas Art Gallery — EmailJS Setup\n');
console.log('Admin inbox (auto from Firestore + fallback):', adminEmail);
console.log('Template file:', templateExists ? '✓ email-templates/admin-order.html' : '✗ missing');
console.log('');

if (serviceId && templateId && publicKey && privateKey) {
  console.log('✓ EmailJS keys found in .env');
  console.log('  Service ID:', serviceId);
  console.log('  Template ID:', templateId);
  console.log('  Public Key:', publicKey.slice(0, 8) + '...');
  console.log('  Private Key:', privateKey.slice(0, 4) + '...');
  console.log('\nRun: npm run test:emailjs');
  console.log('Then place a test order.\n');
  process.exit(0);
}

if (serviceId && templateId && publicKey && !privateKey) {
  console.log('⚠ Missing EMAILJS_PRIVATE_KEY (required for server emails in strict mode)');
  console.log('  Get Private Key: https://dashboard.emailjs.com/admin/account/security');
  console.log('  Add to .env: EMAILJS_PRIVATE_KEY=your_private_key');
  console.log('  Then: npm run test:emailjs\n');
  process.exit(1);
}

console.log('EmailJS keys not set yet. One-time setup (~3 min):\n');
console.log('1. Sign up free: https://dashboard.emailjs.com/sign-up');
console.log('2. Email Services → Add New Service → Gmail → connect', adminEmail);
console.log('3. Email Templates → Create → switch to Code editor');
console.log('   Paste contents of: email-templates/admin-order.html');
console.log('   Set "To email" field to: {{to_email}}');
console.log('   Set "Subject" field to: {{subject}}');
console.log('4. Account → API Keys → copy Public Key');
console.log('5. Add to .env:');
console.log('   EMAILJS_SERVICE_ID=service_xxxxx');
console.log('   EMAILJS_TEMPLATE_ID=template_xxxxx');
console.log('   EMAILJS_PUBLIC_KEY=xxxxxxxx');
console.log('   (duplicate as VITE_EMAILJS_* if needed)');
console.log('6. Restart: npm run dev\n');
