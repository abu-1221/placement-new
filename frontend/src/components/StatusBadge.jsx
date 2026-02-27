import React from 'react';

const StatusBadge = ({ status }) => {
    const styles = {
        passed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/5',
        failed: 'bg-red-500/10 text-red-400 border-red-500/20 shadow-red-500/5',
        active: 'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-blue-500/5',
        pending: 'bg-orange-500/10 text-orange-400 border-orange-500/20 shadow-orange-500/5',
    };

    const normalizedStatus = status?.toLowerCase() || 'pending';
    const styleClass = styles[normalizedStatus] || styles.pending;

    return (
        <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border shadow-sm ${styleClass}`}>
            {status}
        </span>
    );
};

export default StatusBadge;
