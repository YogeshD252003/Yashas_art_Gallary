const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const fs = require("fs");
const path = require("path");

const saPath = path.join(__dirname, "serviceAccountKey.json");
const serviceAccount = JSON.parse(fs.readFileSync(saPath, "utf8"));

const app = initializeApp({
  credential: cert(serviceAccount),
  projectId: "yashas-art-gallery"
});

const db = getFirestore(app);

async function check() {
  console.log("Checking Firestore...");
  const adminsSnap = await db.collection("admins").get();
  console.log(`Found ${adminsSnap.size} admins:`);
  adminsSnap.forEach(doc => {
    const data = doc.data();
    console.log(`- Document ID: ${doc.id}`);
    console.log(`  Email: ${data.email}`);
    console.log(`  Role: ${data.role}`);
    console.log(`  FullName: ${data.fullName}`);
    console.log(`  Password Hash: ${data.password}`);
  });

  const productsSnap = await db.collection("products").get();
  console.log(`Found ${productsSnap.size} products.`);
  productsSnap.forEach(doc => {
     console.log(`- Product ID: ${doc.id}, Name: ${doc.data().name}`);
  });
}

check().catch(err => {
  console.error("Error checking Firestore:", err);
});
