import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { apiClient } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Download, ArrowLeft, FileText, Calendar, Table, CheckCircle2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminReports = () => {
    const { user } = useAuth();
    const toast = useToast();
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [loading, setLoading] = useState(false);

    const schoolId = user?.school?.id || 1;

    const downloadReport = async (type) => {
        setLoading(true);
        const reportType = type === 'pdf' ? 'PDF' : 'Excel';
        toast.loading(`Preparing ${reportType} Report...`);

        try {
            const response = await apiClient.get(`/reports/${type}/${schoolId}`, {
                params: { month, year },
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Attendance_Report_${month}_${year}.${type === 'pdf' ? 'pdf' : 'xlsx'}`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast.dismiss();
            toast.success(`${reportType} Report secured successfully`);
        } catch (error) {
            console.error("Download failed", error);
            toast.dismiss();
            toast.error(`System failed to generate ${reportType} report`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <Link
                            to="/dashboard"
                            className="inline-flex items-center gap-2 text-indigo-600 font-bold hover:text-indigo-700 transition-colors mb-4"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Return to Dashboard
                        </Link>
                        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Academic Reporting</h1>
                        <p className="text-slate-500 font-medium mt-2">Generate and download official attendance certificates</p>
                    </motion.div>

                    <div className="hidden md:block">
                        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
                            <FileText className="w-8 h-8" />
                        </div>
                    </div>
                </div>

                {/* Configuration Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="dashboard-widget p-8 md:p-10"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Month Selection */}
                        <div className="space-y-3">
                            <label className="text-sm font-extrabold text-slate-700 uppercase tracking-widest flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-indigo-500" />
                                Reporting Period
                            </label>
                            <select
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-bold text-slate-700 transition-all appearance-none cursor-pointer"
                                value={month}
                                onChange={e => setMonth(parseInt(e.target.value))}
                            >
                                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                    <option key={m} value={m}>
                                        {new Date(0, m - 1).toLocaleString('default', { month: 'long' })}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Year Selection */}
                        <div className="space-y-3">
                            <label className="text-sm font-extrabold text-slate-700 uppercase tracking-widest flex items-center gap-2">
                                <Table className="w-4 h-4 text-indigo-500" />
                                Academic Year
                            </label>
                            <input
                                type="number"
                                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-bold text-slate-700 transition-all"
                                value={year}
                                onChange={e => setYear(parseInt(e.target.value))}
                            />
                        </div>
                    </div>

                    <div className="h-px bg-slate-100 my-10" />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="premium-button bg-indigo-600 text-white flex items-center justify-center gap-3 py-5 text-lg shadow-xl shadow-indigo-600/20 disabled:opacity-50"
                            onClick={() => downloadReport('pdf')}
                            disabled={loading}
                        >
                            <Download className="w-5 h-5" />
                            Secure PDF Report
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="premium-button bg-emerald-600 text-white flex items-center justify-center gap-3 py-5 text-lg shadow-xl shadow-emerald-600/20 disabled:opacity-50"
                            onClick={() => downloadReport('excel')}
                            disabled={loading}
                        >
                            <Table className="w-5 h-5" />
                            Export Data to Excel
                        </motion.button>
                    </div>

                    <div className="mt-8 flex items-center justify-center gap-6 text-slate-400">
                        <div className="flex items-center gap-1 text-xs font-bold uppercase tracking-tighter">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            Digital Signature
                        </div>
                        <div className="flex items-center gap-1 text-xs font-bold uppercase tracking-tighter">
                            <AlertCircle className="w-3 h-3 text-indigo-500" />
                            Verify Offline
                        </div>
                    </div>
                </motion.div>

                {/* Info Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                        <h4 className="text-sm font-extrabold text-slate-900 mb-2">Automated Validation</h4>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">All generated reports are automatically validated against the central server records.</p>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                        <h4 className="text-sm font-extrabold text-slate-900 mb-2">Data Security</h4>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">Reports are generated over a secure tunnel and encrypted during transit.</p>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                        <h4 className="text-sm font-extrabold text-slate-900 mb-2">Multi-Format</h4>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">Choose between high-fidelity PDF for prints or raw Excel data for analysis.</p>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AdminReports;
