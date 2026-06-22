import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import DashboardLayout from '../layout/DashboardLayout';
import {
    saveOfflineStudents,
    getOfflineStudents,
    savePendingAttendance,
    syncPendingAttendance,
    getPendingAttendance
} from '../../utils/offlineSync';
import { CheckCircle2, XCircle, Clock, User as UserIcon, Calendar, Search, Save, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const MarkAttendance = () => {
    const { user } = useAuth();
    const toast = useToast();
    const [students, setStudents] = useState([]);
    const [attendanceData, setAttendanceData] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const schoolId = user?.school?.id || 1;

    useEffect(() => {
        loadStudents();
    }, [schoolId]);

    const loadStudents = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get(`/students/school/${schoolId}`);
            setStudents(response.data);
            saveOfflineStudents(schoolId, response.data);

            // Initialize attendance state
            const initialData = {};
            response.data.forEach(s => initialData[s.id] = 'PRESENT');
            setAttendanceData(initialData);

            toast.success('Student roster synchronized');
        } catch (error) {
            console.error("Error fetching students from server", error);
            // Fallback to offline cache
            const offlineStudents = getOfflineStudents(schoolId);
            if (offlineStudents && offlineStudents.length > 0) {
                setStudents(offlineStudents);
                const initialData = {};
                offlineStudents.forEach(s => initialData[s.id] = 'PRESENT');
                setAttendanceData(initialData);
                toast.success('Loaded student roster from offline cache', { icon: '🔄' });
            } else {
                toast.error('Failed to load students and no offline data available');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = (studentId, status) => {
        setAttendanceData(prev => ({ ...prev, [studentId]: status }));
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        const toastId = toast.loading('Securing attendance records locally...');
        try {
            const date = new Date().toISOString().split('T')[0];
            const recordsToSave = Object.keys(attendanceData).map(studentId => {
                return {
                    studentId,
                    schoolId,
                    date,
                    status: attendanceData[studentId],
                    markedBy: user?.id,
                    timestamp: new Date().toISOString()
                };
            });

            // Save records locally as PENDING
            await savePendingAttendance(recordsToSave);

            toast.dismiss(toastId);
            toast.success('Attendance Recorded Successfully');

            // Re-sync background queue
            syncPendingAttendance().then(async () => {
                // Determine if there are still pending records 
                const stillPending = await getPendingAttendance();
                if (navigator.onLine && stillPending.length === 0) {
                    toast.success('Attendance Data Successfully Synced to Cloud');
                } else if (!navigator.onLine) {
                    toast.warning('No Internet Connection – Attendance Data Stored Locally', { duration: 5000 });
                }
            });

            // Reset UI slightly or keep it. For now, let's keep it on screen
        } catch (error) {
            console.error(error);
            toast.dismiss(toastId);
            toast.error('System failed to save records');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.rollNumber.toString().includes(searchTerm)
    );

    if (loading) {
        return (
            <DashboardLayout>
                <div className="py-32 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                    <p className="mt-6 font-black text-slate-400 uppercase tracking-widest text-xs">Accessing Student Vault...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto space-y-8">
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
                        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Active Check-in</h1>
                        <p className="text-slate-500 font-medium">Registering academic presence for {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                    </motion.div>

                    <div className="relative group min-w-[300px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Find student by identity..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-[1.5rem] shadow-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700"
                        />
                    </div>
                </div>

                {/* Table Registry */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="dashboard-widget overflow-hidden p-0"
                >
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50">
                                <tr className="text-slate-400 text-xs font-black uppercase tracking-widest border-b border-slate-100">
                                    <th className="py-6 pl-8">ID Ref</th>
                                    <th>Identity Profile</th>
                                    <th className="text-center">Verification State</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                <AnimatePresence mode="popLayout">
                                    {filteredStudents.map((student, idx) => (
                                        <motion.tr
                                            key={student.id}
                                            layout
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="group hover:bg-slate-50/50 transition-colors"
                                        >
                                            <td className="py-6 pl-8 font-black text-slate-400 group-hover:text-indigo-600 transition-colors">#{student.rollNumber}</td>
                                            <td className="py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center border border-slate-100 group-hover:border-indigo-100 group-hover:scale-110 transition-all">
                                                        <UserIcon className="w-5 h-5 text-slate-400 group-hover:text-indigo-600" />
                                                    </div>
                                                    <div>
                                                        <div className="font-extrabold text-slate-800 tracking-tight">{student.name}</div>
                                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Academic Group: {student.className}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-6 pr-8">
                                                <div className="flex justify-center gap-2">
                                                    {[
                                                        { id: 'PRESENT', label: 'Verified', icon: CheckCircle2, color: 'emerald' },
                                                        { id: 'ABSENT', label: 'Unverified', icon: XCircle, color: 'rose' },
                                                        { id: 'LATE', label: 'Deferred', icon: Clock, color: 'amber' }
                                                    ].map(status => (
                                                        <button
                                                            key={status.id}
                                                            onClick={() => handleStatusChange(student.id, status.id)}
                                                            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-tighter transition-all ${attendanceData[student.id] === status.id
                                                                ? `bg-${status.color}-600 text-white shadow-xl shadow-${status.color}-600/20 scale-105`
                                                                : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                                                        >
                                                            <status.icon className="w-4 h-4" />
                                                            {status.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                                {filteredStudents.length === 0 && (
                                    <tr>
                                        <td colSpan="3" className="py-32 text-center">
                                            <div className="flex flex-col items-center justify-center opacity-40">
                                                <Search className="w-12 h-12 text-slate-300 mb-4" />
                                                <p className="font-bold text-slate-400 tracking-widest uppercase text-sm">No identity matches found</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                {/* Footer Submit */}
                <div className="flex justify-end pt-4 pb-12">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSubmit}
                        disabled={submitting || students.length === 0}
                        className="premium-button bg-indigo-600 text-white flex items-center gap-3 px-12 py-5 text-xl font-black shadow-2xl shadow-indigo-600/30 disabled:opacity-50"
                    >
                        {submitting ? (
                            <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Save className="w-6 h-6" />
                                COMMIT SESSION RECORDS
                            </>
                        )}
                    </motion.button>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default MarkAttendance;
