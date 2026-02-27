import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Building2, ChevronRight, Play } from 'lucide-react';

const TestCard = ({ test, onStart }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -5 }}
            className="group relative p-6 rounded-2xl bg-gradient-to-br from-white/[0.05] to-white/[0.01] border border-white/10 hover:border-blue-500/30 transition-all duration-300 backdrop-blur-md overflow-hidden"
        >
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                <Building2 className="w-16 h-16" />
            </div>

            <div className="flex flex-col h-full gap-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                            <span className="font-bold text-xl">{test.company?.[0]?.toUpperCase() || 'T'}</span>
                        </div>
                        <div>
                            <h4 className="font-bold text-lg text-white group-hover:text-blue-400 transition-colors">
                                {test.name}
                            </h4>
                            <p className="text-sm text-gray-500">{test.company}</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-emerald-400" />
                        <span>{test.duration} Minutes</span>
                    </div>
                    <div className="w-1 h-1 rounded-full bg-white/10" />
                    <div className="flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-purple-400" />
                        <span>PlacementDrive</span>
                    </div>
                </div>

                <button
                    onClick={() => onStart(test)}
                    className="mt-auto w-full group/btn flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                >
                    <Play className="w-4 h-4" />
                    Start Assessment
                    <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </button>
            </div>
        </motion.div>
    );
};

export default TestCard;
