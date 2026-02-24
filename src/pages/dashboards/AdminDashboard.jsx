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
            case 'SUPER_ADMIN':
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
            case 'SUPER_ADMIN':
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
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">{getAdminTitle()}</h1>
                <p className="text-gray-600 mt-1">{getAdminScope()}</p>
            </div>

            {isAdmin() && (
                <div className="mb-8">
                    <h2 className="text-lg font-bold text-gray-700 mb-4">Quick Actions</h2>
                    <div className="flex flex-wrap gap-4">
                        <Link
                            to="/admin/reports"
                            className="inline-flex items-center gap-3 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                        >
                            <BarChart2 className="w-5 h-5" />
                            Admin Reports
                        </Link>
                        <Link
                            to="/admin/management"
                            className="inline-flex items-center gap-3 px-6 py-4 bg-white text-indigo-600 rounded-2xl font-bold text-sm hover:bg-indigo-50 transition-all shadow-md border border-indigo-100"
                        >
                            <Users className="w-5 h-5" />
                            Manage Students &amp; Teachers
                        </Link>
                    </div>
                </div>
            )}


            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
                    <div className="text-sm text-gray-600 mb-1">Total States</div>
                    <div className="text-3xl font-bold text-gray-800">
                        {hierarchy?.states?.length || 0}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
                    <div className="text-sm text-gray-600 mb-1">Total Districts</div>
                    <div className="text-3xl font-bold text-gray-800">
                        {hierarchy?.districts?.length || 0}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
                    <div className="text-sm text-gray-600 mb-1">Total Blocks</div>
                    <div className="text-3xl font-bold text-gray-800">
                        {hierarchy?.blocks?.length || 0}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
                    <div className="text-sm text-gray-600 mb-1">Total Schools</div>
                    <div className="text-3xl font-bold text-gray-800">
                        {schools.length || 0}
                    </div>
                </div>
            </div>

            {/* Geographic Hierarchy */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Geographic Hierarchy</h2>
                <div className="space-y-4">
                    {hierarchy?.states?.map((state) => (
                        <div key={state.id} className="border rounded-lg p-4">
                            <div className="font-semibold text-lg text-gray-800">{state.name}</div>
                            <div className="ml-4 mt-2 space-y-2">
                                {hierarchy?.districts
                                    ?.filter((d) => d.state?.id === state.id)
                                    .map((district) => (
                                        <div key={district.id} className="border-l-2 border-blue-300 pl-4">
                                            <div className="font-medium text-gray-700">{district.name}</div>
                                            <div className="ml-4 mt-1 space-y-1">
                                                {hierarchy?.blocks
                                                    ?.filter((b) => b.district?.id === district.id)
                                                    .map((block) => (
                                                        <div key={block.id} className="text-sm text-gray-600">
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
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold text-gray-800 mb-4">School Performance</h2>
                {schools.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                        <p className="text-gray-400">No schools found or data not synchronised.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-gray-400 text-xs font-bold uppercase tracking-widest border-b border-gray-100">
                                    <th className="pb-4">School Name</th>
                                    <th className="pb-4">Total Students</th>
                                    <th className="pb-4">Present Today</th>
                                    <th className="pb-4">Percentage</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {schools.map((school, index) => (
                                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                                        <td className="py-4 font-semibold text-gray-700">{school.schoolName}</td>
                                        <td className="py-4 text-gray-600">{school.summary?.totalStudents}</td>
                                        <td className="py-4 text-gray-600">{school.summary?.present}</td>
                                        <td className="py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${school.summary?.percentage >= 90 ? 'bg-green-100 text-green-700' :
                                                school.summary?.percentage >= 75 ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-red-100 text-red-700'
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
