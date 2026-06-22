import React, { useState, useEffect } from 'react';
import { geographyAPI, dashboardAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import { Link } from 'react-router-dom';
import { Users, BarChart2 } from 'lucide-react';



const AdminDashboard = () => {
    const { user, isAdmin } = useAuth();
    const toast = useToast();
    const [hierarchy, setHierarchy] = useState(null);
    const [schools, setSchools] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const [hierarchyRes, performanceRes] = await Promise.all([
                geographyAPI.getHierarchy(),
                dashboardAPI.getSchoolPerformances(),
            ]);

            setHierarchy(hierarchyRes.data);
            setSchools(performanceRes.data);
            toast.success('Administrative summary loaded');
        } catch (error) {
            console.error('Error loading dashboard:', error);
            toast.error('Failed to load administrative data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="space-y-6">
                    <SkeletonLoader type="card" count={4} />
                    <SkeletonLoader type="table" count={1} />
                </div>
            </DashboardLayout>
        );
    }

    const getAdminTitle = () => {
        switch (user?.role) {
            case 'ADMIN':
                return 'Super Admin Dashboard';
            case 'DISTRICT_ADMIN':
                return 'District Admin Dashboard';
            case 'BLOCK_ADMIN':
                return 'Block Admin Dashboard';
            default:
                return 'Admin Dashboard';
        }
    };

    const getAdminScope = () => {
        switch (user?.role) {
            case 'ADMIN':
                return 'National Overview';
            case 'DISTRICT_ADMIN':
                return `District: ${user?.district?.name || 'N/A'}`;
            case 'BLOCK_ADMIN':
                return `Block: ${user?.block?.name || 'N/A'}`;
            default:
                return 'Overview';
        }
    };

    return (
        <DashboardLayout>
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">{getAdminTitle()}</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">{getAdminScope()}</p>
                </div>
            </div>

            {isAdmin() && (
                <div className="mb-8">
                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1 mb-4">Institutional Tools</h2>
                    <div className="flex flex-wrap gap-4">
                        <Link
                            to="/admin/reports"
                            className="inline-flex items-center gap-3 px-8 py-4.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-indigo-500/20 active:scale-98"
                        >
                            <BarChart2 className="w-5 h-5" />
                            Admin Reports
                        </Link>
                        <Link
                            to="/admin/management"
                            className="inline-flex items-center gap-3 px-8 py-4.5 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-slate-700 rounded-2xl font-bold text-sm hover:bg-indigo-50 dark:hover:bg-slate-700/50 transition-all shadow-md active:scale-98"
                        >
                            <Users className="w-5 h-5" />
                            Manage Institutional Directory
                        </Link>
                    </div>
                </div>
            )}


            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                <div className="dashboard-widget border-l-4 border-l-indigo-500">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total States</div>
                    <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        {hierarchy?.states?.length || 0}
                    </div>
                </div>

                <div className="dashboard-widget border-l-4 border-l-emerald-500">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Districts</div>
                    <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        {hierarchy?.districts?.length || 0}
                    </div>
                </div>

                <div className="dashboard-widget border-l-4 border-l-amber-500">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Blocks</div>
                    <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        {hierarchy?.blocks?.length || 0}
                    </div>
                </div>

                <div className="dashboard-widget border-l-4 border-l-purple-500">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Schools</div>
                    <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        {schools.length || 0}
                    </div>
                </div>
            </div>

            {/* Geographic Hierarchy */}
            <div className="dashboard-widget mb-8">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Geographic Hierarchy</h2>
                <div className="space-y-4">
                    {hierarchy?.states?.map((state) => (
                        <div key={state.id} className="border border-slate-100 dark:border-slate-800 rounded-3xl p-6 bg-slate-50/50 dark:bg-slate-900/20">
                            <div className="font-extrabold text-lg text-slate-800 dark:text-slate-200 tracking-tight">{state.name}</div>
                            <div className="ml-4 mt-4 space-y-4">
                                {hierarchy?.districts
                                    ?.filter((d) => d.state?.id === state.id)
                                    .map((district) => (
                                        <div key={district.id} className="border-l-2 border-indigo-200 dark:border-indigo-900/60 pl-4">
                                            <div className="font-bold text-slate-700 dark:text-slate-300">{district.name}</div>
                                            <div className="ml-4 mt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                                {hierarchy?.blocks
                                                    ?.filter((b) => b.district?.id === district.id)
                                                    .map((block) => (
                                                        <div key={block.id} className="text-sm font-semibold text-slate-550 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 px-3.5 py-2 rounded-xl shadow-sm">
                                                            • {block.name}
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* School Comparison Table */}
            <div className="dashboard-widget">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">School Performance Summary</h2>
                {schools.length === 0 ? (
                    <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/25 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-800">
                        <p className="text-slate-400 font-medium">No schools found or data not synchronised.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                                    <th className="pb-5 pl-4">School Name</th>
                                    <th className="pb-5">Total Students</th>
                                    <th className="pb-5">Present Today</th>
                                    <th className="pb-5 pr-4">Percentage</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                                {schools.map((school, index) => (
                                    <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all group">
                                        <td className="py-5 pl-4 font-bold text-slate-700 dark:text-slate-200">{school.schoolName}</td>
                                        <td className="py-5 font-semibold text-slate-500 dark:text-slate-400">{school.summary?.totalStudents}</td>
                                        <td className="py-5 font-semibold text-slate-500 dark:text-slate-400">{school.summary?.present}</td>
                                        <td className="py-5 pr-4">
                                            <span className={`inline-block px-3 py-1 rounded-xl text-xs font-bold ${school.summary?.percentage >= 90 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                                school.summary?.percentage >= 75 ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                                    'bg-rose-50 text-rose-600 border border-rose-100'
                                                }`}>
                                                {school.summary?.percentage?.toFixed(1)}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default AdminDashboard;
