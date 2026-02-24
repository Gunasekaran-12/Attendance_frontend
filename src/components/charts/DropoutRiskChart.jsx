import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const DropoutRiskChart = ({ data }) => {
    // Expected data format: [{ name: 'High Risk', value: 5 }, { name: 'Medium Risk', value: 12 }, { name: 'Low Risk', value: 150 }]

    const COLORS = {
        'High Risk': '#EF4444',
        'Medium Risk': '#F59E0B',
        'Low Risk': '#10B981',
    };

    const renderLabel = (entry) => {
        return `${entry.name}: ${entry.value}`;
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Dropout Risk Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderLabel}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

export default DropoutRiskChart;
