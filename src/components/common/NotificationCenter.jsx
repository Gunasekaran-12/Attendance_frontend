import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, Trash2, Info, AlertTriangle, CloudLightning, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNetwork } from '../../context/NetworkContext';

const NotificationCenter = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const { isOnline } = useNetwork();
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        if (!user) return;
        
        // Load from local storage or generate default notifications based on role
        const storageKey = `notifications_${user.id}`;
        const cached = localStorage.getItem(storageKey);
        
        if (cached) {
            setNotifications(JSON.parse(cached));
        } else {
            // Generate standard welcome and role-specific notifications
            const defaults = [
                {
                    id: 'welcome',
                    title: 'Welcome to Attendance System',
                    message: `Hello ${user.username}! Welcome to your offline-first attendance portal.`,
                    type: 'INFO',
                    time: new Date().toISOString(),
                    read: false
                }
            ];

            if (user.role === 'TEACHER') {
                defaults.push({
                    id: 'teacher-offline-info',
                    title: 'Offline Mode Enabled',
                    message: 'You can take roll call even without network coverage. The app will sync automatically once connection is restored.',
                    type: 'SUCCESS',
                    time: new Date(Date.now() - 3600000).toISOString(),
                    read: false
                });
            }

            if (user.role === 'STUDENT' || user.role === 'PARENT') {
                defaults.push({
                    id: 'student-metrics-info',
                    title: 'Baseline Target: 75%',
                    message: 'Keep your Attendance Fidelity Score above 75% to stay compliant with academic guidelines.',
                    type: 'WARNING',
                    time: new Date(Date.now() - 7200000).toISOString(),
                    read: false
                });
            }

            setNotifications(defaults);
            localStorage.setItem(storageKey, JSON.stringify(defaults));
        }
    }, [user]);

    // Periodically check/sync updates or network changes to inject notifications
    useEffect(() => {
        if (!user) return;
        const storageKey = `notifications_${user.id}`;
        
        // Generate network status notifications dynamically
        const newNotification = {
            id: `net_${Date.now()}`,
            title: isOnline ? 'Network Restored' : 'Offline Mode Active',
            message: isOnline 
                ? 'Central connection active. Pending sync operations initiated.'
                : 'Offline. Local writes will queue automatically.',
            type: isOnline ? 'SUCCESS' : 'INFO',
            time: new Date().toISOString(),
            read: false
        };

        setNotifications(prev => {
            // Avoid duplicate network notifications in list
            const filtered = prev.filter(n => !n.id.startsWith('net_'));
            const updated = [newNotification, ...filtered].slice(0, 15);
            localStorage.setItem(storageKey, JSON.stringify(updated));
            return updated;
        });
    }, [isOnline, user]);

    const saveAndSetNotifications = (updatedList) => {
        setNotifications(updatedList);
        if (user) {
            localStorage.setItem(`notifications_${user.id}`, JSON.stringify(updatedList));
        }
    };

    const markAsRead = (id) => {
        const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
        saveAndSetNotifications(updated);
    };

    const deleteNotification = (id) => {
        const updated = notifications.filter(n => n.id !== id);
        saveAndSetNotifications(updated);
    };

    const markAllRead = () => {
        const updated = notifications.map(n => ({ ...n, read: true }));
        saveAndSetNotifications(updated);
    };

    const clearAll = () => {
        saveAndSetNotifications([]);
    };

    const getIcon = (type) => {
        switch (type) {
            case 'WARNING':
                return <AlertTriangle className="w-5 h-5 text-amber-500" />;
            case 'SUCCESS':
                return <CheckCircle className="w-5 h-5 text-emerald-500" />;
            case 'DANGER':
                return <CloudLightning className="w-5 h-5 text-rose-500" />;
            default:
                return <Info className="w-5 h-5 text-indigo-500" />;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800/80 shadow-2xl z-50 overflow-hidden text-left transition-all duration-300">
            {/* Header */}
            <div className="p-5 border-b border-slate-50 dark:border-slate-850 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <span className="font-extrabold text-slate-800 dark:text-white text-base">Alert Vault</span>
                </div>
                <div className="flex items-center gap-2">
                    {notifications.length > 0 && (
                        <button 
                            onClick={markAllRead}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-bold text-indigo-600 dark:text-indigo-400 transition-colors"
                            title="Mark all as read"
                        >
                            Read All
                        </button>
                    )}
                    <button 
                        onClick={onClose} 
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="max-h-[350px] overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800/40">
                <AnimatePresence initial={false}>
                    {notifications.length === 0 ? (
                        <div className="p-12 text-center flex flex-col items-center justify-center opacity-40">
                            <Bell className="w-10 h-10 text-slate-300 mb-2" />
                            <p className="font-bold text-slate-400 text-xs uppercase tracking-widest">No Alerts Pending</p>
                        </div>
                    ) : (
                        notifications.map((item) => (
                            <motion.div 
                                key={item.id}
                                layout
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={`p-4 flex gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors relative group ${!item.read ? 'bg-indigo-50/20 dark:bg-indigo-950/10' : ''}`}
                            >
                                <div className="mt-0.5">
                                    {getIcon(item.type)}
                                </div>
                                <div className="flex-1 pr-6">
                                    <div className={`text-sm font-bold tracking-tight text-slate-800 dark:text-slate-200 ${!item.read ? 'font-black' : ''}`}>
                                        {item.title}
                                    </div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                        {item.message}
                                    </div>
                                    <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-1.5">
                                        {new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                                
                                {/* Actions Overlay */}
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {!item.read && (
                                        <button 
                                            onClick={() => markAsRead(item.id)}
                                            className="p-1 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 border border-slate-100 dark:border-slate-700 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg shadow-sm transition-colors"
                                            title="Mark as read"
                                        >
                                            <Check className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => deleteNotification(item.id)}
                                        className="p-1 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950 border border-slate-100 dark:border-slate-700 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg shadow-sm transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
                <div className="p-4 border-t border-slate-50 dark:border-slate-800/40 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between">
                    <button 
                        onClick={clearAll}
                        className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        Clear All
                    </button>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        {notifications.filter(n => !n.read).length} Unread
                    </span>
                </div>
            )}
        </div>
    );
};

export default NotificationCenter;
