import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import AttendanceTrendChart from '../../components/charts/AttendanceTrendChart';
import ClassComparisonChart from '../../components/charts/ClassComparisonChart';
import DropoutRiskChart from '../../components/charts/DropoutRiskChart';
import { Users, UserCheck, UserMinus, Clock, TrendingUp, AlertCircle, Phone } from 'lucide-react';

const SchoolAdminDashboard = () => {
    const { user, isAdmin } = useAuth();
    const toast = useToast();
    const [summary, setSummary] = useState(null);
    const [absentees, setAbsentees] = useState([]);
    const [riskData, setRiskData] = useState([]);
    const [trendData, setTrendData] = useState([]);
    const [classData, setClassData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        loadDashboardData();
    }, [user]);

    const loadDashboardData = async () => {
        try {
            if (!user?.school?.id) {
                toast.error('School not assigned to user');
                return;
            }
            const schoolId = user.school.id;

            const [summaryRes, absenteesRes, dropoutRes, trendsRes, classRes] = await Promise.all([
                dashboardAPI.getTodaySummary(schoolId),
                dashboardAPI.getAbsentees(schoolId),
                dashboardAPI.getDropoutRisk(schoolId),
                dashboardAPI.getTrends(schoolId),
                dashboardAPI.getClassComparison(schoolId),
            ]);

            const highRisk = dropoutRes.data.filter(s => s.riskLevel === 'HIGH').length;
            const mediumRisk = dropoutRes.data.filter(s => s.riskLevel === 'MEDIUM').length;
            const totalStudents = summaryRes.data.totalStudents || 0;
            const lowRisk = Math.max(0, totalStudents - (highRisk + mediumRisk));

            const aggregatedRiskData = [
                { name: 'High Risk', value: highRisk },
                { name: 'Medium Risk', value: mediumRisk },
                { name: 'Low Risk', value: lowRisk },
            ];

            setSummary(summaryRes.data);
            setAbsentees(absenteesRes.data);
            setRiskData(aggregatedRiskData); // Changed to setRiskData
            setTrendData(trendsRes.data);
            setClassData(classRes.data);

            toast.success('Administrator insights synchronized');
        } catch (error) {
            console.error('Error loading dashboard:', error);
            toast.error('Data synchronization failed');
        } finally {
            setLoading(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <SkeletonLoader type="card" count={4} />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <SkeletonLoader type="chart" count={2} />
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    const cards = [
        { label: 'Total Students', value: summary?.totalStudents, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
        { label: 'Present Today', value: summary?.present, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
        { label: 'Absent Today', value: summary?.absent, icon: UserMinus, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
        { label: 'Late Arrival', value: summary?.late, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
    ];

    return (
        <DashboardLayout>
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-8"
            >
                {/* Header */}
                <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">School Insights</h1>
                        <p className="text-slate-500 font-medium mt-2 flex items-center gap-2">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            Live monitoring for {user?.school?.name || 'Demo School'}
                        </p>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={loadDashboardData}
                        className="premium-button bg-indigo-600 text-white flex items-center gap-2"
                    >
                        <TrendingUp className="w-4 h-4" />
                        Refresh Analytics
                    </motion.button>
                </motion.div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {cards.map((card, i) => (
                        <motion.div
                            key={i}
                            variants={itemVariants}
                            whileHover={{ y: -5 }}
                            className={`dashboard-widget border ${card.border} group`}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 rounded-2xl ${card.bg} ${card.color} group-hover:scale-110 transition-transform`}>
                                    <card.icon className="w-6 h-6" />
                                </div>
                                <div className="h-1 w-12 bg-slate-100 rounded-full" />
                            </div>
                            <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">{card.label}</div>
                            <div className="text-4xl font-extrabold text-slate-800 mt-2 tracking-tight">
                                {card.value || 0}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Attendance Analysis Column */}
                    <motion.div variants={itemVariants} className="lg:col-span-2 space-y-8">
                        <div className="dashboard-widget">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-indigo-600" />
                                    Daily Performance
                                </h2>
                                <span className={`px-4 py-1 rounded-full text-xs font-bold ${summary?.percentage >= 90 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                    {summary?.percentage?.toFixed(1)}% Aggregated
                                </span>
                            </div>
                            <div className="space-y-6">
                                <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden p-1">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${summary?.percentage || 0}%` }}
                                        transition={{ duration: 1, ease: "easeOut" }}
                                        className={`h-full rounded-full ${summary?.percentage >= 90 ? 'bg-emerald-500' : 'bg-rose-500 shadow-[0_0_12px_rgba(239,68,68,0.3)]'}`}
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <AttendanceTrendChart data={trendData} />
                                    <ClassComparisonChart data={classData} />
                                </div>
                            </div>
                        </div>

                        {/* Absentees Table */}
                        <div className="dashboard-widget overflow-hidden h-fit">
                            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-rose-500" />
                                Today's Absentee Log
                            </h2>
                            <div className="overflow-x-auto">
                                {absentees.length === 0 ? (
                                    <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                        <p className="text-slate-400 font-medium">Clear record! No absentees registered today.</p>
                                    </div>
                                ) : (
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="text-slate-400 text-xs font-bold uppercase tracking-widest border-b border-slate-100">
                                                <th className="pb-4 pl-2">Student Identity</th>
                                                <th className="pb-4">Class/Sec</th>
                                                <th className="pb-4 pr-2">Guardian Contact</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {absentees.map((student, index) => (
                                                <tr key={index} className="group hover:bg-slate-50 transition-colors">
                                                    <td className="py-4 pl-2 font-bold text-slate-700">{student.studentName}</td>
                                                    <td className="py-4">
                                                        <span className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-600">
                                                            {student.className}-{student.section}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 pr-2">
                                                        <div className="flex items-center gap-2 text-indigo-600 font-medium text-sm">
                                                            <Phone className="w-3.5 h-3.5" />
                                                            {student.parentPhone}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </motion.div>

                    {/* Sidebar Column */}
                    <motion.div variants={itemVariants} className="space-y-8">
                        <DropoutRiskChart data={riskData} />

                        <div className="dashboard-widget bg-indigo-900 text-white border-none relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-150 transition-transform duration-700">
                                <Users className="w-32 h-32" />
                            </div>
                            <h3 className="text-lg font-bold mb-2">School Admin Tool</h3>
                            <p className="text-indigo-200 text-sm leading-relaxed mb-6">
                                Need to generate monthly reports or adjust academic settings? Access the enterprise toolkit.
                            </p>
                            {isAdmin() && (
                                <Link
                                    to="/admin/reports"
                                    className="block w-full py-3 bg-white text-indigo-900 rounded-2xl font-bold text-sm text-center hover:bg-indigo-50 transition-colors"
                                >
                                    Open Resource Center
                                </Link>
                            )}

                            <Link
                                to="/school/management"
                                className="block w-full py-3 mt-3 bg-indigo-800 text-white rounded-2xl font-bold text-sm text-center hover:bg-indigo-700 transition-colors border border-indigo-700"
                            >
                                Manage Users & Staff
                            </Link>

                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </DashboardLayout>
    );
};

export default SchoolAdminDashboard;
