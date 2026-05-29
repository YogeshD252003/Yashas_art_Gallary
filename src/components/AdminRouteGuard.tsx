import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

/**
 * AdminRouteGuard protects admin routes.
 * It checks the custom JWT auth state and role.
 * While loading, it shows a spinner.
 */
const AdminRouteGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
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

  const allowedRoles = ["SUPER_ADMIN", "ADMIN", "PRODUCT_MANAGER", "ORDER_MANAGER"];
  const isAllowed = user && user.role && allowedRoles.includes(user.role);

  if (!isAllowed) {
    // Redirect to login if not admin or not logged in
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default AdminRouteGuard;
