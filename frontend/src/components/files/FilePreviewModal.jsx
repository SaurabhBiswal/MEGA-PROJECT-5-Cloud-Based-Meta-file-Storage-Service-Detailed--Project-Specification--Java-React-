import React, { useEffect, useState } from 'react';
import { X, Download, FileText, Image as ImageIcon, Loader2, Share2, Star, AlertCircle, Maximize2 } from 'lucide-react';
import fileService from '../../services/fileService';

const FilePreviewModal = ({ isOpen, onClose, file, onShare, onStar }) => {
    const [loading, setLoading] = useState(true);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!isOpen || !file) {
            setPreviewUrl(null);
            setError(null);
            setLoading(false);
            return;
        }

        const fetchPreview = async () => {
            setLoading(false); // No longer fetching via axios, just use streamUrl directly
        };

        fetchPreview();

        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [isOpen, file]);

    if (!isOpen || !file) return null;

    const isImage = file.fileType?.startsWith('image/');
    const isPdf = file.fileType === 'application/pdf';
    const isVideo = file.fileType?.startsWith('video/');
    const isPreviewable = isImage || isPdf || isVideo;

    const streamUrl = fileService.getDownloadUrl(file.id);

    const handleDownload = () => {
        try {
            const url = fileService.getDownloadUrl(file.id);
            window.open(url, '_blank');
        } catch (err) {
            console.error("Download failed", err);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a0a0b]/95 backdrop-blur-md animate-in fade-in duration-300">
            <div className="w-full h-full flex flex-col">
                {/* Header Bar */}
                <div className="h-16 px-6 flex items-center justify-between border-b border-white/10 bg-black/40">
                    <div className="flex items-center gap-4 text-white">
                        <div className="p-2 bg-white/10 rounded-lg">
                            {isImage ? <ImageIcon className="w-5 h-5 text-purple-400" /> : isVideo ? <Maximize2 className="w-5 h-5 text-emerald-400" /> : <FileText className="w-5 h-5 text-blue-400" />}
                        </div>
                        <div className="flex flex-col">
                            <h3 className="text-sm font-bold truncate max-w-sm">{file.fileName}</h3>
                            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{file.fileType}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={(e) => { e.stopPropagation(); onStar && onStar(file); }}
                            className={`p-2 rounded-lg transition-colors ${file.isStarred ? 'bg-yellow-500/20 text-yellow-500' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}
                            title="Star"
                        >
                            <Star className={`w-5 h-5 ${file.isStarred ? 'fill-yellow-500' : ''}`} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onShare && onShare(file); }}
                            className="p-2 text-gray-400 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
                            title="Share"
                        >
                            <Share2 className="w-5 h-5" />
                        </button>
                        <div className="w-px h-6 bg-white/10 mx-2"></div>
                        <button
                            onClick={handleDownload}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95"
                        >
                            <Download className="w-4 h-4" />
                            Download
                        </button>
                        <button
                            onClick={onClose}
                            className="ml-4 p-2 text-gray-400 hover:bg-white/10 hover:text-white rounded-full transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 w-full flex items-center justify-center p-8 overflow-hidden relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none"></div>

                    {loading ? (
                        <div className="flex flex-col items-center gap-4 text-white/60">
                            <div className="relative">
                                <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
                                <div className="absolute inset-0 blur-lg bg-blue-500/20"></div>
                            </div>
                            <p className="text-sm font-bold tracking-widest uppercase">Initializing Preview...</p>
                        </div>
                    ) : error ? (
                        <div className="max-w-md w-full p-8 bg-white/5 border border-white/10 rounded-3xl text-center backdrop-blur-xl">
                            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <AlertCircle className="w-8 h-8 text-red-500" />
                            </div>
                            <p className="text-white text-lg font-bold mb-2">{error}</p>
                            <p className="text-gray-400 text-sm mb-8 leading-relaxed">Generated preview failed. You can still download the file.</p>
                            <button onClick={handleDownload} className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-100 transition-colors">
                                Download Anyway
                            </button>
                        </div>
                    ) : !isPreviewable ? (
                        <div className="max-w-md w-full p-8 bg-white/5 border border-white/10 rounded-3xl text-center backdrop-blur-xl animate-in zoom-in duration-500">
                            <div className="w-20 h-20 bg-blue-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
                                <FileText className="w-10 h-10 text-blue-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">No Visual Preview</h2>
                            <p className="text-gray-400 text-sm mb-10 px-4">Browser doesn't support direct preview of this file type.</p>
                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={handleDownload} className="px-6 py-4 bg-white text-black rounded-2xl font-black text-sm hover:scale-[1.02] transition-transform flex items-center justify-center gap-2">
                                    <Download className="w-4 h-4" />
                                    Download
                                </button>
                                <button onClick={() => onShare && onShare(file)} className="px-6 py-4 bg-white/10 text-white rounded-2xl font-black text-sm hover:bg-white/20 transition-all flex items-center justify-center gap-2">
                                    <Share2 className="w-4 h-4" />
                                    Share
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center max-w-5xl animate-in fade-in zoom-in duration-500">
                            {isImage && (
                                <div className="relative group">
                                    <img src={previewUrl || streamUrl} alt={file.fileName} className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/10" />
                                    <div className="absolute inset-0 rounded-2xl ring-1 ring-white/20 pointer-events-none"></div>
                                </div>
                            )}
                            {isVideo && (
                                <div className="w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10 relative group">
                                    <video
                                        src={streamUrl}
                                        controls
                                        autoPlay
                                        className="w-full h-full"
                                    />
                                    <div className="absolute inset-0 rounded-2xl ring-1 ring-white/20 pointer-events-none"></div>
                                </div>
                            )}
                            {isPdf && (
                                <div className="w-full h-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-white/10 p-1">
                                    <iframe src={previewUrl || streamUrl} title={file.fileName} className="w-full h-full rounded-xl border-none" />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FilePreviewModal;
