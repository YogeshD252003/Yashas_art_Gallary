import express from "express";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { initializeApp, getApps, App, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

dotenv.config();

// --- Firebase Config & App Loading ---

// 1. Try to load config from environment variables or files on disk
let projectToUse = process.env.FIREBASE_PROJECT_ID;
let storageBucketToUse = process.env.FIREBASE_STORAGE_BUCKET;
let databaseIdToUse = process.env.FIREBASE_DATABASE_ID;

// Fallback to reading from firebase-applet-config.json if exists
try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    const fileConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
    if (!projectToUse) projectToUse = fileConfig.projectId;
    if (!storageBucketToUse) storageBucketToUse = fileConfig.storageBucket;
    if (!databaseIdToUse) databaseIdToUse = fileConfig.firestoreDatabaseId;
  }
} catch (err: any) {
  console.warn("⚠️ Could not parse firebase-applet-config.json:", err.message);
}

// Fallback to hardcoded defaults if still not found
projectToUse = projectToUse || "deft-racer-490609-c1";
storageBucketToUse = storageBucketToUse || `${projectToUse}.firebasestorage.app`;
databaseIdToUse = databaseIdToUse || "ai-studio-f96ec1c7-2a9b-41ee-adf7-3aeac8a8f8a0";

// 2. Initialize Firebase Admin
let firebaseApp: App;
const existingApps = getApps();

// Ensure project ID is trimmed to avoid whitespace issues
projectToUse = projectToUse.trim();

const foundApp = existingApps.find(app => app.options.projectId === projectToUse);

if (foundApp) {
  firebaseApp = foundApp;
  console.log(`Using existing Firebase app for project: ${projectToUse}`);
} else {
  let credential;
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      credential = cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY));
    } else {
      const saPath = path.join(process.cwd(), "serviceAccountKey.json");
      if (fs.existsSync(saPath)) {
        const serviceAccount = JSON.parse(fs.readFileSync(saPath, "utf8"));
        credential = cert(serviceAccount);
        // If serviceAccount file has a different project_id than config, let's align them
        if (serviceAccount.project_id && !process.env.FIREBASE_PROJECT_ID && (!fs.existsSync(path.join(process.cwd(), "firebase-applet-config.json")) || projectToUse === "deft-racer-490609-c1")) {
          projectToUse = serviceAccount.project_id.trim();
          storageBucketToUse = `${projectToUse}.firebasestorage.app`;
          databaseIdToUse = "(default)"; // Switch to default database for the new custom project
        }
      }
    }
  } catch (error: any) {
    console.warn("⚠️ WARNING: Could not load Firebase Service Account Credentials. Admin SDK may fail with PERMISSION_DENIED.", error.message);
  }

  firebaseApp = initializeApp({
    projectId: projectToUse,
    ...(credential ? { credential } : {}),
    storageBucket: storageBucketToUse,
  }, `app-${projectToUse.slice(0, 8)}`);
  console.log(`Initialized new Firebase app for project: ${projectToUse}`);
}

// Access the specific database
const dbId = databaseIdToUse === "(default)" ? undefined : databaseIdToUse;
const db = getFirestore(firebaseApp, dbId);
console.log(`Firestore connected to project: ${projectToUse}, database: ${dbId || "(default)"}`);

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "yashas_art_gallery_secret_2024";

app.use(cors());
app.use(express.json());

// 0. Health Check & Firebase Verification
app.get("/api/health", async (req, res) => {
  try {
    const testDoc = db.collection("health_check").doc("status");
    await testDoc.set({
      last_check: new Date().toISOString(),
      project: projectToUse,
      db: dbId || "(default)"
    });
    res.json({ 
      status: "ok", 
      firebase: "connected", 
      project: projectToUse,
      database: dbId || "(default)"
    });
  } catch (error: any) {
    console.error("Firebase Health Check Failed:", error.message);
    res.status(500).json({ 
      status: "error", 
      error: error.message,
      project: projectToUse,
      database: dbId || "(default)"
    });
  }
});

// --- Helper Functions ---

const sendSMS = async (mobileNumber: string, otp: string) => {
  // In a real app, integrate Twilio / Firebase Phone Auth / MSG91 here.
  // For this environment, we'll log it to console and simulate a success.
  console.log(`[SMS SERVICE] Sending OTP ${otp} to ${mobileNumber}`);
  return true;
};

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// --- Auth Middleware ---

const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: "Access denied" });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
};

// --- AUTH APIs ---

// 1. Send OTP
app.post("/api/auth/send-otp", async (req, res) => {
  const { mobileNumber } = req.body;
  if (!mobileNumber) return res.status(400).json({ error: "Mobile number is required" });

  try {
    const otp = generateOTP();
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 5);

    await db.collection("otp_verifications").add({
      mobile_number: mobileNumber,
      otp,
      expiry_time: expiry.toISOString(),
      is_verified: false,
      created_at: new Date().toISOString(),
      timestamp: Date.now() // Use numeric timestamp for easier sorting if needed, but we'll use created_at
    });

    await sendSMS(mobileNumber, otp);
    res.json({ message: "OTP sent successfully", dev_otp: otp }); 
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Verify OTP
app.post("/api/auth/verify-otp", async (req, res) => {
  const { mobileNumber, otp } = req.body;
  if (!mobileNumber || !otp) return res.status(400).json({ error: "Mobile number and OTP are required" });

  try {
    const snapshot = await db.collection("otp_verifications")
      .where("mobile_number", "==", mobileNumber)
      .where("otp", "==", otp)
      .where("is_verified", "==", false)
      .get();

    if (snapshot.empty) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    // Sort in memory to get the latest
    const docs = snapshot.docs.map(doc => ({ id: doc.id, ref: doc.ref, ...doc.data() }));
    docs.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    const otpData: any = docs[0];

    if (new Date(otpData.expiry_time) < new Date()) {
      return res.status(400).json({ error: "OTP has expired" });
    }

    await otpData.ref.update({ is_verified: true });
    res.json({ message: "OTP verified successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Register
app.post("/api/auth/register", async (req, res) => {
  const { full_name, age, location, mobile_number, email, password } = req.body;

  if (!full_name || !mobile_number || !email || !password) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Check if user already exists
    const userSnapshot = await db.collection("users").where("email", "==", email).limit(1).get();
    if (!userSnapshot.empty) {
      return res.status(400).json({ error: "User with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userDoc = await db.collection("users").add({
      full_name,
      age: parseInt(age) || null,
      location,
      mobile_number,
      email,
      password: hashedPassword,
      role: "user",
      is_mobile_verified: false, // Defaulting to false since we didn't verify it here
      created_at: new Date().toISOString()
    });

    const token = jwt.sign({ userId: userDoc.id, email, role: "user" }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, userId: userDoc.id, message: "Account created successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- AUTH APIs ---

const trackLogin = async (userId: string, method: string) => {
    try {
        await db.collection("login_history").add({
            userId,
            method,
            timestamp: new Date().toISOString(),
            device: "Web Browser" // Simplified
        });
    } catch (e) {
        console.error("Login tracking failed", e);
    }
};

// 4. Email Login
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });

  try {
    const snapshot = await db.collection("users").where("email", "==", email).limit(1).get();

    if (snapshot.empty) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    const isMatch = await bcrypt.compare(password, userData.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    await trackLogin(userDoc.id, "Email + Password");

    const token = jwt.sign({ userId: userDoc.id, email, role: userData.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, userId: userDoc.id, full_name: userData.full_name });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Mobile OTP Login
app.post("/api/auth/mobile-login", async (req, res) => {
  const { mobileNumber, otp } = req.body;
  if (!mobileNumber || !otp) return res.status(400).json({ error: "Mobile number and OTP required" });

  try {
    // 1. Verify OTP first (latest unverified)
    const snapshot = await db.collection("otp_verifications")
      .where("mobile_number", "==", mobileNumber)
      .where("otp", "==", otp)
      .where("is_verified", "==", false)
      .get();

    if (snapshot.empty) return res.status(400).json({ error: "Invalid or expired OTP" });

    // Latest one
    const docs = snapshot.docs.map(doc => ({ id: doc.id, ref: doc.ref, ...doc.data() }));
    docs.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const latestOtp = docs[0];

    // 2. Find user
    const userSnapshot = await db.collection("users").where("mobile_number", "==", mobileNumber).limit(1).get();

    if (userSnapshot.empty) return res.status(404).json({ error: "User not found with this mobile number" });

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();

    // Mark OTP as used
    await latestOtp.ref.update({ is_verified: true });

    await trackLogin(userDoc.id, "Mobile OTP");

    const token = jwt.sign({ userId: userDoc.id, email: userData.email, role: userData.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, userId: userDoc.id, full_name: userData.full_name });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ... inside user profile APIs ...
app.get("/api/user/login-history", authenticateToken, async (req: any, res) => {
    try {
        const snapshot = await db.collection("login_history")
            .where("userId", "==", req.user.userId)
            .limit(20)
            .get();
        
        const history = snapshot.docs.map(doc => doc.data());
        // Sort in memory to avoid needing a composite index
        history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        res.json(history.slice(0, 10));
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// 6. Forgot Password (Send OTP)
app.post("/api/auth/forgot-password", async (req, res) => {
    const { email } = req.body;
    try {
        const snapshot = await db.collection("users").where("email", "==", email).limit(1).get();
        if (snapshot.empty) return res.status(404).json({ error: "Email not found" });

        const user = snapshot.docs[0].data();
        const otp = generateOTP();
        const expiry = new Date();
        expiry.setMinutes(expiry.getMinutes() + 5);

        await db.collection("otp_verifications").add({
            mobile_number: user.mobile_number,
            otp,
            expiry_time: expiry.toISOString(),
            is_verified: false,
            created_at: new Date().toISOString()
        });

        await sendSMS(user.mobile_number, otp);
        res.json({ message: "OTP sent to your registered mobile number", dev_otp: otp });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// 7. Reset Password
app.post("/api/auth/reset-password", async (req, res) => {
    const { email, otp, newPassword } = req.body;
    try {
        const userSnapshot = await db.collection("users").where("email", "==", email).limit(1).get();
        if (userSnapshot.empty) return res.status(404).json({ error: "User not found" });

        const userDoc = userSnapshot.docs[0];
        const userData = userDoc.data();

        const otpSnapshot = await db.collection("otp_verifications")
            .where("mobile_number", "==", userData.mobile_number)
            .where("otp", "==", otp)
            .where("is_verified", "==", false)
            .get();

        if (otpSnapshot.empty) return res.status(400).json({ error: "Invalid or expired OTP" });

        // Latest one
        const docs = otpSnapshot.docs.map(doc => ({ id: doc.id, ref: doc.ref, ...doc.data() }));
        docs.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        const latestOtp = docs[0];

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await userDoc.ref.update({ password: hashedPassword });
        await latestOtp.ref.update({ is_verified: true });

        res.json({ message: "Password reset successfully" });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// --- USER PROFILE APIs ---

app.get("/api/user/profile", authenticateToken, async (req: any, res) => {
  try {
    const snapshot = await db.collection("users").where("email", "==", req.user.email).limit(1).get();
    if (snapshot.empty) return res.status(404).json({ error: "User not found" });
    const data = snapshot.docs[0].data();
    const { password, ...safeData } = data;
    res.json({ ...safeData, id: snapshot.docs[0].id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/user/profile", authenticateToken, async (req: any, res) => {
  try {
    const snapshot = await db.collection("users").where("email", "==", req.user.email).limit(1).get();
    if (snapshot.empty) return res.status(404).json({ error: "User not found" });

    const userDoc = snapshot.docs[0];
    const { password, email, ...updateData } = req.body; 

    await userDoc.ref.update(updateData);
    res.json({ message: "Profile updated successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- Server startup (only for local dev, not Vercel) ---

async function startServer() {
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

// Do not call startServer() on Vercel
if (!process.env.VERCEL) {
  startServer();
}

export default app;
