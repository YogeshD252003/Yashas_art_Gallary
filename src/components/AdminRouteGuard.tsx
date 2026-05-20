import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged, isAdmin } from '../firebase/auth';
import { Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

/**
 * AdminRouteGuard protects admin routes.
 * It checks Firebase auth state and admin custom claim.
 * While loading, it shows a spinner.
 */
const AdminRouteGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const unsub = onAuthStateChanged(async (user) => {
      if (user) {
        // First try custom claim
        const admin = await isAdmin(user);
        // Fallback: allow specific admin email (e.g., admin@yashas.com)
        const emailAdmin = user.email && user.email.endsWith('@yashas.com');
        setAllowed(admin || !!emailAdmin);
      } else {
        setAllowed(false);
      }
      setChecking(false);
    });
    return () => unsub();
  }, []);

  if (checking) {
    return (
      <div className="h-screen flex items-center justify-center bg-ivory dark:bg-dark-bg">
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
        >
          <Loader2 size={48} className="text-gold-600" />
        </motion.div>
      </div>
    );
  }

  if (!allowed) {
    // Redirect to login if not admin or not logged in
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default AdminRouteGuard;
