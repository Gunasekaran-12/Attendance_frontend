import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import GlobalSyncBar from '../common/GlobalSyncBar';
import SyncConsentDialog from '../common/SyncConsentDialog';
const DashboardLayout = ({ children }) => {
    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 transition-colors duration-300">
            <Navbar />
            <GlobalSyncBar />
            <SyncConsentDialog />

            <AnimatePresence mode="wait">
                <motion.main
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{
                        duration: 0.5,
                        ease: [0.22, 1, 0.36, 1]
                    }}
                    className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8"
                >
                    <div className="relative">
                        {/* Subtle background glow effect */}
                        <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-100/30 rounded-full blur-3xl -z-10" />
                        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-100/20 rounded-full blur-3xl -z-10" />

                        {children}
                    </div>
                </motion.main>
            </AnimatePresence>

            <footer className="py-8 text-center text-slate-400 text-sm">
                &copy; {new Date().getFullYear()} Enterprise Attendance System. Built for Excellence.
            </footer>
        </div>
    );
};

export default DashboardLayout;
