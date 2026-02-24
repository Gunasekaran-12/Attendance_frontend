import React, {
  createContext,
  useState,
  useContext,
  useEffect,
} from 'react';
import { authAPI } from '../api';

const AuthContext = createContext(null);

/* ---------------- USE AUTH HOOK ---------------- */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/* ---------------- AUTH PROVIDER ---------------- */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ---------------- RESTORE SESSION ON REFRESH ---------------- */
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.clear();
        setUser(null);
      }
    }

    setLoading(false);
  }, []);

  /* ---------------- LOGIN ---------------- */
  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      const { token, role, username, userId, school, studentId, teacherId } = response.data;

      const userData = {
        id: userId,
        username,
        role,
        school,
        studentId,
        teacherId,
      };

      // ✅ STORE ONLY IN localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));

      setUser(userData);

      return { success: true, user: userData };
    } catch (error) {
      const serverMessage = error.response?.data?.message || error.response?.data;
      return {
        success: false,
        error: serverMessage || error.message || 'Login failed',
      };
    }
  };

  /* ---------------- LOGOUT ---------------- */
  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.clear();
      setUser(null);
    }
  };

  /* ---------------- ROLE HELPERS ---------------- */
  const hasRole = (role) => user?.role === role;

  const isAdmin = () =>
    ['SUPER_ADMIN', 'DISTRICT_ADMIN', 'BLOCK_ADMIN', 'SCHOOL_ADMIN'].includes(
      user?.role
    );

  /* ---------------- CONTEXT VALUE ---------------- */
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        hasRole,
        isAdmin,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
