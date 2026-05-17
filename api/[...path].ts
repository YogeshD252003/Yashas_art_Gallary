import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const JWT_SECRET = process.env.JWT_SECRET || "yashas_art_gallery_secret_2024";

// Firebase Config
const FIREBASE_PROJECT_ID = "deft-racer-490609-c1";
const FIREBASE_STORAGE_BUCKET = "deft-racer-490609-c1.firebasestorage.app";
const FIREBASE_DB_ID = "ai-studio-f96ec1c7-2a9b-41ee-adf7-3aeac8a8f8a0";

// Initialize Firebase Admin (singleton safe for serverless)
let firebaseApp: App;
const existingApps = getApps();
const foundApp = existingApps.find(a => a.options.projectId === FIREBASE_PROJECT_ID);

if (foundApp) {
  firebaseApp = foundApp;
} else {
  let credential;
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      credential = cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY));
    }
  } catch (e: any) {
    console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:", e.message);
  }

  firebaseApp = initializeApp({
    projectId: FIREBASE_PROJECT_ID,
    storageBucket: FIREBASE_STORAGE_BUCKET,
    ...(credential ? { credential } : {}),
  }, `app-yashas`);
}

const db = getFirestore(firebaseApp, FIREBASE_DB_ID);

// --- Express App ---
const app = express();
app.use(cors());
app.use(express.json());

// --- Helpers ---
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
const sendSMS = async (mobile: string, otp: string) => {
  console.log(`[SMS] OTP ${otp} for ${mobile}`);
  return true;
};

// --- Auth Middleware ---
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Access denied" });
  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
};

// --- Health Check ---
app.get("/api/health", async (_req, res) => {
  try {
    await db.collection("health_check").doc("status").set({
      last_check: new Date().toISOString(),
    });
    res.json({ status: "ok", firebase: "connected", project: FIREBASE_PROJECT_ID });
  } catch (e: any) {
    res.status(500).json({ status: "error", error: e.message });
  }
});

// --- Send OTP ---
app.post("/api/auth/send-otp", async (req, res) => {
  const { mobileNumber } = req.body;
  if (!mobileNumber) return res.status(400).json({ error: "Mobile number is required" });
  try {
    const otp = generateOTP();
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 5);
    await db.collection("otp_verifications").add({
      mobile_number: mobileNumber, otp,
      expiry_time: expiry.toISOString(),
      is_verified: false,
      created_at: new Date().toISOString(),
    });
    await sendSMS(mobileNumber, otp);
    res.json({ message: "OTP sent successfully", dev_otp: otp });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// --- Verify OTP ---
app.post("/api/auth/verify-otp", async (req, res) => {
  const { mobileNumber, otp } = req.body;
  if (!mobileNumber || !otp) return res.status(400).json({ error: "Mobile and OTP required" });
  try {
    const snap = await db.collection("otp_verifications")
      .where("mobile_number", "==", mobileNumber)
      .where("otp", "==", otp)
      .where("is_verified", "==", false).get();
    if (snap.empty) return res.status(400).json({ error: "Invalid or expired OTP" });
    const docs = snap.docs.map(d => ({ id: d.id, ref: d.ref, ...d.data() as any }));
    docs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const latest = docs[0];
    if (new Date(latest.expiry_time) < new Date()) return res.status(400).json({ error: "OTP expired" });
    await latest.ref.update({ is_verified: true });
    res.json({ message: "OTP verified" });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// --- Register ---
app.post("/api/auth/register", async (req, res) => {
  const { full_name, age, location, mobile_number, email, password } = req.body;
  if (!full_name || !mobile_number || !email || !password)
    return res.status(400).json({ error: "Missing required fields" });
  try {
    const existing = await db.collection("users").where("email", "==", email).limit(1).get();
    if (!existing.empty) return res.status(400).json({ error: "User already exists" });
    const hashed = await bcrypt.hash(password, 10);
    const doc = await db.collection("users").add({
      full_name, age: parseInt(age) || null, location,
      mobile_number, email, password: hashed,
      role: "user", is_mobile_verified: false,
      created_at: new Date().toISOString(),
    });
    const token = jwt.sign({ userId: doc.id, email, role: "user" }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, userId: doc.id, message: "Account created successfully" });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// --- Login ---
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });
  try {
    const snap = await db.collection("users").where("email", "==", email).limit(1).get();
    if (snap.empty) return res.status(400).json({ error: "Invalid email or password" });
    const userDoc = snap.docs[0];
    const userData = userDoc.data();
    const match = await bcrypt.compare(password, userData.password);
    if (!match) return res.status(400).json({ error: "Invalid email or password" });
    await db.collection("login_history").add({ userId: userDoc.id, method: "Email", timestamp: new Date().toISOString() });
    const token = jwt.sign({ userId: userDoc.id, email, role: userData.role }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, userId: userDoc.id, full_name: userData.full_name });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// --- Mobile OTP Login ---
app.post("/api/auth/mobile-login", async (req, res) => {
  const { mobileNumber, otp } = req.body;
  if (!mobileNumber || !otp) return res.status(400).json({ error: "Mobile and OTP required" });
  try {
    const snap = await db.collection("otp_verifications")
      .where("mobile_number", "==", mobileNumber)
      .where("otp", "==", otp)
      .where("is_verified", "==", false).get();
    if (snap.empty) return res.status(400).json({ error: "Invalid or expired OTP" });
    const docs = snap.docs.map(d => ({ id: d.id, ref: d.ref, ...d.data() as any }));
    docs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const userSnap = await db.collection("users").where("mobile_number", "==", mobileNumber).limit(1).get();
    if (userSnap.empty) return res.status(404).json({ error: "User not found" });
    const userDoc = userSnap.docs[0];
    const userData = userDoc.data();
    await docs[0].ref.update({ is_verified: true });
    await db.collection("login_history").add({ userId: userDoc.id, method: "Mobile OTP", timestamp: new Date().toISOString() });
    const token = jwt.sign({ userId: userDoc.id, email: userData.email, role: userData.role }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, userId: userDoc.id, full_name: userData.full_name });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// --- Forgot Password ---
app.post("/api/auth/forgot-password", async (req, res) => {
  const { email } = req.body;
  try {
    const snap = await db.collection("users").where("email", "==", email).limit(1).get();
    if (snap.empty) return res.status(404).json({ error: "Email not found" });
    const user = snap.docs[0].data();
    const otp = generateOTP();
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 5);
    await db.collection("otp_verifications").add({
      mobile_number: user.mobile_number, otp,
      expiry_time: expiry.toISOString(), is_verified: false,
      created_at: new Date().toISOString(),
    });
    await sendSMS(user.mobile_number, otp);
    res.json({ message: "OTP sent to mobile", dev_otp: otp });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// --- Reset Password ---
app.post("/api/auth/reset-password", async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    const userSnap = await db.collection("users").where("email", "==", email).limit(1).get();
    if (userSnap.empty) return res.status(404).json({ error: "User not found" });
    const userDoc = userSnap.docs[0];
    const userData = userDoc.data();
    const otpSnap = await db.collection("otp_verifications")
      .where("mobile_number", "==", userData.mobile_number)
      .where("otp", "==", otp).where("is_verified", "==", false).get();
    if (otpSnap.empty) return res.status(400).json({ error: "Invalid or expired OTP" });
    const docs = otpSnap.docs.map(d => ({ id: d.id, ref: d.ref, ...d.data() as any }));
    docs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const hashed = await bcrypt.hash(newPassword, 10);
    await userDoc.ref.update({ password: hashed });
    await docs[0].ref.update({ is_verified: true });
    res.json({ message: "Password reset successfully" });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// --- User Profile ---
app.get("/api/user/profile", authenticateToken, async (req: any, res) => {
  try {
    const snap = await db.collection("users").where("email", "==", req.user.email).limit(1).get();
    if (snap.empty) return res.status(404).json({ error: "User not found" });
    const { password, ...safe } = snap.docs[0].data();
    res.json({ ...safe, id: snap.docs[0].id });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.put("/api/user/profile", authenticateToken, async (req: any, res) => {
  try {
    const snap = await db.collection("users").where("email", "==", req.user.email).limit(1).get();
    if (snap.empty) return res.status(404).json({ error: "User not found" });
    const { password, email, ...updateData } = req.body;
    await snap.docs[0].ref.update(updateData);
    res.json({ message: "Profile updated" });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/user/login-history", authenticateToken, async (req: any, res) => {
  try {
    const snap = await db.collection("login_history").where("userId", "==", req.user.userId).limit(20).get();
    const history = snap.docs.map(d => d.data());
    history.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    res.json(history.slice(0, 10));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default app;
