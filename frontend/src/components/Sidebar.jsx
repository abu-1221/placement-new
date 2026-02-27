import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, ChevronLeft, LayoutDashboard } from 'lucide-react';

const Sidebar = ({ items, isCollapsed, isMobileOpen, setIsMobileOpen, onToggle, onLogout }) => {
    const location = useLocation();

    return (
        <>
            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar Container */}
            <aside className={`
        fixed top-0 left-0 h-full z-50 bg-[#16162d]/80 backdrop-blur-xl border-r border-white/10 transition-all duration-300
        ${isCollapsed ? 'w-20' : 'w-64'}
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-white/5">
                        <Link to="/" className="flex items-center gap-3 overflow-hidden">
                            <img src="/logo.png" alt="Logo" className="w-8 h-8 min-w-[32px]" />
                            {!isCollapsed && (
                                <span className="font-bold text-lg whitespace-nowrap bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                                    JMC-TEST
                                </span>
                            )}
                        </Link>
                        <button
                            onClick={onToggle}
                            className="hidden md:flex p-1 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <ChevronLeft className={`w-5 h-5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
                        </button>
                    </div>

                    {/* Nav Items */}
                    <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
                        {items.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => {
                                    item.onClick();
                                    setIsMobileOpen(false);
                                }}
                                className={`
                  w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group
                  ${item.active
                                        ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 text-blue-400'
                                        : 'text-gray-400 hover:bg-white/5 hover:text-white'}
                `}
                            >
                                <div className={`${item.active ? 'text-blue-400' : 'group-hover:text-white'}`}>
                                    {item.icon}
                                </div>
                                {!isCollapsed && (
                                    <span className="font-medium whitespace-nowrap">{item.label}</span>
                                )}
                                {item.active && !isCollapsed && (
                                    <motion.div
                                        layoutId="active-pill"
                                        className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]"
                                    />
                                )}
                            </button>
                        ))}
                    </nav>

                    {/* Footer */}
                    <div className="p-4 border-t border-white/5">
                        <button
                            onClick={onLogout}
                            className={`
                w-full flex items-center gap-3 p-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-200
                ${isCollapsed ? 'justify-center' : ''}
              `}
                        >
                            <LogOut className="w-5 h-5" />
                            {!isCollapsed && <span className="font-medium">Logout</span>}
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
