import React from 'react';
import { Menu, User, Bell } from 'lucide-react';

const Navbar = ({ user, toggleMobileSidebar }) => {
    return (
        <header className="h-20 flex items-center justify-between px-4 md:px-8 bg-[#0f0f23]/50 backdrop-blur-md border-b border-white/5 sticky top-0 z-30">
            <div className="flex items-center gap-4">
                <button
                    onClick={toggleMobileSidebar}
                    className="md:hidden p-2 hover:bg-white/5 rounded-lg transition-colors"
                >
                    <Menu className="w-6 h-6" />
                </button>
            </div>

            <div className="flex items-center gap-3 md:gap-6">
                {/* Notifications */}
                <button className="relative p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-all">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0f0f23]"></span>
                </button>

                {/* User Profile */}
                <div className="flex items-center gap-3 pl-4 border-l border-white/10 group cursor-pointer">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">
                            {user?.name || 'User'}
                        </p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                            {user?.type || 'Member'}
                        </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 p-[2px]">
                        <div className="w-full h-full rounded-[10px] bg-[#16162d] flex items-center justify-center font-bold text-blue-400 group-hover:bg-transparent group-hover:text-white transition-all">
                            {user?.name?.[0]?.toUpperCase() || <User className="w-5 h-5" />}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
