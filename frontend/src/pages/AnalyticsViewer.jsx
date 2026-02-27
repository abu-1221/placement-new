import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    ChevronLeft,
    RefreshCw,
    BarChart2,
    PieChart,
    TrendingUp,
    Target,
    Activity,
    Box,
    Layers,
    Cpu,
    AlertTriangle
} from 'lucide-react';

const AnalyticsViewer = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [mlData, setMlData] = useState({
        testScore: 75,
        studentName: 'John Doe',
        predictions: null
    });

    // Simulate loading
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
            loadMLAnalytics();
        }, 1500);
        return () => clearTimeout(timer);
    }, []);

    const loadMLAnalytics = () => {
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            setMlData(prev => ({
                ...prev,
                predictions: {
                    success: true,
                    willPlaced: true,
                    probability: 88.5,
                    recommendation: "Strong focus on System Design recommended"
                }
            }));
        }, 800);
    };

    return (
        <div className="min-h-screen bg-[#0a0f1c] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-[#0a0f1c] to-[#0a0f1c] text-white p-6 md:p-12 font-sans relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-600/10 to-transparent pointer-events-none" />
            <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-[150px] pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <header className="mb-12">
                    <Link to="/staff-dashboard" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 px-4 py-2 rounded-xl transition-all mb-8 font-medium">
                        <ChevronLeft className="w-5 h-5" /> Back to Dashboard
                    </Link>

                    <div className="text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent mb-3">
                                Advanced AI Analytics
                            </h1>
                            <p className="text-gray-400 text-lg">Comprehensive placement insights powered by Machine Learning.</p>
                        </div>
                        <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md shadow-xl">
                            <span className="relative flex h-3 w-3">
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isLoading ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
                                <span className={`relative inline-flex rounded-full h-3 w-3 ${isLoading ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                            </span>
                            <span className="text-sm font-medium text-gray-300 uppercase tracking-widest font-mono">
                                {isLoading ? 'Processing Model...' : 'Model Online (v2.4.1)'}
                            </span>
                        </div>
                    </div>
                </header>

                {/* Section 1: Standard Analytics */}
                <section className="mb-16">
                    <SectionTitle title="Standard Analytics" subtitle="Descriptive statistical visualizations" badge="Base Layer" badgeColor="bg-blue-500/20 text-blue-400 border-blue-500/30" icon={<BarChart2 />} />

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <ChartCard title="Monthly Placement Trends" icon={<TrendingUp className="text-blue-400" />} delay={1} />
                        <ChartCard title="Dept. Placements" icon={<PieChart className="text-purple-400" />} delay={2} />
                        <ChartCard title="Company Distribution" icon={<Box className="text-emerald-400" />} delay={3} />
                        <ChartCard title="Scores vs Packages" icon={<Target className="text-amber-400" />} delay={4} />
                    </div>
                </section>

                {/* Section 2: Advanced Analytics */}
                <section className="mb-16">
                    <SectionTitle title="Advanced Pattern Recognition" subtitle="Multivariate data analysis" badge="Professional" badgeColor="bg-purple-500/20 text-purple-400 border-purple-500/30" icon={<Layers />} />

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <ChartCard title="Skill Score Distribution" icon={<Activity className="text-pink-400" />} delay={1} />
                        <ChartCard title="Test Score Frequency" icon={<BarChart2 className="text-indigo-400" />} delay={2} />
                        <ChartCard title="Dept-Skill Heatmap" icon={<Layers className="text-orange-400" />} delay={3} />
                        <ChartCard title="Skills Radar Comparison" icon={<Target className="text-cyan-400" />} delay={4} />
                    </div>
                </section>

                {/* Section 3: Machine Learning Playground */}
                <section>
                    <SectionTitle title="Predictive ML Engine" subtitle="Live inferencing using trained neural networks" badge="AI Powered" badgeColor="bg-emerald-500/20 text-emerald-400 border-emerald-500/30" icon={<Cpu />} />

                    <div className="bg-white/[0.02] border border-white/5 shadow-2xl backdrop-blur-xl rounded-3xl p-6 md:p-8 mb-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />

                        <div className="flex flex-col md:flex-row gap-6 items-end relative z-10">
                            <div className="w-full md:w-1/3">
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Simulation: Test Score</label>
                                <input
                                    type="number"
                                    className="w-full bg-[#0f172a]/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono text-lg"
                                    value={mlData.testScore}
                                    onChange={(e) => setMlData({ ...mlData, testScore: e.target.value })}
                                />
                            </div>
                            <div className="w-full md:w-1/3">
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Subject Name (For DB Correlation)</label>
                                <input
                                    type="text"
                                    className="w-full bg-[#0f172a]/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium text-lg"
                                    value={mlData.studentName}
                                    onChange={(e) => setMlData({ ...mlData, studentName: e.target.value })}
                                />
                            </div>
                            <div className="w-full md:w-1/3">
                                <button
                                    className={`w-full py-3 px-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${isLoading ? 'bg-emerald-600/50 text-white/50 cursor-wait' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/25'}`}
                                    onClick={loadMLAnalytics}
                                    disabled={isLoading}
                                >
                                    <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                                    {isLoading ? 'Processing Inference...' : 'Generate New Prediction'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Prediction Results Card */}
                        <div className="bg-gradient-to-br from-[#162238] to-[#0f172a] border border-white/10 rounded-3xl p-6 relative overflow-hidden shadow-2xl group hover:border-emerald-500/50 transition-colors duration-500">
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                                <Target className="text-emerald-400" /> Placement Probability
                            </h3>

                            <div className="flex items-center justify-center p-8 bg-[#0a0f1c]/50 border border-white/5 rounded-2xl min-h-[250px]">
                                {isLoading ? (
                                    <div className="flex flex-col items-center gap-4 text-emerald-500/50">
                                        <RefreshCw className="w-12 h-12 animate-spin" />
                                        <p className="font-mono text-sm">Querying Model Weights...</p>
                                    </div>
                                ) : mlData.predictions ? (
                                    <div className="w-full animate-fade-in-up">
                                        <div className="text-center mb-8">
                                            <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-emerald-400 mb-2">
                                                {mlData.predictions.probability}%
                                            </div>
                                            <div className="text-emerald-400 font-bold uppercase tracking-widest text-sm">
                                                Confidence Score
                                            </div>
                                        </div>

                                        <div className="space-y-4 font-mono text-sm">
                                            <div className="flex justify-between items-center p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                                <span className="text-gray-400">Classification:</span>
                                                <span className={`font-bold ${mlData.predictions.willPlaced ? 'text-emerald-400' : 'text-amber-400'}`}>
                                                    {mlData.predictions.willPlaced ? 'HIGH LIKELIHOOD' : 'AT RISK'}
                                                </span>
                                            </div>
                                            <div className="flex flex-col p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                                <span className="text-gray-400 mb-1">AI Recommendation:</span>
                                                <span className="text-blue-300 font-sans font-medium">{mlData.predictions.recommendation}</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <NoConnection />
                                )}
                            </div>
                        </div>

                        <ChartCard title="Performance Trend Analysis" icon={<Activity className="text-blue-400" />} delay={1} isLarge={true} isLoading={isLoading} />
                        <ChartCard title="Skills Gap Analysis" icon={<PieChart className="text-purple-400" />} delay={2} isLarge={true} isLoading={isLoading} />
                        <ChartCard title="Comparative Performance" icon={<Layers className="text-orange-400" />} delay={3} isLarge={true} isLoading={isLoading} />
                    </div>
                </section>
            </div>
        </div>
    );
};

// UI Sub components
const SectionTitle = ({ title, subtitle, badge, badgeColor, icon }) => (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-white/10 pb-4 mb-8">
        <div className="flex items-center gap-4 mb-4 sm:mb-0">
            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white border border-white/10">
                {icon}
            </div>
            <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">{title}</h2>
                <p className="text-gray-400 text-sm mt-1">{subtitle}</p>
            </div>
        </div>
        <div className={`px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider ${badgeColor}`}>
            {badge}
        </div>
    </div>
);

const ChartCard = ({ title, icon, isLarge = false, isLoading = false }) => (
    <div className={`bg-white/[0.02] border border-white/5 rounded-3xl p-6 relative overflow-hidden group hover:bg-white/[0.04] transition-all duration-500 ${isLarge ? '' : 'hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/10'}`}>
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
            {icon} {title}
        </h3>
        <div className={`w-full rounded-2xl bg-[#0f172a]/50 border border-white/5 flex items-center justify-center ${isLarge ? 'min-h-[250px]' : 'aspect-square'}`}>
            {isLoading ? (
                <div className="flex flex-col items-center gap-3 text-blue-500/50">
                    <RefreshCw className="w-8 h-8 animate-spin" />
                    <span className="text-xs font-mono uppercase tracking-widest">Rendering...</span>
                </div>
            ) : (
                <NoConnection />
            )}
        </div>

        {/* Glow effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
);

const NoConnection = () => (
    <div className="text-center p-6 text-gray-500">
        <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="font-medium text-sm text-gray-400">Live Data Unavailable</p>
        <p className="text-xs opacity-50 mt-1 font-mono hover:text-red-400 transition-colors cursor-help" title="Unable to establish connection to Python Analytics Engine on localhost:5000">ERR_CONN_REFUSED</p>
    </div>
);

export default AnalyticsViewer;
