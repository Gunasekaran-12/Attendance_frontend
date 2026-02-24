import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, School, GraduationCap, Calendar,
    ArrowLeft, Mail, Phone, MapPin,
    TrendingUp, Award, Clock, Shield
} from 'lucide-react';
import { profileAPI } from '../api';
import { useToast } from '../context/ToastContext';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';

const ProfilePage = () => {
    const { role, id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);

    useEffect(() => {
        loadProfile();
    }, [role, id]);

    const loadProfile = async () => {
        try {
            setLoading(true);
            let response;
            switch (role.toUpperCase()) {
                case 'STUDENT':
                    response = await profileAPI.getStudentProfile(id);
                    break;
                case 'TEACHER':
                    response = await profileAPI.getTeacherProfile(id);
                    break;
                case 'SCHOOL':
                    response = await profileAPI.getSchoolProfile(id);
                    break;
                default:
                    throw new Error('Invalid profile role');
            }
            setData(response.data);
        } catch (error) {
            toast.error('Failed to load profile');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-500 font-medium anim-pulse">Loading Profile...</p>
                </div>
            </div>
        );
    }

    if (!data) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="min-h-screen bg-[#f8fafc] pb-12"
        >
            {/* Header / Banner */}
            <div className="h-48 bg-gradient-to-r from-indigo-600 to-purple-600 relative overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
                </div>

                <button
                    onClick={() => navigate(-1)}
                    className="absolute top-6 left-6 p-2 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition-all text-white group"
                >
                    <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                </button>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Sidebar: Profile Card */}
                    <div className="lg:col-span-1 space-y-6">
                        <motion.div
                            className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 text-center"
                            whileHover={{ y: -5 }}
                        >
                            <div className="relative inline-block mb-6">
                                <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-slate-100 flex items-center justify-center overflow-hidden">
                                    <User className="w-16 h-16 text-slate-400" />
                                </div>
                                <div className="absolute bottom-1 right-1 w-8 h-8 bg-emerald-500 border-4 border-white rounded-full" />
                            </div>

                            <h1 className="text-2xl font-bold text-slate-900 mb-1">{data.name}</h1>
                            <p className="text-indigo-600 font-bold text-sm tracking-wider uppercase mb-6">
                                {data.role} • {data.profileId}
                            </p>

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <p className="text-xs text-slate-500 mb-1">Status</p>
                                    <p className="text-sm font-bold text-emerald-600">Active</p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <p className="text-xs text-slate-500 mb-1">Verified</p>
                                    <Shield className="w-4 h-4 text-indigo-600 mx-auto" />
                                </div>
                            </div>

                            <div className="space-y-4 text-left">
                                <div className="flex items-center gap-4 text-slate-600">
                                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                                        <School className="w-5 h-5 text-slate-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400">School</p>
                                        <p className="text-sm font-bold">{data.schoolName}</p>
                                    </div>
                                </div>
                                {data.className && (
                                    <div className="flex items-center gap-4 text-slate-600">
                                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                                            <GraduationCap className="w-5 h-5 text-slate-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400">Class</p>
                                            <p className="text-sm font-bold">{data.className} - {data.section}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
                            <h3 className="text-lg font-bold text-slate-800 mb-6">Contact Information</h3>
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <Phone className="w-5 h-5 text-slate-400" />
                                    <span className="text-slate-600 font-medium">+91 98765 43210</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Mail className="w-5 h-5 text-slate-400" />
                                    <span className="text-slate-600 font-medium">{role === 'student' ? 'parent@example.com' : 'teacher@school.edu'}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <MapPin className="w-5 h-5 text-slate-400" />
                                    <span className="text-slate-600 font-medium">Main Street, Block B, District Central</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content: Stats & Charts */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Highlights Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {Object.entries(data.stats || {}).map(([key, value], idx) => (
                                <motion.div
                                    key={key}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between"
                                >
                                    <div>
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">{key.replace(/([A-Z])/g, ' $1')}</p>
                                        <p className="text-2xl font-black text-slate-900">{typeof value === 'number' ? value.toLocaleString() : value}{key === 'attendance' ? '%' : ''}</p>
                                    </div>
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-indigo-50`}>
                                        <TrendingUp className="w-6 h-6 text-indigo-600" />
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Chart Section */}
                        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900">Performance Analytics</h3>
                                    <p className="text-sm text-slate-500">Attendance & Activity trends for current session</p>
                                </div>
                                <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                                    <button className="px-5 py-2 bg-white text-indigo-600 shadow-sm rounded-xl text-sm font-bold transition-all">Daily</button>
                                    <button className="px-5 py-2 text-slate-500 rounded-xl text-sm font-bold transition-all hover:text-slate-700">Monthly</button>
                                </div>
                            </div>

                            <div className="h-[350px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart
                                        data={[
                                            { name: 'Mon', val: 85 },
                                            { name: 'Tue', val: 78 },
                                            { name: 'Wed', val: 92 },
                                            { name: 'Thu', val: 88 },
                                            { name: 'Fri', val: 95 },
                                            { name: 'Sat', val: 82 },
                                        ]}
                                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                                    >
                                        <defs>
                                            <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Area type="monotone" dataKey="val" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100">
                            <h3 className="text-xl font-bold text-slate-900 mb-6">Recent Activity Log</h3>
                            <div className="space-y-6">
                                {[1, 2, 3].map((item) => (
                                    <div key={item} className="flex items-start gap-4 p-4 rounded-3xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center shrink-0">
                                            <Clock className="w-6 h-6 text-indigo-600" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800">Attendance Marked</p>
                                            <p className="text-sm text-slate-500 mb-2">Student was marked Present by Teacher Sarah</p>
                                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                                <Calendar className="w-3.5 h-3.5" />
                                                <span>Oct 24, 2023 • 09:30 AM</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default ProfilePage;
