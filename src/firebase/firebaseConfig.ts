// Re-export everything from the correct config file to fix stale imports
export { firebaseApp as default, auth, firestore, storage } from './config';
