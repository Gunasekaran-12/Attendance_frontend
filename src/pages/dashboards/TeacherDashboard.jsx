import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { attendanceAPI, studentAPI, dashboardAPI, studentRequestAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import { Search, Filter, CheckCircle, XCircle, UserPlus, Clock, Save, Hash, User as UserIcon, Phone } from 'lucide-react';

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
    const [markingMethod, setMarkingMethod] = useState('MANUAL');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

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
        try {
            const schoolId = user?.school?.id;
            if (schoolId) {
                const response = await dashboardAPI.getClasses(schoolId);
                setClasses(response.data);
            }
        } catch (error) {
            console.error('Error loading classes:', error);
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
        try {
            const response = await studentAPI.getBySchool(user.school.id);
            const filtered = response.data.filter(s => `${s.className}-${s.section}` === selectedClass);
            setStudents(filtered);

            // Generate initial attendance state
            const initialData = {};
            filtered.forEach(s => {
                initialData[s.id] = 'PRESENT';
            });
            setAttendanceData(initialData);
        } catch (error) {
            console.error('Error loading students:', error);
            toast.error('Could not load student list');
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
                date: new Date().toISOString().split('T')[0]
            }));

            await attendanceAPI.markBulk(attendanceList);
            toast.success('Attendance records secured');
            loadStudents();
        } catch (error) {
            console.error('Error submitting attendance:', error);
            toast.error('Sync failed. Please retry.');
        } finally {
            setSubmitting(false);
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

                            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                                {loading ? (
                                    <div className="p-8"><SkeletonLoader type="table" count={5} /></div>
                                ) : filteredStudents.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="bg-slate-50/50 text-left">
                                                    <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Student</th>
                                                    <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Roll Number</th>
                                                    <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {filteredStudents.map((student) => (
                                                    <tr key={student.id} className="hover:bg-slate-50/80 transition-all group">
                                                        <td className="px-8 py-6">
                                                            <div
                                                                onClick={() => navigate(`/profile/student/${student.id}`)}
                                                                className="flex items-center gap-3 cursor-pointer group/name"
                                                            >
                                                                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold group-hover/name:bg-indigo-600 group-hover/name:text-white transition-all">
                                                                    {student.name.charAt(0)}
                                                                </div>
                                                                <span className="font-bold text-slate-700 group-hover/name:text-indigo-600 transition-colors uppercase">{student.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6 text-sm font-semibold text-slate-500">
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
                                                                            : 'bg-slate-50 text-slate-300 hover:bg-slate-100'
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
                                ) : (
                                    <div className="p-20 text-center">
                                        <p className="text-slate-400 font-medium">Please select a class to load roll call</p>
                                    </div>
                                )}

                                {filteredStudents.length > 0 && (
                                    <div className="p-8 bg-slate-50/50 border-t border-slate-50 flex justify-end">
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
                        </motion.div>
                    ) : (
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
                    )}
                </AnimatePresence>
            </div>
        </DashboardLayout>
    );
};

export default TeacherDashboard;
