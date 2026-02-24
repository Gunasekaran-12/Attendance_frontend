import React from 'react';

const SkeletonLoader = ({ type = 'card', count = 1 }) => {
    const Card = () => (
        <div className="bg-white p-6 rounded-lg shadow-md animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
        </div>
    );

    const Table = () => (
        <div className="bg-white p-6 rounded-lg shadow-md animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-12 bg-gray-200 rounded"></div>
                ))}
            </div>
        </div>
    );

    const Chart = () => (
        <div className="bg-white p-6 rounded-lg shadow-md animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
        </div>
    );

    const renderSkeleton = () => {
        switch (type) {
            case 'card':
                return <Card />;
            case 'table':
                return <Table />;
            case 'chart':
                return <Chart />;
            default:
                return <Card />;
        }
    };

    return (
        <>
            {[...Array(count)].map((_, index) => (
                <div key={index} className="mb-4">
                    {renderSkeleton()}
                </div>
            ))}
        </>
    );
};

export default SkeletonLoader;
