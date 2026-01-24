import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Folder, Star, Clock, Users, Trash2, Database } from 'lucide-react';
import storageService from '../../services/storageService';

const Sidebar = () => {
    const [storage, setStorage] = useState({
        usedBytes: 0,
        totalGB: 10,
        usedGB: "0.00",
        percentageUsed: 0
    });

    useEffect(() => {
        const fetchStorage = async () => {
            try {
                const data = await storageService.getUsage();
                setStorage(data);
            } catch (error) {
                console.error("Failed to fetch storage usage:", error);
            }
        };

        fetchStorage();
        const interval = setInterval(fetchStorage, 30000);
        return () => clearInterval(interval);
    }, []);

    const navItems = [
        { name: 'My Drive', path: '/dashboard', icon: <Folder className="w-5 h-5" /> },
        { name: 'Starred', path: '/starred', icon: <Star className="w-5 h-5" /> },
        { name: 'Recent', path: '/recent', icon: <Clock className="w-5 h-5" /> },
        { name: 'Shared', path: '/shared', icon: <Users className="w-5 h-5" /> },
        { name: 'Trash', path: '/trash', icon: <Trash2 className="w-5 h-5" /> },
    ];

    return (
        <div className="w-72 bg-white border-r border-slate-100 h-screen flex flex-col relative z-20 shadow-xl shadow-slate-200/20">
            <div className="p-8 mb-4">
                <div className="flex items-center gap-3 group cursor-pointer">
                    <div className="h-10 w-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100 group-hover:rotate-6 transition-transform">
                        <Database className="w-6 h-6" />
                    </div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tighter">
                        CloudBox
                    </h1>
                </div>
            </div>

            <nav className="flex-1 px-6 space-y-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === '/dashboard'}
                        className={({ isActive }) =>
                            `flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-300 group ${isActive
                                ? 'bg-indigo-50 text-indigo-600 font-black shadow-sm'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-bold'
                            }`
                        }
                    >
                        <span className="transition-transform group-hover:scale-110">{item.icon}</span>
                        <span className="text-sm tracking-tight">{item.name}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-gray-200">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-500 mb-2">Storage</p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(37,99,235,0.3)]"
                            style={{ width: `${storage.percentageUsed}%` }}
                        ></div>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                        <span>{storage.readableUsed || "0 B"}</span>
                        <span>{storage.readableTotal || "10 GB"}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
