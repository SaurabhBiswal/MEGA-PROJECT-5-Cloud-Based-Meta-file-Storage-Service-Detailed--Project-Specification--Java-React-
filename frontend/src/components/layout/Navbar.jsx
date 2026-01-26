import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Bell, Settings, LogOut, User as UserIcon, LogOut as LogoutIcon, UserCircle, Database } from 'lucide-react';

import notificationService from '../../services/notificationService';

const Navbar = ({ onSearch }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const menuRef = useRef(null);

    const fetchNotifications = async () => {
        try {
            const [list, count] = await Promise.all([
                notificationService.getNotifications(),
                notificationService.getUnreadCount()
            ]);
            setNotifications(list);
            setUnreadCount(count.count);
        } catch (err) {
            console.error("Failed to fetch notifications:", err);
        }
    };

    useEffect(() => {
        if (user) fetchNotifications();

        const interval = setInterval(() => {
            if (user) fetchNotifications();
        }, 30000); // Poll every 30s

        return () => clearInterval(interval);
    }, [user]);

    const handleMarkRead = async (id, link) => {
        try {
            await notificationService.markAsRead(id);
            fetchNotifications();
            if (link) navigate(link);
        } catch (err) {
            console.error("Failed to mark read:", err);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsUserMenuOpen(false);
            }
        };
        if (isUserMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isUserMenuOpen]);

    const handleLogout = () => {
        sessionStorage.removeItem('token');
        navigate('/login');
    };

    return (
        <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-10">
            {/* Search Bar */}
            <div className="flex-1 max-w-2xl">
                <div className="relative group">
                    <input
                        type="text"
                        placeholder="Search in Drive..."
                        onChange={(e) => onSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-transparent bg-gray-100 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                    />
                    <Search className="absolute left-4 top-3 w-5 h-5 text-gray-400 group-focus-within:text-blue-500" />
                </div>
            </div>

            {/* User Actions */}
            <div className="flex items-center gap-3 ml-4">
                <div className="relative group">
                    <button className="p-3 text-gray-500 hover:bg-slate-50 hover:text-indigo-600 rounded-2xl transition-all relative" title="Notifications">
                        <Bell className="w-5 h-5" />
                        {unreadCount > 0 && (
                            <span className="absolute top-2.5 right-2.5 w-4 h-4 bg-indigo-500 text-[8px] text-white font-black flex items-center justify-center rounded-full border-2 border-white animate-in zoom-in">
                                {unreadCount}
                            </span>
                        )}
                    </button>

                    {/* Notification Dropdown */}
                    <div className="absolute right-0 mt-3 w-80 bg-white rounded-3xl shadow-2xl border border-gray-100 py-6 px-4 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 z-50">
                        <h4 className="font-black text-gray-900 mb-4 px-2 flex items-center justify-between">
                            Recent Alerts
                            {unreadCount > 0 && <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full uppercase">{unreadCount} New</span>}
                        </h4>
                        <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
                            {notifications.length === 0 ? (
                                <div className="py-8 text-center text-slate-400 text-xs font-bold">No notifications yet.</div>
                            ) : (
                                notifications.map((n) => (
                                    <div
                                        key={n.id}
                                        onClick={() => handleMarkRead(n.id, n.actionLink)}
                                        className={`p-3 rounded-2xl flex gap-3 border transition-all cursor-pointer ${n.read ? 'bg-white border-transparent grayscale' : 'bg-indigo-50/50 border-indigo-100/50 hover:bg-indigo-50'}`}
                                    >
                                        <div className={`h-8 w-8 rounded-xl flex items-center justify-center text-white shrink-0 ${n.type === 'SHARE' ? 'bg-indigo-500' : 'bg-slate-500'}`}>
                                            <Database className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-black text-slate-800">{n.title}</p>
                                            <p className="text-[10px] text-slate-400 font-medium line-clamp-2">{n.message}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="relative ml-2" ref={menuRef}>
                    <button
                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                        className="h-9 w-9 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-md hover:shadow-lg transition-all transform hover:scale-105"
                    >
                        U
                    </button>

                    {isUserMenuOpen && (
                        <div className="absolute right-0 mt-3 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 overflow-hidden animate-in fade-in zoom-in duration-200">
                            <div className="px-6 py-4 flex flex-col items-center border-b border-gray-100 mb-2">
                                <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-2xl mb-2">
                                    U
                                </div>
                                <p className="text-sm font-semibold text-gray-900">Professional User</p>
                                <p className="text-xs text-gray-500 truncate mb-4">{user?.email}</p>
                                <Link
                                    to="/profile"
                                    onClick={() => setIsUserMenuOpen(false)}
                                    className="w-full py-2 border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors text-center"
                                >
                                    Manage your Account
                                </Link>
                            </div>
                            <Link
                                to="/profile"
                                onClick={() => setIsUserMenuOpen(false)}
                                className="w-full flex items-center gap-4 px-6 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                <UserCircle className="w-5 h-5 text-gray-400" />
                                Your profile
                            </Link>
                            <button className="w-full flex items-center gap-4 px-6 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                <Settings className="w-5 h-5 text-gray-400" />
                                Drive Settings
                            </button>
                            <div className="h-px bg-gray-100 my-1"></div>
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-4 px-6 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                                <LogoutIcon className="w-5 h-5" />
                                Sign out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Navbar;
