import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { attendanceAPI, studentAPI, dashboardAPI, studentRequestAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
    getPendingAttendance,
    syncPendingAttendance,
    saveOfflineStudents,
    getOfflineStudents,
    saveOfflineClasses,
    getOfflineClasses,
    savePendingAttendance
} from '../../utils/offlineSync';
import DashboardLayout from '../../components/layout/DashboardLayout';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import OfflineSyncStatus from '../../components/common/OfflineSyncStatus';
import QRScanner from '../../components/Attendance/QRScanner';
import { Search, CheckCircle, XCircle, UserPlus, Clock, Save, Hash, Phone } from 'lucide-react';

const TeacherDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();
    const [activeTab, setActiveTab] = useState('ATTENDANCE'); // 'ATTENDANCE' or 'REQUESTS'
    const [students, setStudents] = useState([]);
    const [attendanceData, setAttendanceData] = useState({});
    const [selectedClass, setSelectedClass] = useState('');
    const [classes, setClasses] = useState([]);
    const [requests, setRequests] = useState([]);
    const [pendingSync, setPendingSync] = useState([]);
    const [markingMethod, setMarkingMethod] = useState('MANUAL');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [isSyncingOffline, setIsSyncingOffline] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const loadPendingSync = async () => {
        const pending = await getPendingAttendance();
        setPendingSync(pending || []);
    };

    useEffect(() => {
        // Load initially for the badge, and refresh when tab is focused
        loadPendingSync();
    }, [activeTab]);

    useEffect(() => {
        loadClasses();
        loadRequests();
    }, []);

    useEffect(() => {
        if (selectedClass && activeTab === 'ATTENDANCE') {
            loadStudents();
        }
    }, [selectedClass, activeTab]);

    const loadClasses = async () => {
        const schoolId = user?.school?.id;
        if (!schoolId) return;

        if (!navigator.onLine) {
            // Load from cache if offline
            const cached = getOfflineClasses(schoolId);
            if (cached) {
                setClasses(cached);
                toast.warning('Offline – loaded class list from local cache.');
            }
            return;
        }

        try {
            const response = await dashboardAPI.getClasses(schoolId);
            setClasses(response.data);
            // Cache the result for offline use
            saveOfflineClasses(schoolId, response.data);
        } catch (error) {
            console.error('Error loading classes:', error);
            // Fall back to cache on failure
            const cached = getOfflineClasses(schoolId);
            if (cached) {
                setClasses(cached);
                toast.warning('Could not reach server – using cached class list.');
            }
        }
    };

    const loadRequests = async () => {
        try {
            const schoolId = user?.school?.id;
            if (schoolId) {
                const response = await studentRequestAPI.getPending(schoolId);
                setRequests(response.data);
            }
        } catch (error) {
            console.error('Error loading requests:', error);
        }
    };

    const loadStudents = async () => {
        setLoading(true);
        const schoolId = user?.school?.id;

        const applyStudents = (allStudents) => {
            const filtered = allStudents.filter(s => `${s.className}-${s.section}` === selectedClass);
            setStudents(filtered);
            const initialData = {};
            filtered.forEach(s => { initialData[s.id] = 'PRESENT'; });
            setAttendanceData(initialData);
        };

        if (!navigator.onLine) {
            // Load roster from offline cache
            const cached = getOfflineStudents(schoolId);
            if (cached) {
                applyStudents(cached);
                toast.warning('Offline – loaded student roster from local cache.');
            } else {
                toast.error('No cached student data available. Connect to internet first.');
            }
            setLoading(false);
            return;
        }

        try {
            const response = await studentAPI.getBySchool(schoolId);
            // Cache roster for offline access
            saveOfflineStudents(schoolId, response.data);
            applyStudents(response.data);
        } catch (error) {
            console.error('Error loading students:', error);
            // Try offline cache as fallback
            const cached = getOfflineStudents(schoolId);
            if (cached) {
                applyStudents(cached);
                toast.warning('Server unreachable – using cached student roster.');
            } else {
                toast.error('Could not load student list. No offline data available.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (requestId) => {
        try {
            await studentRequestAPI.approve(requestId, user.id);
            toast.success('Student approved and enrolled!');
            loadRequests();
            if (selectedClass) loadStudents();
        } catch (error) {
            const msg = error.response?.data || error.message || 'Approval failed';
            toast.error(msg);
        }
    };

    const handleReject = async (requestId) => {
        try {
            await studentRequestAPI.reject(requestId, user.id);
            toast.warning('Registration request rejected');
            loadRequests();
        } catch (error) {
            const msg = error.response?.data || error.message || 'Rejection failed';
            toast.error(msg);
        }
    };

    const handleApproveAll = async () => {
        try {
            await studentRequestAPI.approveAll(user.school.id, user.id);
            toast.success('All pending requests processed');
            loadRequests();
            if (selectedClass) loadStudents();
        } catch (error) {
            toast.error('Bulk approval failed');
        }
    };

    const handleRejectAll = async () => {
        try {
            await studentRequestAPI.rejectAll(user.school.id, user.id);
            toast.warning('All pending requests rejected');
            loadRequests();
        } catch (error) {
            toast.error('Bulk rejection failed');
        }
    };

    const handleAttendanceChange = (studentId, status) => {
        setAttendanceData(prev => ({
            ...prev,
            [studentId]: status
        }));
    };

    const handleQRScanSuccess = (decodedText) => {
        try {
            let scannedId = null;
            try {
                const parsed = JSON.parse(decodedText);
                scannedId = parsed.studentId || parsed.id;
            } catch (e) {
                scannedId = decodedText;
            }

            if (!scannedId) {
                toast.error("Invalid QR Code content.");
                return;
            }

            const studentIdNum = parseInt(scannedId);
            const foundStudent = students.find(s => s.id === studentIdNum);

            if (foundStudent) {
                handleAttendanceChange(foundStudent.id, 'PRESENT');
                toast.success(`Scanned: ${foundStudent.name} is present!`, { icon: '✅' });
                
                // Log notification
                const storageKey = `notifications_${user.id}`;
                const cachedNotifs = JSON.parse(localStorage.getItem(storageKey)) || [];
                const newAlert = {
                    id: `qr_${Date.now()}`,
                    title: 'QR Attendance Scan',
                    message: `${foundStudent.name} verified present via camera scan.`,
                    type: 'SUCCESS',
                    time: new Date().toISOString(),
                    read: false
                };
                localStorage.setItem(storageKey, JSON.stringify([newAlert, ...cachedNotifs].slice(0, 15)));
            } else {
                toast.error(`Student #${scannedId} not found in this class!`);
            }
        } catch (err) {
            console.error("QR processing error:", err);
            toast.error("Error decoding QR pass.");
        }
    };

    const handleMarkAll = (status) => {
        const newData = { ...attendanceData };
        students.forEach(s => {
            newData[s.id] = status;
        });
        setAttendanceData(newData);
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const attendanceList = Object.entries(attendanceData).map(([studentId, status]) => ({
                studentId: parseInt(studentId),
                status,
                schoolId: user.school.id,
                teacherId: user.teacherId || user.id,
                markingMethod: markingMethod,
                date: new Date().toISOString().split('T')[0],
                timestamp: new Date().toISOString()
            }));

            if (!navigator.onLine) {
                // Save locally when offline
                await savePendingAttendance(attendanceList);
                toast.success('Attendance Recorded Successfully');
                setTimeout(() => {
                    toast.warning('No Internet Connection – Attendance Data Stored Locally');
                }, 600);
                await loadPendingSync(); // Refresh the Pending Sync tab badge
                return;
            }

            try {
                await attendanceAPI.markBulk(attendanceList);
                toast.success('Attendance Recorded Successfully');
                loadStudents();
            } catch (error) {
                console.error('Error submitting attendance:', error);
                // Network error despite navigator.onLine being true – save locally as fallback
                await savePendingAttendance(attendanceList);
                toast.success('Attendance Recorded Successfully');
                setTimeout(() => {
                    toast.warning('Server unreachable – Attendance Data Stored Locally for sync.');
                }, 600);
                await loadPendingSync();
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleManualSync = async () => {
        setIsSyncingOffline(true);
        toast.loading('Pushing offline records to cloud...', { duration: 0 });
        try {
            await syncPendingAttendance();
            const remaining = await getPendingAttendance();
            if (remaining.length === 0) {
                toast.dismiss();
                toast.success('All offline records successfully uploaded!');
            } else {
                toast.dismiss();
                toast.error(`Sync partially complete. ${remaining.length} records remain.`);
            }
            loadPendingSync(); // Refresh the view
        } catch (error) {
            toast.dismiss();
            toast.error('Failed to sync offline records. Try again later.');
        } finally {
            setIsSyncingOffline(false);
        }
    };

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!user) return <SkeletonLoader type="dashboard" />;

    return (
        <DashboardLayout>
            <div className="mb-8">
                <OfflineSyncStatus />

                <div className="flex justify-between items-end mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Teacher Dashboard</h1>
                        <p className="text-gray-600 mt-1">School: {user?.school?.name || 'N/A'}</p>
                    </div>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-2xl w-fit mb-8">
                    <button
                        onClick={() => setActiveTab('ATTENDANCE')}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'ATTENDANCE' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <CheckCircle className="w-4 h-4" />
                        Mark Attendance
                    </button>
                    <button
                        onClick={() => setActiveTab('REQUESTS')}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'REQUESTS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <UserPlus className="w-4 h-4" />
                        Registration Requests
                        {requests.length > 0 && (
                            <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1 animate-pulse">
                                {requests.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('PENDING_SYNC')}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'PENDING_SYNC' ? 'bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200' : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <Save className="w-4 h-4" />
                        Pending Sync
                        <span className={`text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1 ${pendingSync.length > 0 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}>
                            {pendingSync.length}
                        </span>
                    </button>

                </div>

                <AnimatePresence mode="wait">
                    {activeTab === 'ATTENDANCE' ? (
                        <motion.div
                            key="attendance"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-8">
                                <div className="flex flex-wrap items-center gap-6">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Class Group</label>
                                        <select
                                            value={selectedClass}
                                            onChange={(e) => setSelectedClass(e.target.value)}
                                            className="px-6 py-2.5 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-semibold text-slate-700 transition-all appearance-none cursor-pointer min-w-[200px]"
                                        >
                                            <option value="">Select Class Group</option>
                                            {classes.map(c => <option key={c} value={c}>Class {c}</option>)}
                                        </select>
                                    </div>

                                    <div className="flex flex-col gap-1.5 flex-1 max-w-sm">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Quick Search</label>
                                        <div className="relative">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                            <input
                                                type="text"
                                                placeholder="Search student name or roll..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100 mt-auto mb-1">
                                        {['MANUAL', 'QR_CODE'].map(m => (
                                            <button
                                                key={m}
                                                onClick={() => setMarkingMethod(m)}
                                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${markingMethod === m ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                                                    }`}
                                            >
                                                {m.replace('_', ' ')}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="flex gap-2 mt-auto mb-1">
                                        <button onClick={() => handleMarkAll('PRESENT')} className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors">Mark All Present</button>
                                        <button onClick={() => handleMarkAll('ABSENT')} className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-xs font-bold hover:bg-rose-100 transition-colors">Mark All Absent</button>
                                    </div>
                                </div>
                            </div>

                            {loading ? (
                                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
                                    <SkeletonLoader type="table" count={5} />
                                </div>
                            ) : filteredStudents.length > 0 ? (
                                <div className={markingMethod === 'QR_CODE' ? "grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in" : "w-full"}>
                                    
                                    {/* Left side: QR Scanner Panel */}
                                    {markingMethod === 'QR_CODE' && (
                                        <div className="lg:col-span-5">
                                            <QRScanner 
                                                onScanSuccess={handleQRScanSuccess} 
                                                active={activeTab === 'ATTENDANCE' && selectedClass !== ''} 
                                            />
                                        </div>
                                    )}

                                    {/* Right side / Main: Roster Table */}
                                    <div className={markingMethod === 'QR_CODE' ? "lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800/80 overflow-hidden" : "bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800/80 overflow-hidden"}>
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-left">
                                                        <th className="px-8 py-5 text-xs font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest">Student</th>
                                                        <th className="px-8 py-5 text-xs font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest">Roll Number</th>
                                                        <th className="px-8 py-5 text-xs font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest text-center">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                                                    {filteredStudents.map((student) => (
                                                        <tr key={student.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/20 transition-all group">
                                                            <td className="px-8 py-6">
                                                                <div
                                                                    onClick={() => navigate(`/profile/student/${student.id}`)}
                                                                    className="flex items-center gap-3 cursor-pointer group/name"
                                                                >
                                                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold group-hover/name:bg-indigo-600 group-hover/name:text-white transition-all">
                                                                        {student.name.charAt(0)}
                                                                    </div>
                                                                    <span className="font-bold text-slate-700 dark:text-slate-200 group-hover/name:text-indigo-600 transition-colors uppercase">{student.name}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-6 text-sm font-semibold text-slate-500 dark:text-slate-400">
                                                                {student.rollNumber}
                                                            </td>
                                                            <td className="px-8 py-6">
                                                                <div className="flex justify-center gap-3">
                                                                    {['PRESENT', 'ABSENT', 'LATE'].map((status) => (
                                                                        <button
                                                                            key={status}
                                                                            onClick={() => handleAttendanceChange(student.id, status)}
                                                                            className={`p-2.5 rounded-xl transition-all shadow-sm ${attendanceData[student.id] === status
                                                                                ? (status === 'PRESENT' ? 'bg-emerald-500 text-white' : status === 'ABSENT' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white')
                                                                                : 'bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                                                                                }`}
                                                                        >
                                                                            {status === 'PRESENT' ? <CheckCircle className="w-5 h-5" /> : status === 'ABSENT' ? <XCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {filteredStudents.length > 0 && (
                                            <div className="p-8 bg-slate-50/50 dark:bg-slate-800/10 border-t border-slate-50 dark:border-slate-800/60 flex justify-end">
                                                <button
                                                    onClick={handleSubmit}
                                                    disabled={submitting}
                                                    className="px-12 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-70"
                                                >
                                                    {submitting ? 'Syncing...' : 'Submit Attendance Batch'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 p-20 text-center">
                                    <p className="text-slate-400 font-medium">Please select a class to load roll call</p>
                                </div>
                            )}
                        </motion.div>
                    ) : activeTab === 'REQUESTS' ? (
                        <motion.div
                            key="requests"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                                <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-100 rounded-xl">
                                            <Clock className="w-5 h-5 text-indigo-600" />
                                        </div>
                                        <h2 className="text-xl font-bold text-slate-800">Pending Student Registrations</h2>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {requests.length > 0 && (
                                            <div className="flex gap-2 mr-4">
                                                <button
                                                    onClick={handleRejectAll}
                                                    className="px-4 py-1.5 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-100 transition-all border border-rose-100"
                                                >
                                                    Reject All
                                                </button>
                                                <button
                                                    onClick={handleApproveAll}
                                                    className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-all border border-emerald-100"
                                                >
                                                    Approve All
                                                </button>
                                            </div>
                                        )}
                                        <span className="px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold ring-1 ring-indigo-100">
                                            {requests.length} Requests Found
                                        </span>
                                    </div>
                                </div>

                                {requests.length === 0 ? (
                                    <div className="p-20 text-center">
                                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <CheckCircle className="w-10 h-10 text-slate-200" />
                                        </div>
                                        <p className="text-slate-400 font-medium text-lg">Hooray! No pending requests.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="bg-slate-50/50">
                                                    <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Student Info</th>
                                                    <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Academic Details</th>
                                                    <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Contact</th>
                                                    <th className="px-8 py-5 text-right text-xs font-bold text-slate-400 uppercase tracking-widest px-12">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {requests.map((req) => (
                                                    <tr key={req.id} className="hover:bg-slate-50/80 transition-all group">
                                                        <td className="px-8 py-6">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold group-hover:bg-white transition-all">
                                                                    {req.name.charAt(0)}
                                                                </div>
                                                                <div>
                                                                    <div className="font-bold text-slate-700">{req.name}</div>
                                                                    <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                                                        <Hash className="w-3 h-3" />
                                                                        ID: {req.rollNumber}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <div className="flex items-center gap-2">
                                                                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold border border-blue-100">
                                                                    Class {req.className}
                                                                </span>
                                                                <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-lg text-xs font-bold border border-purple-100">
                                                                    Section {req.section}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6 text-sm text-slate-500 font-medium">
                                                            <div className="flex items-center gap-2">
                                                                <Phone className="w-4 h-4 text-slate-400" />
                                                                {req.parentPhone}
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6 text-right px-12">
                                                            <div className="flex justify-end gap-3">
                                                                <button
                                                                    onClick={() => handleReject(req.id)}
                                                                    className="p-2.5 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                                                    title="Reject Registration"
                                                                >
                                                                    <XCircle className="w-5 h-5" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleApprove(req.id)}
                                                                    className="p-2.5 rounded-xl bg-emerald-50 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all shadow-lg shadow-emerald-500/10"
                                                                    title="Approve & Enroll"
                                                                >
                                                                    <CheckCircle className="w-5 h-5" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ) : activeTab === 'PENDING_SYNC' ? (
                        <motion.div
                            key="pending"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                                <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-amber-100 rounded-xl">
                                            <Save className="w-5 h-5 text-amber-600" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-800">Locally Stored Records</h2>
                                            <p className="text-xs text-slate-500 mt-1">These records were marked offline and are waiting to be uploaded.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={handleManualSync}
                                            disabled={isSyncingOffline || pendingSync.length === 0}
                                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-500/20 transition-all active:scale-95 flex items-center gap-2"
                                        >
                                            {isSyncingOffline ? (
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <Save className="w-4 h-4" />
                                            )}
                                            {isSyncingOffline ? 'Syncing...' : 'Upload Now'}
                                        </button>
                                    </div>
                                </div>

                                {pendingSync.length === 0 ? (
                                    <div className="p-20 text-center">
                                        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <CheckCircle className="w-10 h-10 text-emerald-500" />
                                        </div>
                                        <p className="text-slate-600 font-bold text-lg">All caught up!</p>
                                        <p className="text-slate-400 text-sm mt-1">There are no offline records waiting to be paired.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="bg-slate-50/50 text-left">
                                                    <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Student ID</th>
                                                    <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Date Marked</th>
                                                    <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {pendingSync.map((record) => (
                                                    <tr key={record._localId} className="hover:bg-slate-50/80 transition-all">
                                                        <td className="px-8 py-6 font-bold text-slate-700">#{record.studentId}</td>
                                                        <td className="px-8 py-6 text-sm text-slate-500 font-medium">{record.date} (Created at {new Date(record.timestamp).toLocaleTimeString()})</td>
                                                        <td className="px-8 py-6">
                                                            <div className="flex flex-col gap-1 items-start">
                                                                <span className={`px-3 py-1 text-xs font-bold rounded-lg border inline-block ${record.status === 'PRESENT' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : record.status === 'ABSENT' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                                                    {record.status}
                                                                </span>
                                                                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-100 text-amber-700 uppercase tracking-widest border border-amber-200">
                                                                    {record.syncStatus || 'PENDING'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ) : null}
                </AnimatePresence>
            </div>
        </DashboardLayout >
    );
};

export default TeacherDashboard;
