import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ClassComparisonChart = ({ data }) => {
    // Expected data format: [{ className: '1-A', percentage: 85, present: 28, total: 33 }, ...]

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Class-wise Attendance Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="className" tick={{ fontSize: 12 }} />
                    <YAxis
                        domain={[0, 100]}
                        tick={{ fontSize: 12 }}
                        label={{ value: 'Attendance %', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip
                        formatter={(value, name) => {
                            if (name === 'percentage') return `${value.toFixed(1)}%`;
                            return value;
                        }}
                    />
                    <Legend />
                    <Bar
                        dataKey="percentage"
                        fill="#10B981"
                        name="Attendance %"
                        radius={[8, 8, 0, 0]}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default ClassComparisonChart;
