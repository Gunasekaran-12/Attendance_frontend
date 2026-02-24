import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI, attendanceAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Calendar, Award, Activity, CheckCircle2, XCircle, Clock, ArrowRight, User as UserIcon } from 'lucide-react';

const StudentDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();
    const [percentage, setPercentage] = useState(null);
    const [attendanceHistory, setAttendanceHistory] = useState([]);
    const [loading, setLoading] = useState(true);

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
                return { color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle2 };
            case 'ABSENT':
                return { color: 'text-rose-600', bg: 'bg-rose-50', icon: XCircle };
            case 'LATE':
                return { color: 'text-amber-600', bg: 'bg-amber-50', icon: Clock };
            default:
                return { color: 'text-slate-600', bg: 'bg-slate-50', icon: Calendar };
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
                    <p className="mt-4 font-bold text-slate-400">Securely loading your academic profile...</p>
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
                            className="w-16 h-16 bg-white rounded-3xl shadow-xl flex items-center justify-center cursor-pointer hover:bg-indigo-50 transition-all group/profile"
                        >
                            <UserIcon className="w-8 h-8 text-indigo-600 group-hover/profile:scale-110 transition-transform" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Academic Identity</h1>
                            <p className="text-slate-500 font-medium mt-1">Hello, {user?.username}. Accessing your verified records.</p>
                        </div>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={loadDashboardData}
                        className="premium-button bg-indigo-600 text-white flex items-center gap-2"
                    >
                        Sync Record
                        <ArrowRight className="w-4 h-4" />
                    </motion.button>
                </motion.div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {cards.map((card, i) => (
                        <motion.div
                            key={i}
                            variants={itemVariants}
                            whileHover={{ y: -5 }}
                            className={`dashboard-widget border border-${card.color}-100 overflow-hidden relative group`}
                        >
                            <div className={`absolute top-0 right-0 p-4 opacity-5 bg-${card.color}-600 rounded-bl-3xl`}>
                                <card.icon className="w-16 h-16" />
                            </div>
                            <div className="flex items-center gap-4 mb-4">
                                <div className={`p-3 bg-${card.color}-50 text-${card.color}-600 rounded-2xl`}>
                                    <card.icon className="w-6 h-6" />
                                </div>
                                <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">{card.label}</span>
                            </div>
                            <div className="text-4xl font-extrabold text-slate-900 tracking-tight">{card.value}</div>
                            <p className="text-slate-400 text-sm font-medium mt-2">{card.sub}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Progress Visualizer */}
                <motion.div variants={itemVariants} className="dashboard-widget">
                    <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-indigo-600" />
                        Attendance Fidelity Score
                    </h2>
                    <div className="relative h-12 w-full bg-slate-100 rounded-2xl overflow-hidden p-1.5">
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
                        <p className={`text-sm font-bold ${percentage?.currentMonth >= 75 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {percentage?.currentMonth >= 75 ? 'CONGRATULATIONS: You are meeting enrollment requirements.' : 'ATTENTION: You are currently below the required 75% baseline.'}
                        </p>
                    </div>
                </motion.div>

                {/* Event History */}
                <motion.div variants={itemVariants} className="dashboard-widget overflow-hidden">
                    <h2 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-indigo-600" />
                        Engagement History
                    </h2>
                    <div className="overflow-x-auto">
                        {attendanceHistory.length === 0 ? (
                            <div className="text-center py-20 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
                                <p className="text-slate-400 font-bold">No verified events found in the current cycle.</p>
                            </div>
                        ) : (
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-slate-400 text-xs font-bold uppercase tracking-widest border-b border-slate-100">
                                        <th className="pb-5 pl-4">Timestamp</th>
                                        <th className="pb-5">Verification State</th>
                                        <th className="pb-5">Detected At</th>
                                        <th className="pb-5 pr-4">Methodology</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {attendanceHistory.map((record, index) => {
                                        const style = getStatusStyle(record.status);
                                        return (
                                            <motion.tr
                                                key={index}
                                                whileHover={{ backgroundColor: 'rgba(248, 250, 252, 0.8)' }}
                                                className="transition-colors group"
                                            >
                                                <td className="py-5 pl-4 font-bold text-slate-700">
                                                    {new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </td>
                                                <td className="py-5">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-tighter ${style.bg} ${style.color}`}>
                                                        <style.icon className="w-3.5 h-3.5" />
                                                        {record.status}
                                                    </span>
                                                </td>
                                                <td className="py-5 font-medium text-slate-500">
                                                    {record.timestamp ? new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '---'}
                                                </td>
                                                <td className="py-5 pr-4">
                                                    <span className="text-xs font-bold text-slate-400 group-hover:text-indigo-600 transition-colors uppercase tracking-widest">
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
        </DashboardLayout>
    );
};

export default StudentDashboard;
