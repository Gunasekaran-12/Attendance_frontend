import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { studentAPI, teacherAPI, dashboardAPI, geographyAPI, studentRequestAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import {
    Users, UserPlus, Search, Filter, Edit2, Trash2,
    CheckCircle, XCircle, ChevronRight, GraduationCap,
    Briefcase, Shield, Mail, Phone, Hash
} from 'lucide-react';

const Management = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();
    const [activeTab, setActiveTab] = useState('STUDENTS'); // 'STUDENTS', 'TEACHERS', or 'SCHOOLS'
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({});

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            const schoolId = user?.school?.id;
            // For SCHOOLS tab, we might not need a schoolId, or it might be for super admin
            // If schoolId is required for STUDENTS/TEACHERS and not present, return.
            // For SCHOOLS, we fetch all schools.
            if (activeTab !== 'SCHOOLS' && !schoolId) return;

            let response;
            if (activeTab === 'STUDENTS') {
                response = await studentAPI.getBySchool(schoolId);
            } else if (activeTab === 'TEACHERS') {
                response = await teacherAPI.getBySchool(schoolId);
            } else {
                response = await geographyAPI.getSchools();
            }
            setData(response.data);
        } catch (error) {
            console.error(`Error loading ${activeTab.toLowerCase()}:`, error);
            toast.error(`Could not synchronize ${activeTab.toLowerCase()} records`);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(`Are you sure you want to permanently delete this ${activeTab.slice(0, -1).toLowerCase()}?`)) return;

        try {
            if (activeTab === 'STUDENTS') await studentAPI.delete(id);
            else if (activeTab === 'TEACHERS') await teacherAPI.delete(id);
            else if (activeTab === 'SCHOOLS') await geographyAPI.deleteSchool(id);
            toast.success('Record purged successfully');
            loadData();
        } catch (error) {
            toast.error('Deletion failed. Record may have dependent data.');
        }
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setFormData(item);
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingItem) {
                if (activeTab === 'STUDENTS') await studentAPI.update(editingItem.id, formData);
                else if (activeTab === 'TEACHERS') await teacherAPI.update(editingItem.id, formData);
                else if (activeTab === 'SCHOOLS') await geographyAPI.updateSchool(editingItem.id, formData);
                toast.success('Identity record updated');
            } else {
                const payload = activeTab === 'SCHOOLS' ? formData : { ...formData, school: { id: user.school.id } };
                if (activeTab === 'STUDENTS') await studentAPI.create(payload);
                else if (activeTab === 'TEACHERS') await teacherAPI.create(payload);
                else if (activeTab === 'SCHOOLS') await geographyAPI.createSchool(payload);
                toast.success('New profile created');
            }
            setIsModalOpen(false);
            loadData();
        } catch (error) {
            toast.error('Operation failed. Please verify attributes.');
        }
    };

    const filteredData = data.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.rollNumber || item.employeeId || item.schoolCode || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const containerVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.05 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -10 },
        visible: { opacity: 1, x: 0 }
    };

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                    <div>
                        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                            <Shield className="w-10 h-10 text-indigo-600" />
                            Academic Directory
                        </h1>
                        <p className="text-slate-500 font-medium mt-2">Manage verified credentials for your institution's stakeholders.</p>
                    </div>
                    {activeTab !== 'SCHOOLS' && (
                        <button
                            onClick={() => { setEditingItem(null); setFormData({}); setIsModalOpen(true); }}
                            className="premium-button bg-indigo-600 text-white flex items-center gap-2 px-8 py-4 rounded-2xl shadow-lg shadow-indigo-200"
                        >
                            <UserPlus className="w-5 h-5" />
                            Add New {activeTab === 'STUDENTS' ? 'Student' : 'Teacher'}
                        </button>
                    )}
                    {activeTab === 'SCHOOLS' && ['ADMIN'].includes(user?.role) && (
                        <button
                            onClick={() => { setEditingItem(null); setFormData({}); setIsModalOpen(true); }}
                            className="premium-button bg-indigo-600 text-white flex items-center gap-2 px-8 py-4 rounded-2xl shadow-lg shadow-indigo-200"
                        >
                            <UserPlus className="w-5 h-5" />
                            Add New School
                        </button>
                    )}
                </div>

                {/* Tabs & Search */}
                <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
                    <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-1 self-start">
                        {['STUDENTS', 'TEACHERS', 'SCHOOLS'].map(tab => {
                            if (tab === 'SCHOOLS' && !['ADMIN'].includes(user?.role)) return null;
                            return (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-8 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === tab
                                        ? 'bg-white text-indigo-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    {tab}
                                </button>
                            );
                        })}
                    </div>

                    <div className="relative w-full md:w-96 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            type="text"
                            placeholder={`Search ${activeTab.toLowerCase()}...`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm"
                        />
                    </div>
                </div>

                {/* Data Table */}
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden min-h-[400px]">
                    {loading ? (
                        <div className="p-12"><SkeletonLoader type="table" count={6} /></div>
                    ) : (
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="overflow-x-auto"
                        >
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100">
                                        <th className="px-8 py-6 text-xs font-bold text-slate-400 uppercase tracking-widest">{activeTab === 'SCHOOLS' ? 'Institution' : 'Stakeholder'}</th>
                                        <th className="px-8 py-6 text-xs font-bold text-slate-400 uppercase tracking-widest">{activeTab === 'SCHOOLS' ? 'School Code' : 'Identification'}</th>
                                        <th className="px-8 py-6 text-xs font-bold text-slate-400 uppercase tracking-widest">{activeTab === 'SCHOOLS' ? 'Address' : (activeTab === 'STUDENTS' ? 'Grading' : 'Department')}</th>
                                        <th className="px-8 py-6 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Operations</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredData.map((item) => (
                                        <motion.tr
                                            key={item.id}
                                            variants={itemVariants}
                                            className="hover:bg-slate-50/50 transition-colors group"
                                        >
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg cursor-pointer hover:scale-110 transition-transform ${activeTab === 'STUDENTS' ? 'bg-blue-50 text-blue-600' : activeTab === 'TEACHERS' ? 'bg-purple-50 text-purple-600' : 'bg-emerald-50 text-emerald-600'
                                                        }`}
                                                        onClick={() => activeTab !== 'SCHOOLS' && navigate(`/profile/${activeTab === 'STUDENTS' ? 'student' : 'teacher'}/${item.id}`)}
                                                    >
                                                        {item.name.charAt(0)}
                                                    </div>
                                                    <div
                                                        onClick={() => activeTab !== 'SCHOOLS' && navigate(`/profile/${activeTab === 'STUDENTS' ? 'student' : 'teacher'}/${item.id}`)}
                                                        className={activeTab !== 'SCHOOLS' ? "cursor-pointer" : ""}
                                                    >
                                                        <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{item.name}</div>
                                                        <div className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mt-1">
                                                            {activeTab === 'SCHOOLS' ? (
                                                                <>Year: {item.academicYear || 'N/A'}</>
                                                            ) : (
                                                                <>
                                                                    <Mail className="w-3.5 h-3.5" />
                                                                    {item.email || 'No email attached'}
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl text-xs font-black inline-flex items-center gap-2">
                                                    <Hash className="w-3 h-3 opacity-50" />
                                                    {item.rollNumber || item.employeeId || item.schoolCode || 'PENDING'}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2">
                                                    {activeTab === 'STUDENTS' ? (
                                                        <>
                                                            <span className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-xs font-black border border-blue-100">
                                                                CLASS {item.className}
                                                            </span>
                                                            <span className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-black border border-indigo-100">
                                                                {item.section}
                                                            </span>
                                                        </>
                                                    ) : activeTab === 'TEACHERS' ? (
                                                        <span className="px-4 py-1.5 bg-purple-50 text-purple-600 rounded-xl text-xs font-black border border-purple-100 uppercase tracking-wider">
                                                            {item.subject || 'GENERAL'}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs font-medium text-slate-500 truncate max-w-[200px]" title={item.address}>
                                                            {item.address}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                    <button
                                                        onClick={() => handleEdit(item)}
                                                        className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                                    >
                                                        <Edit2 className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item.id)}
                                                        className="p-2.5 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredData.length === 0 && (
                                <div className="py-32 text-center text-slate-400 font-bold">
                                    No records found matching your current filters.
                                </div>
                            )}
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Modal - Simplified for brevity but functional */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                            onClick={() => setIsModalOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl relative z-10 overflow-hidden border border-slate-100"
                        >
                            <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                                    {editingItem ? 'Edit Profile' : 'New Identity Registration'}
                                </h2>
                                <button onClick={() => setIsModalOpen(false)} className="p-3 bg-white rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors">
                                    <XCircle className="w-6 h-6 text-slate-400" />
                                </button>
                            </div>
                            <form onSubmit={handleSave} className="p-10 grid grid-cols-2 gap-8">
                                <div className="space-y-2 col-span-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Full Legal Name</label>
                                    <input
                                        required
                                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-bold"
                                        value={formData.name || ''}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Enter full name..."
                                    />
                                </div>

                                {activeTab === 'TEACHERS' && (
                                    <div className="space-y-2 col-span-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Institutional Email</label>
                                        <input
                                            required
                                            type="email"
                                            className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-bold"
                                            value={formData.email || ''}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="teacher@institution.edu"
                                        />
                                    </div>
                                )}

                                {activeTab === 'SCHOOLS' ? (
                                    <>
                                        <div className="space-y-2 col-span-2">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Institutional Address</label>
                                            <input
                                                required
                                                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-bold"
                                                value={formData.address || ''}
                                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                                                placeholder="Enter full address..."
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">School Code</label>
                                            <input
                                                required
                                                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-bold"
                                                value={formData.schoolCode || ''}
                                                onChange={e => setFormData({ ...formData, schoolCode: e.target.value })}
                                                placeholder="e.g. SCH-001"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Academic Year</label>
                                            <input
                                                required
                                                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-bold"
                                                value={formData.academicYear || ''}
                                                onChange={e => setFormData({ ...formData, academicYear: e.target.value })}
                                                placeholder="e.g. 2024-25"
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                                                {activeTab === 'STUDENTS' ? 'Current Class' : 'Specialization'}
                                            </label>
                                            <input
                                                required
                                                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-bold"
                                                value={activeTab === 'STUDENTS' ? formData.className || '' : formData.subject || ''}
                                                onChange={e => activeTab === 'STUDENTS' ? setFormData({ ...formData, className: e.target.value }) : setFormData({ ...formData, subject: e.target.value })}
                                                placeholder={activeTab === 'STUDENTS' ? "e.g. 10" : "e.g. Mathematics"}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                                                {activeTab === 'STUDENTS' ? 'Roll Code' : 'Staff Identifier'}
                                            </label>
                                            <input
                                                required
                                                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-bold"
                                                value={activeTab === 'STUDENTS' ? formData.rollNumber || '' : formData.employeeId || ''}
                                                onChange={e => activeTab === 'STUDENTS' ? setFormData({ ...formData, rollNumber: e.target.value }) : setFormData({ ...formData, employeeId: e.target.value })}
                                                placeholder="Enter unique ID..."
                                            />
                                        </div>

                                        {activeTab === 'STUDENTS' && (
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Section</label>
                                                <input
                                                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-bold"
                                                    value={formData.section || ''}
                                                    onChange={e => setFormData({ ...formData, section: e.target.value })}
                                                    placeholder="e.g. A"
                                                />
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Contact Protocol</label>
                                            <input
                                                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-bold"
                                                value={activeTab === 'STUDENTS' ? formData.parentPhone || '' : formData.phoneNumber || ''}
                                                onChange={e => activeTab === 'STUDENTS' ? setFormData({ ...formData, parentPhone: e.target.value }) : setFormData({ ...formData, phoneNumber: e.target.value })}
                                                placeholder="+1 234..."
                                            />
                                        </div>
                                    </>
                                )}

                                <div className="col-span-2 pt-6 flex gap-4">
                                    <button
                                        type="submit"
                                        className="flex-1 py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black tracking-tight shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all"
                                    >
                                        Seal Profile and Synchronize
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-10 py-5 bg-slate-100 text-slate-600 rounded-[1.5rem] font-bold"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
};

export default Management;
