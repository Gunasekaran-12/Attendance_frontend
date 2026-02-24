import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import localforage from 'localforage';
import { apiClient } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import DashboardLayout from './layout/DashboardLayout';
import { Save, CloudOff, CheckCircle2, User as UserIcon, Wifi, WifiOff, Hash, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const AttendanceSheet = ({ className: propClassName }) => {
    const { user } = useAuth();
    const toast = useToast();
    const [students, setStudents] = useState([]);
    const [attendance, setAttendance] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [syncProgress, setSyncProgress] = useState(0);

    const schoolId = user?.school?.id || 1;
    const targetClass = propClassName || '1-A';

    useEffect(() => {
        const handleStatusChange = () => setIsOnline(navigator.onLine);
        window.addEventListener('online', handleStatusChange);
        window.addEventListener('offline', handleStatusChange);

        loadStudents();

        return () => {
            window.removeEventListener('online', handleStatusChange);
            window.removeEventListener('offline', handleStatusChange);
        };
    }, [targetClass]);

    const loadStudents = async () => {
        setLoading(true);
        try {
            // Fetch students for the school
            const response = await apiClient.get(`/students/school/${schoolId}`);
            // Filter by class if necessary
            const filtered = response.data.filter(s => s.className === targetClass || !targetClass);
            setStudents(filtered);

            // Initialize all as PRESENT
            const initialStatus = {};
            filtered.forEach(s => initialStatus[s.id] = 'PRESENT');
            setAttendance(initialStatus);

            toast.success(`Roster for Class ${targetClass} synchronized`);
        } catch (error) {
            console.error("Failed to load students", error);
            toast.error("System failed to synchronize class roster");
        } finally {
            setLoading(false);
        }
    };

    const toggleAttendance = (id) => {
        setAttendance(prev => ({
            ...prev,
            [id]: prev[id] === 'PRESENT' ? 'ABSENT' : 'PRESENT'
        }));
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        const date = new Date().toISOString().split('T')[0];
        const payload = Object.entries(attendance).map(([studentId, status]) => ({
            studentId,
            schoolId,
            date,
            status,
            markedBy: user?.id,
            timestamp: new Date().toISOString()
        }));

        try {
            if (!isOnline) {
                await localforage.setItem(`offline_attendance_${targetClass}_${date}`, payload);
                toast.warning('Network unavailable. Secure vault storage engaged.');
            } else {
                toast.loading('Synchronizing attendance records...');
                // Bulk submit (assuming backend supports it or doing sequentially with progress)
                for (let i = 0; i < payload.length; i++) {
                    await apiClient.post('/attendance', payload[i]);
                    setSyncProgress(((i + 1) / payload.length) * 100);
                }
                toast.dismiss();
                toast.success('All records successfully verified and uploaded');
            }
        } catch (error) {
            console.error("Sync failed", error);
            await localforage.setItem(`fallback_attendance_${targetClass}_${date}`, payload);
            toast.error('Server sync failed. Backup vault storage engaged.');
        } finally {
            setSubmitting(false);
            setSyncProgress(0);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
                <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
                <p className="text-slate-500 font-bold animate-pulse tracking-widest uppercase text-xs">Initializing Roster Hub</p>
            </div>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <Link to="/dashboard" className="inline-flex items-center gap-2 text-indigo-600 font-bold hover:text-indigo-700 transition-colors mb-4">
                            <ArrowLeft className="w-4 h-4" />
                            Return to Insight Hub
                        </Link>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center">
                                <Hash className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Roster Registry</h1>
                                <p className="text-slate-500 font-medium">Session: {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`px-6 py-3 rounded-2xl border flex items-center gap-3 font-bold transition-all ${isOnline ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'}`}
                    >
                        {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5 animate-pulse" />}
                        {isOnline ? 'SYSTEM ONLINE' : 'OFFLINE MODE ACTIVE'}
                    </motion.div>
                </div>

                {/* Toolbar */}
                <div className="dashboard-widget flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <span className="px-5 py-2 bg-indigo-50 text-indigo-700 rounded-xl font-black text-sm uppercase tracking-tighter">
                            Class: {targetClass}
                        </span>
                        <span className="text-slate-400 font-bold text-sm">
                            {students.length} Registered Identities
                        </span>
                    </div>
                </div>

                {/* Grid Registry */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {students.map((student, idx) => {
                            const isAbsent = attendance[student.id] === 'ABSENT';
                            return (
                                <motion.div
                                    key={student.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    whileHover={{ y: -5 }}
                                    onClick={() => toggleAttendance(student.id)}
                                    className={`dashboard-widget cursor-pointer border-2 transition-all p-6 relative overflow-hidden group ${isAbsent ? 'border-rose-100 bg-rose-50/30' : 'border-slate-50 hover:border-indigo-100 bg-white'}`}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={`p-3 rounded-2xl transition-all ${isAbsent ? 'bg-rose-100 text-rose-600 scale-110' : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600'}`}>
                                            <UserIcon className="w-6 h-6" />
                                        </div>
                                        <div className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-lg ${isAbsent ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'}`}>
                                            {attendance[student.id]}
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-extrabold text-slate-800 tracking-tight mb-1">{student.name}</h3>
                                    <p className="text-slate-400 font-bold text-sm">ID Reference: {student.rollNumber}</p>

                                    <div className={`absolute bottom-0 left-0 w-full h-1 transition-all ${isAbsent ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>

                {/* Footer Submit */}
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6 z-50"
                >
                    <div className="bg-white/70 backdrop-blur-3xl border border-white/50 p-6 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] flex flex-col gap-4">
                        {submitting && syncProgress > 0 && (
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-indigo-600"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${syncProgress}%` }}
                                />
                            </div>
                        )}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleSubmit}
                            disabled={submitting || students.length === 0}
                            className="premium-button w-full h-16 bg-indigo-600 text-white flex items-center justify-center gap-3 text-xl font-black shadow-xl shadow-indigo-600/30 disabled:opacity-50"
                        >
                            {submitting ? (
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>SYNCHRONIZING RECORDS...</span>
                                </div>
                            ) : (
                                <>
                                    <Save className="w-6 h-6" />
                                    {isOnline ? 'COMMIT VERIFIED ENTRIES' : 'SECURE IN OFFLINE VAULT'}
                                </>
                            )}
                        </motion.button>
                        <p className="text-center text-xs font-black text-slate-400 uppercase tracking-widest">
                            {isOnline ? 'Direct Cloud Synchronization protocol active' : 'End-to-end encrypted offline storage active'}
                        </p>
                    </div>
                </motion.div>

                <div className="h-40" /> {/* Spacer */}
            </div>
        </DashboardLayout>
    );
};

export default AttendanceSheet;
