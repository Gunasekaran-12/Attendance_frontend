import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, User as UserIcon, Shield } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Hide navbar if not logged in
  if (!user) return null;

  const handleLogout = async () => {
    await logout();          // clear auth + storage
    navigate('/login', { replace: true }); // always go to login
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">

          {/* Brand (NOT clickable – avoids redirects) */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-none">
                Enterprise
              </h1>
              <p className="text-[10px] uppercase font-bold text-indigo-600 tracking-widest mt-1">
                Attendance System
              </p>
            </div>
          </div>

          {/* Right side: User Info + Logout */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-3 py-1.5 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex flex-col items-end">
                <span className="text-sm font-bold text-slate-800">
                  {user.username}
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                  {user.role?.replace('_', ' ')}
                </span>
              </div>

              <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-indigo-600" />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors shadow-sm"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
