import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { reportAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Download, ArrowLeft, FileText, Calendar, Table, CheckCircle2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminReports = () => {
    const { user } = useAuth();
    const toast = useToast();

    // Mode: 'monthly' or 'range'
    const [mode, setMode] = useState('monthly');
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState(false);

    const schoolId = user?.school?.id || 1;

    const getParams = () => {
        if (mode === 'range' && startDate && endDate) {
            return { startDate, endDate };
        }
        return { month, year };
    };

    const getPeriodLabel = () => {
        if (mode === 'range' && startDate && endDate) {
            return `${startDate} to ${endDate}`;
        }
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        return `${monthNames[month - 1]} ${year}`;
    };

    const downloadReport = async (type) => {
        // Validate date range
        if (mode === 'range') {
            if (!startDate || !endDate) {
                toast.error('Please select both start and end dates');
                return;
            }
            if (new Date(startDate) > new Date(endDate)) {
                toast.error('Start date cannot be after end date');
                return;
            }
        }

        setLoading(true);
        const reportType = type === 'pdf' ? 'PDF' : 'Excel';
        toast.loading(`Generating ${reportType} Report for ${getPeriodLabel()}...`);

        try {
            const params = getParams();
            const response = type === 'pdf'
                ? await reportAPI.downloadPdf(schoolId, params)
                : await reportAPI.downloadExcel(schoolId, params);

            // Check if response is actually an error (JSON instead of blob)
            if (response.data.type === 'application/json') {
                const text = await response.data.text();
                const error = JSON.parse(text);
                toast.dismiss();
                toast.error(error.message || 'Report generation failed');
                return;
            }

            // Create download link
            const blob = new Blob([response.data]);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;

            // Extract filename from Content-Disposition header or build one
            const contentDisposition = response.headers['content-disposition'];
            let filename = `Attendance_Report_${getPeriodLabel().replace(/ /g, '_')}.${type === 'pdf' ? 'pdf' : 'xlsx'}`;
            if (contentDisposition) {
                const match = contentDisposition.match(/filename=(.+)/);
                if (match && match[1]) {
                    filename = match[1].replace(/"/g, '');
                }
            }

            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast.dismiss();
            toast.success(`${reportType} Report downloaded successfully`);
        } catch (error) {
            console.error('Download failed', error);
            toast.dismiss();
            if (error.response?.status === 500) {
                toast.error('Server error generating report. Check if attendance data exists for this period.');
            } else {
                toast.error(`Failed to generate ${reportType} report`);
            }
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
                        <p className="text-slate-500 font-medium mt-2">Generate and download official attendance reports</p>
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
                    {/* Mode Selector */}
                    <div className="mb-8">
                        <label className="text-sm font-extrabold text-slate-700 uppercase tracking-widest mb-3 block">
                            Report Period Type
                        </label>
                        <div className="flex bg-slate-100 p-1 rounded-2xl w-fit">
                            <button
                                onClick={() => setMode('monthly')}
                                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${mode === 'monthly'
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                <Calendar className="w-4 h-4" />
                                Monthly
                            </button>
                            <button
                                onClick={() => setMode('range')}
                                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${mode === 'range'
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                <Calendar className="w-4 h-4" />
                                Custom Date Range
                            </button>
                        </div>
                    </div>

                    {mode === 'monthly' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Month Selection */}
                            <div className="space-y-3">
                                <label className="text-sm font-extrabold text-slate-700 uppercase tracking-widest flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-indigo-500" />
                                    Reporting Month
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
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Start Date */}
                            <div className="space-y-3">
                                <label className="text-sm font-extrabold text-slate-700 uppercase tracking-widest flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-emerald-500" />
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-bold text-slate-700 transition-all cursor-pointer"
                                    value={startDate}
                                    onChange={e => setStartDate(e.target.value)}
                                />
                            </div>

                            {/* End Date */}
                            <div className="space-y-3">
                                <label className="text-sm font-extrabold text-slate-700 uppercase tracking-widest flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-rose-500" />
                                    End Date
                                </label>
                                <input
                                    type="date"
                                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-bold text-slate-700 transition-all cursor-pointer"
                                    value={endDate}
                                    onChange={e => setEndDate(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {/* Period Preview */}
                    <div className="mt-6 px-5 py-3 bg-indigo-50/50 rounded-xl border border-indigo-100 inline-flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-indigo-500" />
                        <span className="text-sm font-bold text-indigo-700">Selected Period: {getPeriodLabel()}</span>
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
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Download className="w-5 h-5" />
                            )}
                            Secure PDF Report
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="premium-button bg-emerald-600 text-white flex items-center justify-center gap-3 py-5 text-lg shadow-xl shadow-emerald-600/20 disabled:opacity-50"
                            onClick={() => downloadReport('excel')}
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Table className="w-5 h-5" />
                            )}
                            Export Data to Excel
                        </motion.button>
                    </div>

                    <div className="mt-8 flex items-center justify-center gap-6 text-slate-400">
                        <div className="flex items-center gap-1 text-xs font-bold uppercase tracking-tighter">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            JWT Authenticated
                        </div>
                        <div className="flex items-center gap-1 text-xs font-bold uppercase tracking-tighter">
                            <AlertCircle className="w-3 h-3 text-indigo-500" />
                            Server-Side Generated
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
                        <h4 className="text-sm font-extrabold text-slate-900 mb-2">Custom Date Ranges</h4>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">Generate reports for any date range — monthly summaries or custom periods for audits.</p>
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
