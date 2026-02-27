import React from 'react';
import { motion } from 'framer-motion';

const StatCard = ({ label, value, icon, color = 'blue' }) => {
    const colorMap = {
        blue: 'from-blue-500 to-blue-600 shadow-blue-500/20 text-blue-400',
        green: 'from-emerald-500 to-emerald-600 shadow-emerald-500/20 text-emerald-400',
        orange: 'from-orange-500 to-orange-600 shadow-orange-500/20 text-orange-400',
        purple: 'from-purple-500 to-purple-600 shadow-purple-500/20 text-purple-400',
    };

    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="relative overflow-hidden group p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all duration-300 backdrop-blur-sm"
        >
            {/* Background patterns */}
            <div className={`absolute top-0 right-0 p-4 opacity-[0.05] group-hover:opacity-[0.08] transition-opacity`}>
                {icon}
            </div>

            <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-gray-400 uppercase tracking-wider">{label}</span>
                <div className="flex items-center gap-3">
                    <span className={`text-3xl font-bold ${colorMap[color].split(' ').pop()}`}>
                        {value}
                    </span>
                    <div className={`p-2 rounded-lg bg-white/[0.05] text-white/50 group-hover:text-white transition-colors`}>
                        {icon}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default StatCard;
