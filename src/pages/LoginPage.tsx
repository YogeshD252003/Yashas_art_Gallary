// src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { signIn, isAdmin } from '../firebase/auth';
import { useAuth } from '../AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

/**
 * Admin login page.
 * Uses Firebase email/password authentication and checks the custom `admin` claim.
 * On success the user is redirected to the previously requested admin route
 * (stored in location.state.from) or to /admin by default.
 */
const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const user = await signIn(email, password);
      const token = await user.getIdToken();
      // Store token and userId in AuthContext
      login(token, user.uid);
      const admin = await isAdmin(user);
      if (admin) {
        navigate(from, { replace: true });
      } else {
        setError('You do not have admin access.');
        // Optionally sign out to clear auth state.
        // await firebaseSignOut(auth);
      }
    } catch (err: any) {
      setError(err.message ?? 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 to-indigo-900">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-xl bg-white/10 p-8 backdrop-blur-lg shadow-xl"
      >
        <h2 className="mb-6 text-center text-2xl font-bold text-white">Admin Login</h2>
        {error && (
          <p className="mb-4 text-center text-sm text-red-300">{error}</p>
        )}
        <input
          type="email"
          placeholder="Email"
          className="mb-4 w-full rounded bg-white/20 px-4 py-2 text-white placeholder-gray-300 focus:outline-none"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="mb-6 w-full rounded bg-white/20 px-4 py-2 text-white placeholder-gray-300 focus:outline-none"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded bg-gradient-to-r from-pink-500 to-purple-600 py-2 font-medium text-white transition hover:opacity-90"
        >
          {loading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            >
              <Loader2 size={20} className="animate-spin" />
            </motion.div>
          ) : (
            'Sign In'
          )}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
