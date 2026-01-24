import React from 'react';
import { FileText, Image, Film, File, Share2, Star, Globe } from 'lucide-react';
import FileContextMenu from './FileContextMenu';

const FileCard = ({ file, onClick, onShareClick, onDelete, onRename, onStar, onMove }) => {
    const getIcon = (type) => {
        if (type?.startsWith('image')) return <Image className="w-12 h-12 text-indigo-500" />;
        if (type?.startsWith('video')) return <Film className="w-12 h-12 text-rose-500" />;
        if (type?.includes('pdf')) return <FileText className="w-12 h-12 text-emerald-500" />;
        return <File className="w-12 h-12 text-slate-400" />;
    };

    const formatSize = (bytes) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    return (
        <div
            onClick={onClick}
            className="group relative bg-white rounded-[32px] p-6 border border-transparent hover:border-indigo-100 hover:bg-slate-50/50 transition-all duration-300 cursor-pointer hover:shadow-2xl hover:shadow-indigo-100/50 active:scale-[0.98] animate-in fade-in zoom-in duration-500"
        >
            <div className="flex items-start justify-between mb-8">
                <div className="p-4 bg-slate-50 rounded-2xl group-hover:bg-white group-hover:scale-110 transition-all duration-500 shadow-sm border border-slate-100">
                    {getIcon(file.fileType)}
                </div>

                <div className="flex gap-2">
                    {file.publicShareToken && (
                        <div className="h-8 w-8 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-100/50" title="Publicly Shared">
                            <Globe className="w-4 h-4" />
                        </div>
                    )}
                    {file.isStarred && (
                        <div className="h-8 w-8 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center border border-amber-100/50">
                            <Star className="w-4 h-4 fill-current" />
                        </div>
                    )}
                    <FileContextMenu
                        file={file}
                        onDelete={onDelete}
                        onRename={onRename}
                        onStar={onStar}
                        onShare={onShareClick}
                        onOpen={onClick}
                        onMove={onMove}
                    />
                </div>
            </div>

            <div>
                <h3 className="text-sm font-black text-slate-800 truncate mb-1 pr-6 group-hover:text-indigo-600 transition-colors">
                    {file.fileName}
                </h3>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    {formatSize(file.fileSize)}
                </p>
            </div>

            {/* Selection/Hover Overlay (Glass) */}
            <div className="absolute inset-0 rounded-[32px] ring-2 ring-indigo-500/0 group-hover:ring-indigo-500/10 transition-all pointer-events-none"></div>
        </div>
    );
};

export default FileCard;
