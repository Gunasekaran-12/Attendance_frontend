import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles, requiredRole }) => {
  const { user, loading } = useAuth();

  // ⏳ Wait until auth state is restored
  if (loading) return null; // or spinner

  // 🔐 Not logged in → Login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 🔒 Single role protection
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/login" replace />;
  }

  // 🔒 Multiple role protection
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
