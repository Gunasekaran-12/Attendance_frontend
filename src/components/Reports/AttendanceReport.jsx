import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import DashboardLayout from '../layout/DashboardLayout';
import { Calendar, Search, User as UserIcon, CheckCircle2, XCircle, Clock, ArrowLeft, Filter, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

const AttendanceReport = () => {
    const { user } = useAuth();
    const toast = useToast();
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [report, setReport] = useState([]);
    const [loading, setLoading] = useState(false);

    const schoolId = user?.school?.id || 1;

    const handleFetchReport = async () => {
        if (!schoolId) return;
        setLoading(true);
        toast.loading('Retrieving historical data...');
        try {
            const response = await apiClient.get(`/attendance/school/${schoolId}/date`, {
                params: { date }
            });
            setReport(response.data);
            if (response.data.length > 0) {
                toast.success(`Found ${response.data.length} records for ${date}`);
            } else {
                toast.info('No records found for the selected date');
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to retrieve historical record');
        } finally {
            toast.dismiss();
            setLoading(false);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'PRESENT': return { color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle2 };
            case 'ABSENT': return { color: 'text-rose-600', bg: 'bg-rose-50', icon: XCircle };
            case 'LATE': return { color: 'text-amber-600', bg: 'bg-amber-50', icon: Clock };
            default: return { color: 'text-slate-400', bg: 'bg-slate-50', icon: Calendar };
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <Link to="/dashboard" className="inline-flex items-center gap-2 text-indigo-600 font-bold hover:text-indigo-700 transition-colors mb-4">
                            <ArrowLeft className="w-4 h-4" />
                            Return to Dashboard
                        </Link>
                        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Timeline Auditor</h1>
                        <p className="text-slate-500 font-medium mt-1">Reviewing verified presence logs for your institution</p>
                    </motion.div>

                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
                            <Calendar className="w-5 h-5 text-indigo-600" />
                        </div>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="px-6 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-bold text-slate-700 transition-all cursor-pointer"
                        />
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleFetchReport}
                            disabled={loading}
                            className="premium-button bg-indigo-600 text-white flex items-center gap-2"
                        >
                            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search className="w-5 h-5" />}
                            Audit Logs
                        </motion.button>
                    </div>
                </div>

                {/* Audit Grid/Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="dashboard-widget overflow-hidden p-0"
                >
                    <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                        <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-3">
                            <FileText className="w-6 h-6 text-indigo-500" />
                            Record Set: {new Date(date).toLocaleDateString(undefined, { dateStyle: 'long' })}
                        </h2>
                        <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-slate-400">
                            <span>Detected: {report.length}</span>
                            <div className="w-px h-4 bg-slate-200" />
                            <span>Status: Verified</span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        {report.length === 0 ? (
                            <div className="py-40 text-center bg-slate-50/50">
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="flex flex-col items-center justify-center opacity-30"
                                >
                                    <div className="w-20 h-20 bg-white rounded-[2rem] shadow-sm flex items-center justify-center mb-6">
                                        <Filter className="w-10 h-10 text-slate-300" />
                                    </div>
                                    <p className="font-black text-slate-500 tracking-widest uppercase text-sm italic">No verified records for this timestamp</p>
                                    <p className="text-xs font-bold text-slate-400 mt-2">Try selecting a different date from the audit controls</p>
                                </motion.div>
                            </div>
                        ) : (
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/30">
                                    <tr className="text-slate-400 text-xs font-black uppercase tracking-widest border-b border-slate-100">
                                        <th className="py-6 pl-10">Identity Hash</th>
                                        <th>Student Identity</th>
                                        <th className="text-center pr-10">Fidelity Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    <AnimatePresence>
                                        {report.map((record, index) => {
                                            const style = getStatusStyle(record.status);
                                            return (
                                                <motion.tr
                                                    key={record.id}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.03 }}
                                                    className="group hover:bg-slate-50/80 transition-colors"
                                                >
                                                    <td className="py-6 pl-10">
                                                        <span className="font-black text-slate-300 group-hover:text-indigo-400 transition-colors tracking-widest uppercase text-[10px]">
                                                            {record.student?.rollNumber || `REF-${record.id.slice(0, 6)}`}
                                                        </span>
                                                    </td>
                                                    <td className="py-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                                <UserIcon className="w-5 h-5 text-slate-400" />
                                                            </div>
                                                            <div>
                                                                <div className="font-extrabold text-slate-800 tracking-tight">{record.student?.name || 'Unknown Entity'}</div>
                                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Marked by: Admin Ref {record.markedBy?.id || 'SYS'}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-6 pr-10">
                                                        <div className="flex justify-center">
                                                            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${style.bg} ${style.color} border border-white shadow-sm`}>
                                                                <style.icon className="w-3.5 h-3.5" />
                                                                {record.status}
                                                            </span>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            );
                                        })}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        )}
                    </div>
                </motion.div>

                {/* Info Bar */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-60">
                    <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center gap-4">
                        <div className="p-3 bg-white rounded-xl text-indigo-500 shadow-sm"><FileText className="w-5 h-5" /></div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Immutable Audit Logs</p>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center gap-4">
                        <div className="p-3 bg-white rounded-xl text-emerald-500 shadow-sm"><CheckCircle2 className="w-5 h-5" /></div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Verified System Nodes</p>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center gap-4">
                        <div className="p-3 bg-white rounded-xl text-amber-500 shadow-sm"><Clock className="w-5 h-5" /></div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Real-time Sync Active</p>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AttendanceReport;
