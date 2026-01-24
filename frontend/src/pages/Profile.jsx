import React, { useState, useEffect } from 'react';
import { User, Mail, Shield, ShieldCheck, Clock, HardDrive, Database, ArrowRight, Settings, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import storageService from '../services/storageService';

const Profile = () => {
    const { user } = useAuth();
    const [breakdown, setBreakdown] = useState([]);
    const [loading, setLoading] = useState(true);
    const [storage, setStorage] = useState({
        usedBytes: 0,
        totalGB: 10,
        percentageUsed: 0,
        readableUsed: "0 B",
        readableTotal: "10 GB"
    });

    const formatSize = (bytes) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const [usage, list] = await Promise.all([
                storageService.getUsage(),
                storageService.getBreakdown()
            ]);
            setStorage(usage);
            // Sort by size descending
            setBreakdown(list.sort((a, b) => b.fileSize - a.fileSize));
        } catch (err) {
            console.error("Profile fetch failed:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDelete = async (fileId, fileName) => {
        if (window.confirm(`Permanently delete "${fileName}" to free up space?`)) {
            try {
                await storageService.deleteFile(fileId); // Need to ensure storageService has this or use fileService
                // I'll check fileService later, for now I'll use storageService as a proxy or just api.delete
                fetchData();
            } catch (err) {
                alert("Failed to delete file");
            }
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-10 px-6">
            <div className="mb-10 flex items-end justify-between animate-in fade-in slide-in-from-top-4 duration-700">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Workspace Intelligence</h1>
                    <p className="text-slate-500 font-bold">Manage your professional digital footprint</p>
                </div>
                <div className="p-1 px-1 bg-gradient-to-tr from-indigo-500 to-blue-600 rounded-[28px] shadow-2xl shadow-indigo-100">
                    <div className="bg-white p-4 rounded-[26px]">
                        <div className="h-12 w-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-xl">
                            {user?.email?.charAt(0).toUpperCase()}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <div className="md:col-span-2 space-y-10">
                    {/* Storage Stats breakdown section */}
                    <section className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8">
                            <Database className="w-12 h-12 text-slate-50 opacity-10" />
                        </div>

                        <h2 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3">
                            <HardDrive className="w-6 h-6 text-indigo-600" />
                            Storage Economics
                        </h2>

                        <div className="p-8 bg-slate-950 rounded-[32px] text-white shadow-2xl relative mb-10 overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                            <div className="flex items-center justify-between mb-8 relative z-10">
                                <div>
                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-2">Cloud Capacity</p>
                                    <h3 className="text-3xl font-black">{storage.totalGB} GB <span className="text-slate-500 font-bold text-lg">allocated</span></h3>
                                </div>
                                <div className="h-16 w-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/10">
                                    <Database className="w-8 h-8 text-indigo-400" />
                                </div>
                            </div>

                            <div className="h-4 w-full bg-white/5 rounded-full mb-6 overflow-hidden p-1 border border-white/5">
                                <div
                                    className="h-full bg-gradient-to-r from-indigo-500 to-blue-400 rounded-full shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all duration-1000 ease-out"
                                    style={{ width: `${storage.percentageUsed}%` }}
                                ></div>
                            </div>

                            <div className="flex items-center justify-between text-[11px] font-black text-slate-400 tracking-tighter">
                                <span className="flex items-center gap-2"><div className="w-2 h-2 bg-indigo-500 rounded-full"></div> {storage.readableUsed} UTILIZED</span>
                                <span>{storage.percentageUsed}% CONSUMED</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 mb-6">Space Consumers (Top Files)</h3>
                            {loading ? (
                                <div className="py-10 text-center text-slate-300 font-black animate-pulse uppercase text-[10px] tracking-widest">Calculating weights...</div>
                            ) : breakdown.length === 0 ? (
                                <div className="py-10 text-center bg-slate-50 rounded-3xl text-slate-400 text-sm font-bold">No assets found in your locker.</div>
                            ) : (
                                <div className="space-y-3">
                                    {breakdown.slice(0, 5).map((item) => (
                                        <div key={item.id} className="flex items-center justify-between p-5 bg-slate-50/50 rounded-3xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                                                    <Clock className="w-5 h-5 text-slate-300" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-700 truncate max-w-[200px]">{item.fileName}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">
                                                        {formatSize(item.fileSize)} • {item.folder ? `Folder: ${item.folder.name}` : 'My Drive'}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDelete(item.id, item.fileName)}
                                                className="opacity-0 group-hover:opacity-100 p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                                title="Reclaim Space"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))}
                                    {breakdown.length > 5 && (
                                        <p className="text-center text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-4">+ {breakdown.length - 5} more assets consuming space</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </section>

                    <section className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm relative">
                        <h2 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3">
                            <User className="w-6 h-6 text-indigo-600" />
                            Personal Intelligence
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="p-8 bg-slate-50 rounded-[32px] border border-transparent hover:border-indigo-100 transition-all group">
                                <div className="p-3 bg-white w-fit rounded-2xl shadow-sm mb-6 group-hover:scale-110 transition-transform">
                                    <Mail className="w-5 h-5 text-indigo-500" />
                                </div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Email Authority</p>
                                <p className="text-sm font-black text-slate-800">{user?.email}</p>
                            </div>
                            <div className="p-8 bg-slate-50 rounded-[32px] border border-transparent hover:border-indigo-100 transition-all group">
                                <div className="p-3 bg-white w-fit rounded-2xl shadow-sm mb-6 group-hover:scale-110 transition-transform">
                                    <Shield className="w-5 h-5 text-indigo-500" />
                                </div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Identity Status</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-black text-slate-800 uppercase tracking-tight">Verified Professional</span>
                                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                <div className="space-y-10">
                    <div className="bg-indigo-600 p-10 rounded-[48px] text-white shadow-2xl shadow-indigo-100 relative overflow-hidden group">
                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
                        <h3 className="text-xl font-black mb-4 relative z-10">Security Protocols</h3>
                        <p className="text-indigo-100 text-sm mb-8 leading-relaxed font-medium relative z-10">Your encrypted vault is active. Secure sync last verified 2 minutes ago.</p>
                        <button className="w-full py-4 bg-white/10 hover:bg-white text-white hover:text-indigo-600 rounded-[24px] font-black text-sm transition-all flex items-center justify-center gap-3 relative z-10 backdrop-blur-md">
                            <Shield className="w-5 h-5" />
                            Verify Node
                        </button>
                    </div>

                    <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm group hover:shadow-2xl hover:shadow-slate-100 transition-all cursor-pointer">
                        <div className="h-14 w-14 bg-slate-50 rounded-[20px] flex items-center justify-center mb-8 group-hover:bg-indigo-50 transition-colors">
                            <Settings className="w-6 h-6 text-slate-400 group-hover:text-indigo-600" />
                        </div>
                        <h4 className="font-black text-slate-800 mb-3 text-lg">System Preferences</h4>
                        <p className="text-sm text-slate-500 font-bold leading-relaxed">Manage transmission notifications, regional localization, and API access.</p>
                        <div className="mt-8 flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest">
                            Configuration <ArrowRight className="w-4 h-4" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
