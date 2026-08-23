import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

/**
 * AdminRoute — frontend route guard for /admin/* routes.
 *
 * IMPORTANT: This is a UX convenience layer only.
 * Real security is enforced by isAuth + isAdmin middleware on every backend API.
 * Even if someone bypasses this guard, every admin API will return 403.
 *
 * Three states:
 * 1. Not initialized yet (current-user API still in flight) → show spinner
 * 2. Initialized, no user (unauthenticated) → redirect to /Auth
 * 3. Initialized, user exists but role !== "admin" → redirect to /
 * 4. Admin user → render children
 */
const AdminRoute = ({ children }) => {
  const { userData, initialized } = useSelector((state) => state.user);

  // Wait for the current-user API to resolve before making a routing decision.
  // Avoids flashing redirect to /Auth while the cookie is being validated.
  if (!initialized) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return <Navigate to="/Auth" replace />;
  }

  if (userData.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;
