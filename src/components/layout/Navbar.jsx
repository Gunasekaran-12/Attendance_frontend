import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, User as UserIcon, Shield, Wifi, WifiOff, Sun, Moon, Bell } from 'lucide-react';
import { useNetwork } from '../../context/NetworkContext';
import NotificationCenter from '../common/NotificationCenter';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { isOnline } = useNetwork();

  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    if (!user) return;
    const updateCount = () => {
      const cached = localStorage.getItem(`notifications_${user.id}`);
      if (cached) {
        const notifs = JSON.parse(cached);
        setUnreadCount(notifs.filter(n => !n.read).length);
      }
    };
    updateCount();
    const interval = setInterval(updateCount, 2000);
    return () => clearInterval(interval);
  }, [user]);

  // Hide navbar if not logged in
  if (!user) return null;

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const handleLogout = async () => {
    await logout();          // clear auth + storage
    navigate('/login', { replace: true }); // always go to login
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-300"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">

          {/* Brand (NOT clickable – avoids redirects) */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-none">
                Enterprise
              </h1>
              <p className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 tracking-widest mt-1">
                Attendance System
              </p>
            </div>
          </div>

          {/* Right side: Network Status + User Info + Theme + Alert + Logout */}
          <div className="flex items-center gap-4">

            {/* Network Status Indicator */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50">
              <AnimatePresence mode="wait">
                {isOnline ? (
                  <motion.div
                    key="online"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    className="flex items-center gap-2"
                  >
                    <div className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </div>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-350">Online</span>
                    <Wifi className="w-3.5 h-3.5 text-emerald-500" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="offline"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    className="flex items-center gap-2"
                  >
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Offline</span>
                    <WifiOff className="w-3.5 h-3.5 text-rose-500" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-3 px-3 py-1.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50">
              <div className="flex flex-col items-end">
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {user.username}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tight">
                  {user.role?.replace('_', ' ')}
                </span>
              </div>

              <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>

            {/* Theme Toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-200 rounded-xl border border-slate-100 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-sm cursor-pointer"
              title={theme === 'dark' ? 'Activate Light Mode' : 'Activate Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-indigo-600" />}
            </motion.button>

            {/* Notification Bell */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setNotifOpen(!notifOpen)}
                className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-200 rounded-xl border border-slate-100 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-sm cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white dark:border-slate-800 animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </motion.button>
              <NotificationCenter isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="p-3 bg-red-50 dark:bg-rose-950/30 text-red-600 dark:text-rose-450 rounded-xl hover:bg-red-100 dark:hover:bg-rose-900/40 transition-colors shadow-sm cursor-pointer"
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
