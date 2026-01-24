import React, { useState, useEffect } from 'react';
import { X, Share2, UserPlus, Trash2, Mail, Shield, Link, Copy, Check, Globe, AlertCircle, ArrowRight } from 'lucide-react';
import shareService from '../../services/shareService';
import fileService from '../../services/fileService';

const ShareModal = ({ isOpen, onClose, file, onSuccess }) => {
    const [email, setEmail] = useState('');
    const [shareMethod, setShareMethod] = useState('cloud'); // 'cloud', 'gmail'
    const [permission, setPermission] = useState('VIEWER');
    const [shares, setShares] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);
    const [publicToken, setPublicToken] = useState(file?.publicShareToken || null);
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        if (isOpen && file) {
            fetchShares();
            setPublicToken(file.publicShareToken);
        }
    }, [isOpen, file]);

    const fetchShares = async () => {
        try {
            const data = await shareService.getFileShares(file.id);
            setShares(data);
        } catch (err) {
            console.error('Failed to fetch shares', err);
        }
    };

    const handleShare = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');
        setLoading(true);

        try {
            // shareService handles both cloud and external notify
            const response = await shareService.shareFile(file.id, email, permission);
            setEmail('');

            if (response?.external) {
                setSuccessMsg(`CloudBox mailed a secure access link to ${email} via Gmail! 📧`);
                if (response.token) {
                    setPublicToken(response.token);
                }
            } else {
                setSuccessMsg(`Access granted to ${email} within CloudBox! 🤝`);
            }

            if (onSuccess) onSuccess();
            setTimeout(() => setSuccessMsg(''), 6000);
            await fetchShares();
        } catch (err) {
            setError(err.response?.data || 'Share operation failed');
        } finally {
            setLoading(false);
        }
    };

    const handleGeneratePublicLink = async () => {
        try {
            const response = await fileService.generatePublicLink(file.id);
            setPublicToken(response.token);
        } catch (err) {
            console.error('Failed to generate public link', err);
        }
    };

    const copyToClipboard = () => {
        const shareUrl = `${window.location.origin}/public-view/${publicToken || file.publicShareToken}`;
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isOpen || !file) return null;

    const effectiveToken = publicToken || file.publicShareToken;
    const shareUrl = effectiveToken ? `${window.location.origin}/public-view/${effectiveToken}` : 'Link not generated';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 overflow-y-auto">
            <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-500 my-8">
                {/* Header */}
                <div className="px-10 py-8 bg-slate-50 border-b border-white flex items-center justify-between">
                    <div className="flex items-center gap-5">
                        <div className="h-14 w-14 bg-indigo-600 rounded-[22px] flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                            <Share2 className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Channel Share</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Multi-modal Distribution Hub</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 bg-white hover:bg-slate-100 border border-slate-100 text-slate-400 hover:text-slate-900 rounded-2xl transition-all shadow-sm">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-10 space-y-10">
                    {/* Method 1 & 2: Person Invitations */}
                    <section>
                        <div className="flex items-center justify-between mb-6">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <UserPlus className="w-4 h-4 text-indigo-500" />
                                Invite via Cloud or Gmail
                            </h4>
                        </div>

                        <form onSubmit={handleShare} className="space-y-6">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1 relative group">
                                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="recipient@gmail.com"
                                        className="w-full pl-14 pr-5 py-4 bg-slate-50 border border-transparent focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 rounded-2xl transition-all text-sm font-bold text-slate-700 placeholder:text-slate-300"
                                        required
                                    />
                                </div>
                                <div className="relative">
                                    <Shield className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <select
                                        value={permission}
                                        onChange={(e) => setPermission(e.target.value)}
                                        className="pl-12 pr-10 py-4 bg-slate-50 border border-transparent hover:border-slate-200 rounded-2xl transition-all text-xs font-black text-slate-500 appearance-none min-w-[140px] uppercase tracking-widest focus:outline-none"
                                    >
                                        <option value="VIEWER">Viewer</option>
                                        <option value="EDITOR">Editor</option>
                                    </select>
                                </div>
                            </div>

                            {error && (
                                <div className="p-5 bg-rose-50 rounded-3xl border border-rose-100 flex gap-4 animate-in slide-in-from-top-2 duration-300">
                                    <AlertCircle className="w-6 h-6 text-rose-500 shrink-0" />
                                    <p className="text-sm text-rose-700 font-bold leading-relaxed">{error}</p>
                                </div>
                            )}

                            {successMsg && (
                                <div className="p-5 bg-emerald-50 rounded-3xl border border-emerald-100 flex gap-4 animate-in slide-in-from-top-2 duration-300">
                                    <Check className="w-6 h-6 text-emerald-500 shrink-0" />
                                    <p className="text-sm text-emerald-700 font-bold leading-relaxed">{successMsg}</p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-5 bg-slate-900 hover:bg-black text-white font-black text-sm uppercase tracking-widest rounded-3xl transition-all disabled:opacity-50 shadow-xl active:scale-[0.98] flex items-center justify-center gap-3"
                            >
                                {loading ? 'Initializing Channels...' : 'Transmit Invitation'}
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </form>
                    </section>

                    <div className="h-px bg-slate-100 w-full"></div>

                    {/* Method 3: Public Link */}
                    <section>
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-6">
                            <Globe className="w-4 h-4 text-emerald-500" />
                            Direct Public Link
                        </h4>

                        <div className="flex gap-4">
                            <div className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 flex items-center gap-4 group hover:bg-white hover:border-indigo-200 transition-all">
                                <Link className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                                <input
                                    readOnly
                                    value={shareUrl}
                                    className="bg-transparent text-sm font-bold text-slate-600 w-full outline-none select-all"
                                />
                            </div>
                            {!effectiveToken ? (
                                <button
                                    onClick={handleGeneratePublicLink}
                                    className="flex items-center gap-3 px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95"
                                >
                                    <Globe className="w-4 h-4" />
                                    Create Link
                                </button>
                            ) : (
                                <button
                                    onClick={copyToClipboard}
                                    className={`flex items-center gap-3 px-8 p-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-sm border ${copied
                                        ? 'bg-emerald-500 border-emerald-500 text-white'
                                        : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-500 hover:text-indigo-600'
                                        }`}
                                >
                                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    {copied ? 'Copied' : 'Copy'}
                                </button>
                            )}
                        </div>
                    </section>

                    {shares.length > 0 && (
                        <div className="mt-10">
                            <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">People with access</h4>
                            <div className="space-y-3">
                                {shares.map((share) => (
                                    <div
                                        key={share.id}
                                        className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-gray-200 transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 bg-white rounded-full flex items-center justify-center border border-gray-100 font-bold text-gray-600 text-xs shadow-sm">
                                                {share.sharedWith?.email?.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900 truncate max-w-[200px]">
                                                    {share.sharedWith?.email}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {share.permission === 'VIEWER' ? 'Viewer' : 'Editor'}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRevoke(share.id)}
                                            className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded-lg text-red-500 transition-all"
                                            title="Revoke access"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-8 py-5 border-t border-gray-50 bg-gray-50/50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-8 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ShareModal;
