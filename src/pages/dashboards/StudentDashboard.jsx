import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI, attendanceAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Calendar, Award, Activity, CheckCircle2, XCircle, Clock, ArrowRight, User as UserIcon, QrCode as QrIcon, X } from 'lucide-react';
import QRCodeGenerator from '../../components/Attendance/QRCodeGenerator';

const StudentDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();
    const [percentage, setPercentage] = useState(null);
    const [attendanceHistory, setAttendanceHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showQRModal, setShowQRModal] = useState(false);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const studentId = user?.studentId || user?.id;

            const [statsRes, historyRes] = await Promise.all([
                dashboardAPI.getStudentStats(studentId),
                attendanceAPI.getByStudent(studentId),
            ]);

            setPercentage(statsRes.data);
            setAttendanceHistory(historyRes.data);
            toast.success('Your academic presence record is live');
        } catch (error) {
            console.error('Error loading dashboard:', error);
            toast.error('Identity record retrieval failed');
        } finally {
            setLoading(false);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'PRESENT':
                return { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40', icon: CheckCircle2 };
            case 'ABSENT':
                return { color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/40', icon: XCircle };
            case 'LATE':
                return { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40', icon: Clock };
            default:
                return { color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-50 dark:bg-slate-800', icon: Calendar };
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="py-20 flex flex-col items-center justify-center">
                    <LoadingSpinner />
                    <p className="mt-4 font-bold text-slate-400 dark:text-slate-500">Securely loading your academic profile...</p>
                </div>
            </DashboardLayout>
        );
    }

    const cards = [
        { label: 'Monthly Presence', value: `${percentage?.currentMonth?.toFixed(1)}%`, sub: `${percentage?.presentDaysThisMonth} / ${percentage?.totalDaysThisMonth} Days`, icon: Calendar, color: 'indigo' },
        { label: 'Overall Metric', value: `${percentage?.overall?.toFixed(1)}%`, sub: 'All-time verification', icon: Activity, color: 'emerald' },
        { label: 'Engagement Tier', value: percentage?.overall >= 90 ? 'Platinum' : percentage?.overall >= 75 ? 'Gold' : 'Basic', sub: 'Academic status', icon: Award, color: 'amber' }
    ];

    return (
        <DashboardLayout>
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-8"
            >
                {/* Header Section */}
                <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div
                            onClick={() => navigate(`/profile/student/${user.studentId || user.id}`)}
                            className="w-16 h-16 bg-white dark:bg-slate-800 rounded-3xl shadow-xl flex items-center justify-center cursor-pointer hover:bg-indigo-50 dark:hover:bg-slate-700 transition-all group/profile"
                        >
                            <UserIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400 group-hover/profile:scale-110 transition-transform" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Academic Identity</h1>
                            <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Hello, {user?.username}. Accessing your verified records.</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setShowQRModal(true)}
                            className="premium-button bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-slate-700 flex items-center gap-2"
                        >
                            <QrIcon className="w-4 h-4" />
                            Show QR ID
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={loadDashboardData}
                            className="premium-button bg-indigo-600 text-white flex items-center gap-2"
                        >
                            Sync Record
                            <ArrowRight className="w-4 h-4" />
                        </motion.button>
                    </div>
                </motion.div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {cards.map((card, i) => (
                        <motion.div
                            key={i}
                            variants={itemVariants}
                            whileHover={{ y: -5 }}
                            className="dashboard-widget overflow-hidden relative group"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className={`p-3 rounded-2xl bg-${card.color}-50 dark:bg-${card.color}-950/40 text-${card.color}-600 dark:text-${card.color}-400`}>
                                    <card.icon className="w-6 h-6" />
                                </div>
                                <span className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{card.label}</span>
                            </div>
                            <div className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">{card.value}</div>
                            <p className="text-slate-400 dark:text-slate-500 text-sm font-medium mt-2">{card.sub}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Progress Visualizer */}
                <motion.div variants={itemVariants} className="dashboard-widget">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        Attendance Fidelity Score
                    </h2>
                    <div className="relative h-12 w-full bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden p-1.5">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage?.currentMonth || 0}%` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className={`h-full rounded-[0.65rem] flex items-center justify-end pr-4 transition-all ${percentage?.currentMonth >= 75 ? 'bg-indigo-600 shadow-lg shadow-indigo-600/30' : 'bg-rose-500 shadow-lg shadow-rose-500/30'
                                }`}
                        >
                            <span className="text-white font-black text-sm italic">{percentage?.currentMonth?.toFixed(1)}%</span>
                        </motion.div>
                    </div>
                    <div className="mt-4 flex items-center gap-2 px-1">
                        <div className={`w-2 h-2 rounded-full ${percentage?.currentMonth >= 75 ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                        <p className={`text-sm font-bold ${percentage?.currentMonth >= 75 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            {percentage?.currentMonth >= 75 ? 'CONGRATULATIONS: You are meeting enrollment requirements.' : 'ATTENTION: You are currently below the required 75% baseline.'}
                        </p>
                    </div>
                </motion.div>

                {/* Event History */}
                <motion.div variants={itemVariants} className="dashboard-widget overflow-hidden">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        Engagement History
                    </h2>
                    <div className="overflow-x-auto">
                        {attendanceHistory.length === 0 ? (
                            <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/30 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-700">
                                <p className="text-slate-400 dark:text-slate-500 font-bold">No verified events found in the current cycle.</p>
                            </div>
                        ) : (
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                                        <th className="pb-5 pl-4">Timestamp</th>
                                        <th className="pb-5">Verification State</th>
                                        <th className="pb-5">Detected At</th>
                                        <th className="pb-5 pr-4">Methodology</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                                    {attendanceHistory.map((record, index) => {
                                        const style = getStatusStyle(record.status);
                                        return (
                                            <motion.tr
                                                key={index}
                                                whileHover={{ backgroundColor: 'rgba(248, 250, 252, 0.08)' }}
                                                className="transition-colors group"
                                            >
                                                <td className="py-5 pl-4 font-bold text-slate-700 dark:text-slate-200">
                                                    {new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </td>
                                                <td className="py-5">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-tighter ${style.bg} ${style.color}`}>
                                                        <style.icon className="w-3.5 h-3.5" />
                                                        {record.status}
                                                    </span>
                                                </td>
                                                <td className="py-5 font-medium text-slate-500 dark:text-slate-400">
                                                    {record.timestamp ? new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '---'}
                                                </td>
                                                <td className="py-5 pr-4">
                                                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors uppercase tracking-widest">
                                                        {record.markingMethod || 'Enterprise Sync'}
                                                    </span>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </motion.div>
            </motion.div>

            {/* QR Code Modal Dialog */}
            <AnimatePresence>
                {showQRModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowQRModal(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        
                        {/* Modal Content */}
                        <motion.div
                            initial={{ scale: 0.9, y: 20, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.9, y: 20, opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                            className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 max-w-sm w-full border border-slate-100 dark:border-slate-800 shadow-2xl relative z-10 flex flex-col items-center text-center"
                        >
                            <button
                                onClick={() => setShowQRModal(false)}
                                className="absolute top-5 right-5 p-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-200 rounded-xl transition-colors cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-6">
                                <QrIcon className="w-6 h-6" />
                            </div>

                            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Your Identity Pass</h3>
                            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-1">Scan to mark attendance</p>

                            <div className="my-6">
                                <QRCodeGenerator value={JSON.stringify({ studentId: user.studentId || user.id })} size={180} />
                            </div>

                            <div className="space-y-1 mb-6">
                                <div className="text-lg font-black text-slate-850 dark:text-slate-100 uppercase">{user.username}</div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Student ID Ref: #{user.studentId || user.id}</div>
                                <div className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-3 py-1 rounded-full font-bold uppercase tracking-widest inline-block mt-2">
                                    Role: {user.role}
                                </div>
                            </div>

                            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium leading-relaxed bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/60">
                                Present this screen to your teacher. The QR code contains your verified enrollment credentials and works fully offline.
                            </p>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
};

export default StudentDashboard;
