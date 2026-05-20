import { auth } from './firebaseConfig';
import { signInWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged as firebaseOnAuthStateChanged, User } from 'firebase/auth';

/**
 * Sign in using email and password.
 */
export const signIn = async (email: string, password: string): Promise<User> => {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
};

/**
 * Sign out the current user.
 */
export const signOut = async (): Promise<void> => {
  await firebaseSignOut(auth);
};

/**
 * Listen for auth state changes.
 */
export const onAuthStateChanged = (callback: (user: User | null) => void) => {
  return firebaseOnAuthStateChanged(auth, callback);
};

/**
 * Check if the user has admin custom claim.
 * Assumes you set a custom claim `admin: true` on the user token.
 */
export const isAdmin = async (user: User): Promise<boolean> => {
  if (!user) return false;
  const tokenResult = await user.getIdTokenResult();
  return tokenResult.claims?.admin === true;
};
