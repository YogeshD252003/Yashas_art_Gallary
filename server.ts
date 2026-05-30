import express from "express";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { initializeApp, getApps, App, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import { sendAdminWhatsAppNotification } from "./lib/orderNotifications.js";
import { fetchAdminPhoneNumbers } from "./lib/fetchAdminPhones.js";
import { sendAdminOrderEmailNotification } from "./lib/emailNotifications.js";
import { fetchAdminEmails } from "./lib/fetchAdminEmails.js";

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

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
const PORT = process.env.PORT ? Number(process.env.PORT) : 5176;
const JWT_SECRET = process.env.JWT_SECRET || "yashas_art_gallery_secret_2024";

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[HTTP] ${req.method} ${req.url}`);
  next();
});

// --- Database Seeding Logic ---
async function seedDatabase() {
  try {
    const adminSnap = await db.collection("admins").get();
    if (adminSnap.empty) {
      console.log("Seeding default admin...");
      const defaultEmail = "yogeshd252003@gmail.com";
      const hashedPassword = await bcrypt.hash("Yashas@1234", 10);
      await db.collection("admins").doc(defaultEmail).set({
        fullName: "Admin User",
        email: defaultEmail,
        phone: "9900910536",
        role: "SUPER_ADMIN",
        password: hashedPassword
      });
      console.log("Default admin seeded!");
    }

    const productSnap = await db.collection("products").get();
    if (productSnap.empty) {
      console.log("Seeding sample products...");
      const sampleProducts = [
        {
          id: "prod-1",
          name: "Golden Serenade",
          price: 15000,
          category: "Handmade Crafts",
          description: "A meticulously detailed handmade golden sculpture embodying modern artistic beauty.",
          stock: 5,
          tags: ["handmade", "sculpture", "gold"],
          images: ["https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=60"],
          type: "IMAGE"
        },
        {
          id: "prod-2",
          name: "Crimson Whispers Painting",
          price: 24000,
          category: "Personalized Gifts",
          description: "An elegant oil on canvas painting featuring vibrant crimson and gold stroke work.",
          stock: 3,
          tags: ["painting", "canvas", "art"],
          images: ["https://images.unsplash.com/photo-1579783928621-7a13d66a62d1?w=800&auto=format&fit=crop&q=60"],
          type: "IMAGE"
        },
        {
          id: "prod-3",
          name: "Cyberpunk Tactical Helmet",
          price: 35000,
          category: "Home Decor",
          description: "An immersive, highly detailed 3D cyberpunk helmet replica. Complete with metallic surfaces, reflective visors, and intricate carbon decals, this premium model showcases React Three Fiber shadows and real-time lighting preset customisation.",
          stock: 2,
          tags: ["cyberpunk", "3d", "helmet", "futuristic"],
          images: ["https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800&auto=format&fit=crop&q=60"],
          type: "3D",
          modelUrl: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/DamagedHelmet/glTF-Binary/DamagedHelmet.glb",
          variants: [
            { name: "Default Carbon", hex: "#1A1A1A", color: "#1A1A1A", metalness: 0.9, roughness: 0.1 },
            { name: "Neon Gold Edition", hex: "#FFC53D", color: "#FFC53D", metalness: 0.8, roughness: 0.2 },
            { name: "Stealth Cyan", hex: "#00F2FE", color: "#00F2FE", metalness: 0.7, roughness: 0.3 }
          ]
        },
        {
          id: "prod-4",
          name: "Sheen Velvet Chair",
          price: 28000,
          category: "Home Decor",
          description: "A premium velvet armchair featuring high-fidelity fabric textures and complex sheen shading. Perfect for testing ambient lighting presets, shadow rendering, and variant material swaps in full three-dimensional orbit controls.",
          stock: 4,
          tags: ["chair", "furniture", "velvet", "3d"],
          images: ["https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800&auto=format&fit=crop&q=60"],
          type: "3D",
          modelUrl: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/SheenChair/glTF-Binary/SheenChair.glb",
          variants: [
            { name: "Royal Blue Sheen", hex: "#0A2540", color: "#0A2540", roughness: 0.6 },
            { name: "Crimson Velvet", hex: "#8B0000", color: "#8B0000", roughness: 0.7 },
            { name: "Emerald Luxe", hex: "#004B23", color: "#004B23", roughness: 0.6 }
          ]
        }
      ];
      for (const prod of sampleProducts) {
        await db.collection("products").doc(prod.id).set(prod);
      }
      console.log("Sample products seeded!");
    }
  } catch (error: any) {
    console.error("Error seeding database:", error.message);
  }
}

let seeded = false;
async function ensureSeeded() {
  if (seeded) return;
  seeded = true;
  await seedDatabase();
}

app.use(async (req, res, next) => {
  try {
    await ensureSeeded();
  } catch (err) {
    console.error("Seeding error:", err);
  }
  next();
});

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
  let { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });
  
  email = email.trim().toLowerCase();
  password = password.trim();

  try {
    // 1. Look up admins collection by email (document ID = email)
    const adminDoc = await db.collection("admins").doc(email).get();
    if (adminDoc.exists) {
      const adminData = adminDoc.data()!;
      const isMatch = await bcrypt.compare(password, adminData.password);
      if (!isMatch) {
        return res.status(400).json({ error: "Invalid email or password" });
      }

      await trackLogin("admin-" + email, "Admin Email + Password");

      const token = jwt.sign({ 
        id: "admin-" + email, 
        userId: "admin-" + email, 
        email, 
        fullName: adminData.fullName, 
        role: adminData.role 
      }, JWT_SECRET, { expiresIn: '7d' });

      return res.json({ 
        token, 
        userId: "admin-" + email, 
        full_name: adminData.fullName,
        user: { id: "admin-" + email, email, fullName: adminData.fullName, role: adminData.role } 
      });
    }

    // 2. If not found in admins, check standard users collection
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
    // If it's an admin user, look up in admins collection
    const adminRoles = ["SUPER_ADMIN", "ADMIN", "PRODUCT_MANAGER", "ORDER_MANAGER"];
    if (req.user.role && adminRoles.includes(req.user.role)) {
      const adminDoc = await db.collection("admins").doc(req.user.email).get();
      if (adminDoc.exists) {
        const data = adminDoc.data()!;
        const { password, ...safeData } = data;
        return res.json({ ...safeData, full_name: data.fullName, id: "admin-" + req.user.email });
      }
    }

    const snapshot = await db.collection("users").where("email", "==", req.user.email).limit(1).get();
    if (snapshot.empty) {
      // Last try: check admins if role isn't matching perfectly
      const adminDoc = await db.collection("admins").doc(req.user.email).get();
      if (adminDoc.exists) {
        const data = adminDoc.data()!;
        const { password, ...safeData } = data;
        return res.json({ ...safeData, full_name: data.fullName, id: "admin-" + req.user.email });
      }
      return res.status(404).json({ error: "User not found" });
    }
    const data = snapshot.docs[0].data();
    const { password, ...safeData } = data;
    res.json({ ...safeData, id: snapshot.docs[0].id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/user/profile", authenticateToken, async (req: any, res) => {
  try {
    // If it's an admin user, update the admins collection
    const adminRoles = ["SUPER_ADMIN", "ADMIN", "PRODUCT_MANAGER", "ORDER_MANAGER"];
    if (req.user.role && adminRoles.includes(req.user.role)) {
      const adminDoc = await db.collection("admins").doc(req.user.email).get();
      if (adminDoc.exists) {
        const { password, email, ...updateData } = req.body;
        await adminDoc.ref.update(updateData);
        return res.json({ message: "Profile updated successfully" });
      }
    }

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

// --- PUBLIC & USER ORDER ENDPOINTS ---

app.get("/api/products", async (_req, res) => {
  try {
    const snapshot = await db.collection("products").get();
    const products = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter((p: any) => (p.stock ?? 1) > 0);
    res.json(products);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

const ORDER_STATUSES = ["PLACED", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

app.post("/api/orders", authenticateToken, async (req: any, res) => {
  const { items, shippingAddress } = req.body;
  let addr = { ...(shippingAddress || {}) };
  if (addr.location && addr.full_name && addr.mobile_number && !addr.address_line) {
    addr = {
      ...addr,
      email: addr.email || req.user.email,
      address_line: addr.location,
      city: addr.city || "See delivery address",
      state: addr.state || "—",
      pincode: addr.pincode && /^\d{6}$/.test(String(addr.pincode)) ? addr.pincode : "500001",
    };
  }
  const fullLocation =
    addr.location ||
    [addr.address_line, addr.landmark, addr.city, addr.state, addr.pincode].filter(Boolean).join(", ");

  if (
    !items?.length ||
    !addr.full_name ||
    !addr.mobile_number ||
    !fullLocation
  ) {
    return res.status(400).json({ error: "Items and complete shipping address are required" });
  }
  if (!addr.email || !addr.address_line || !addr.city || !addr.state || !addr.pincode) {
    return res.status(400).json({ error: "Email, street address, city, state, and pincode are required for checkout" });
  }
  if (req.user.role && ["SUPER_ADMIN", "ADMIN", "PRODUCT_MANAGER", "ORDER_MANAGER"].includes(req.user.role)) {
    return res.status(403).json({ error: "Admin accounts cannot place customer orders" });
  }
  try {
    const orderNumber = `ORD-${Date.now().toString().slice(-8)}`;
    const normalizedItems = items.map((item: any) => ({
      productId: item.productId || null,
      name: item.name,
      price: parseFloat(item.price) || 0,
      quantity: parseInt(item.quantity) || 1,
      image: item.image || "",
    }));
    const total = normalizedItems.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
    const now = new Date().toISOString();

    const normalizedShipping = {
      ...addr,
      location: fullLocation,
    };

    const orderDoc = {
      orderNumber,
      userId: req.user.userId,
      userEmail: req.user.email,
      items: normalizedItems,
      total,
      status: "PLACED",
      statusHistory: [{ status: "PLACED", timestamp: now }],
      shippingAddress: normalizedShipping,
      created_at: now,
      adminSeen: false,
    };

    const ref = await db.collection("orders").add(orderDoc);

    for (const item of normalizedItems) {
      if (item.productId) {
        const prodRef = db.collection("products").doc(item.productId);
        const prodSnap = await prodRef.get();
        if (prodSnap.exists) {
          const stock = prodSnap.data()?.stock ?? 0;
          await prodRef.update({ stock: Math.max(0, stock - item.quantity) });
        }
      }
    }

    const orderNotifyPayload = {
      orderNumber,
      customerName: normalizedShipping.full_name,
      phone: normalizedShipping.mobile_number,
      email: normalizedShipping.email,
      userAccountEmail: req.user.email,
      place: normalizedShipping.city || normalizedShipping.state || "—",
      deliveryAddress: fullLocation,
      addressLine: normalizedShipping.address_line,
      city: normalizedShipping.city,
      state: normalizedShipping.state,
      pincode: normalizedShipping.pincode,
      landmark: normalizedShipping.landmark,
      orderNotes: normalizedShipping.order_notes,
      items: normalizedItems,
      total,
      orderTime: now,
      geo_latitude: normalizedShipping.geo_latitude,
      geo_longitude: normalizedShipping.geo_longitude,
    };

    const [adminPhones, adminEmails] = await Promise.all([
      fetchAdminPhoneNumbers(db),
      fetchAdminEmails(db),
    ]);
    const [notifyResult, emailResult] = await Promise.all([
      sendAdminWhatsAppNotification(orderNotifyPayload, adminPhones),
      sendAdminOrderEmailNotification(orderNotifyPayload, adminEmails),
    ]);

    res.json({
      orderId: ref.id,
      orderNumber,
      message: "Order placed successfully",
      whatsappSent: notifyResult.sentCount > 0,
      whatsappRecipients: notifyResult.recipients,
      adminsNotified: notifyResult.totalRecipients,
      emailSent: emailResult.sent,
      emailRecipients: emailResult.recipients,
      emailError: emailResult.error,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/user/orders", authenticateToken, async (req: any, res) => {
  try {
    const snapshot = await db.collection("orders").where("userId", "==", req.user.userId).get();
    const orders = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- ADMIN SECURITY MIDDLEWARE ---
const isAdmin = (req: any, res: any, next: any) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const roles = ["SUPER_ADMIN", "ADMIN", "PRODUCT_MANAGER", "ORDER_MANAGER"];
  if (roles.includes(req.user.role)) {
    next();
  } else {
    res.status(403).json({ error: "Forbidden: Admin access only" });
  }
};

// --- ADMIN REST ENDPOINTS ---

// 0. Secure File Upload to Firebase Storage
app.post("/api/admin/upload", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { base64Data, filename, contentType } = req.body;
    if (!base64Data || !filename) {
      return res.status(400).json({ error: "base64Data and filename are required" });
    }

    const buffer = Buffer.from(base64Data, "base64");
    
    // File size validation (Max 5MB for images, Max 30MB for 3D models)
    const isModel = filename.toLowerCase().endsWith(".glb") || filename.toLowerCase().endsWith(".gltf");
    const maxSize = isModel ? 30 * 1024 * 1024 : 5 * 1024 * 1024;
    
    if (buffer.length > maxSize) {
      return res.status(400).json({ 
        error: `File exceeds standard size limits. Maximum allowed is ${isModel ? '30MB' : '5MB'}.` 
      });
    }

    // Upload to GCS Bucket
    const bucket = getStorage(firebaseApp).bucket();
    const uniqueFilename = `assets/${Date.now()}-${filename}`;
    const file = bucket.file(uniqueFilename);

    await file.save(buffer, {
      metadata: {
        contentType: contentType || (isModel ? "model/gltf-binary" : "image/jpeg"),
      }
    });

    // Make the asset public. Fallback to a long-term signed URL if public access is restricted on this bucket
    let publicUrl = `https://storage.googleapis.com/${bucket.name}/${uniqueFilename}`;
    try {
      await file.makePublic();
    } catch (makePublicErr) {
      console.warn("Unable to set public ACL on bucket, generating long-term signed URL instead:", makePublicErr);
      const [signedUrl] = await file.getSignedUrl({
        action: "read",
        expires: "01-01-2099", // Keep it readable for decades
      });
      publicUrl = signedUrl;
    }

    res.json({ url: publicUrl, filename: uniqueFilename });
  } catch (error: any) {
    console.error("Firebase upload failed:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// 1. List all products
app.get("/api/admin/products", authenticateToken, isAdmin, async (req, res) => {
  try {
    const snapshot = await db.collection("products").get();
    const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(products);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Create product (id = Date.now().toString())
app.post("/api/admin/products", authenticateToken, isAdmin, async (req, res) => {
  try {
    const id = Date.now().toString();
    const { name, price, category, description, stock, tags, images, type, modelUrl, variants } = req.body;
    const newProduct = {
      id,
      name,
      price: parseFloat(price) || 0,
      category,
      description,
      stock: parseInt(stock) || 10,
      tags: Array.isArray(tags) ? tags : [],
      images: Array.isArray(images) ? images : [],
      type: type || "IMAGE",
      modelUrl: modelUrl || "",
      variants: Array.isArray(variants) ? variants : []
    };
    await db.collection("products").doc(id).set(newProduct);
    res.json({ message: "Product published successfully!", product: newProduct });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Delete product
app.delete("/api/admin/products/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection("products").doc(id).delete();
    res.json({ message: "Product deleted successfully!" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 4. List orders
app.get("/api/admin/orders", authenticateToken, isAdmin, async (req, res) => {
  try {
    const snapshot = await db.collection("orders").get();
    const orders = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.patch("/api/admin/orders/mark-seen", authenticateToken, isAdmin, async (_req, res) => {
  try {
    const snapshot = await db.collection("orders").where("adminSeen", "==", false).get();
    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.update(doc.ref, { adminSeen: true }));
    if (!snapshot.empty) await batch.commit();
    res.json({ marked: snapshot.size });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.patch("/api/admin/orders/:id/status", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ error: "Invalid order status" });
    }
    const ref = db.collection("orders").doc(id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: "Order not found" });
    const existing = snap.data()!;
    const history = Array.isArray(existing.statusHistory) ? existing.statusHistory : [];
    history.push({ status, timestamp: new Date().toISOString() });
    await ref.update({ status, statusHistory: history, adminSeen: true });
    res.json({ message: "Order status updated", status });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 5. List users (strip passwords)
app.get("/api/admin/customers", authenticateToken, isAdmin, async (req, res) => {
  try {
    const snapshot = await db.collection("users").get();
    const customers = snapshot.docs.map(doc => {
      const { password, ...safeData } = doc.data();
      return { id: doc.id, ...safeData };
    });
    res.json(customers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 6. List admins (exclude password field)
app.get("/api/admin/admins", authenticateToken, isAdmin, async (req, res) => {
  try {
    const snapshot = await db.collection("admins").get();
    const admins = snapshot.docs.map(doc => {
      const { password, ...safeData } = doc.data();
      return { id: doc.id, ...safeData };
    });
    res.json(admins);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Create admin; hash password (default Admin@123 if empty)
app.post("/api/admin/add-admin", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { fullName, email, phone, role, password } = req.body;
    if (!fullName || !email || !role || !phone) {
      return res.status(400).json({ error: "Full Name, Email, Mobile Number, and Role are required" });
    }
    const adminDoc = await db.collection("admins").doc(email).get();
    if (adminDoc.exists) {
      return res.status(400).json({ error: "Admin with this email already exists" });
    }
    const rawPassword = password || "Admin@123";
    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    await db.collection("admins").doc(email).set({
      fullName,
      email,
      phone: phone || "",
      role,
      password: hashedPassword
    });
    res.json({ message: "Admin added successfully!" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 8. Stats object (analytics)
app.get("/api/admin/analytics", authenticateToken, isAdmin, async (req, res) => {
  try {
    const productsSnap = await db.collection("products").get();
    const ordersSnap = await db.collection("orders").get();
    const usersSnap = await db.collection("users").get();

    const productCount = productsSnap.size;
    const customers = usersSnap.size;
    const totalOrders = ordersSnap.size;

    let revenue = 0;
    ordersSnap.forEach(doc => {
      const data = doc.data();
      revenue += parseFloat(data.total || data.totalPrice || 0);
    });

    res.json({
      totalOrders,
      revenue,
      productCount,
      customers,
      monthlySales: [1200, 1900, 1500, 4500, 3200, 5000]
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- AI ENDPOINT (PUBLIC, NO ADMIN TOKEN REQUIRED) ---
app.post("/api/ai/analyze", async (req, res) => {
  const { base64Data, mimeType } = req.body;
  if (!base64Data) {
    return res.status(400).json({ error: "Image base64 data is required" });
  }

  // Fallback if API key is not present
  if (!process.env.GEMINI_API_KEY) {
    console.log("No GEMINI_API_KEY environment variable found. Returning premium simulated details.");
    return res.json({
      name: "Whispering Blossom Vessel",
      description: "A breath of timeless elegance, this handcrafted masterpiece weaves whispers of gold and ivory into a harmonious symphony, perfect for elevating any curated sanctuary.",
      category: "Handmade Crafts",
      tags: ["handmade", "premium", "gold", "decor"]
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          inlineData: {
            mimeType: mimeType || 'image/jpeg',
            data: base64Data
          }
        },
        {
          text: "Analyze this gift image. Return a JSON object matching this schema:\n" +
                "{\n" +
                "  \"name\": \"string (elegant gallery-ready name)\",\n" +
                "  \"description\": \"string (~50 words poetic description highlighting craftsmanship)\",\n" +
                "  \"category\": \"Soft Toys | Handmade Crafts | Personalized Gifts | Home Decor\",\n" +
                "  \"tags\": [\"string\"]\n" +
                "}"
        }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });

    if (response.text) {
      const parsed = JSON.parse(response.text.trim());
      res.json(parsed);
    } else {
      throw new Error("Empty response from Gemini");
    }
  } catch (error: any) {
    console.error("Gemini AI API failed:", error.message);
    res.json({
      name: "Ethereal Aura Masterpiece",
      description: "Crafted with dynamic precision and fine gold borders, this item represents the peak of art-gallery elegance and handmade detail.",
      category: "Handmade Crafts",
      tags: ["handcrafted", "elegant", "gold", "artistry"]
    });
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
    console.log(`Server running — open http://localhost:${PORT} in your browser`);
  });
}

// Do not call startServer() on Vercel
if (!process.env.VERCEL) {
  startServer();
}

export default app;
