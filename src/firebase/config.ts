import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration (real values)
const firebaseConfig = {
  apiKey: "AIzaSyARKokFgkUI01r7cuVl38NDmUnVYRZHokU",
  authDomain: "yashas-art-gallery.firebaseapp.com",
  projectId: "yashas-art-gallery",
  storageBucket: "yashas-art-gallery.firebasestorage.app",
  messagingSenderId: "601202341856",
  appId: "1:601202341856:web:23b91b88439098554add85",
  measurementId: "G-57TDNYMB0D",
};

// Initialize Firebase app
export const firebaseApp = initializeApp(firebaseConfig);

// Export services
export const auth = getAuth(firebaseApp);
export const firestore = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);

export default firebaseApp;
