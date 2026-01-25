import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Download, Edit, Trash2, Star, Share2, FolderInput, Eye, Link } from 'lucide-react';

const FileContextMenu = ({ file, onDelete, onRename, onStar, onShare, onOpen, onMove }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleDownload = (e) => {
        e.stopPropagation();
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
        window.open(`${baseUrl}/files/${file.id}/download`, '_blank');
        setIsOpen(false);
    };

    const menuItems = [
        { icon: Eye, label: 'Open', onClick: (e) => { e.stopPropagation(); onOpen(file); setIsOpen(false); } },
        { icon: Share2, label: 'Share', onClick: (e) => { e.stopPropagation(); onShare(file); setIsOpen(false); } },
        { icon: Star, label: file.isStarred ? 'Remove star' : 'Add star', onClick: (e) => { e.stopPropagation(); onStar(file); setIsOpen(false); }, active: file.isStarred },
        { icon: FolderInput, label: 'Move to', onClick: (e) => { e.stopPropagation(); onMove(file); setIsOpen(false); } },
        { icon: Edit, label: 'Rename', onClick: (e) => { e.stopPropagation(); onRename(file); setIsOpen(false); } },
        { icon: Download, label: 'Download', onClick: handleDownload },
        { icon: Trash2, label: 'Move to trash', onClick: (e) => { e.stopPropagation(); onDelete(file); setIsOpen(false); }, danger: true },
    ];

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors flex items-center justify-center"
                title="More actions"
            >
                <MoreVertical className="w-5 h-5 text-gray-500" />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-[60] animate-in fade-in zoom-in duration-200">
                    <div className="px-4 py-2 border-b border-gray-50 mb-1">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">File Management</p>
                    </div>
                    {menuItems.map((item, index) => (
                        <button
                            key={index}
                            onClick={item.onClick}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all ${item.danger
                                ? 'text-red-500 hover:bg-red-50'
                                : item.active
                                    ? 'text-blue-600 bg-blue-50 font-medium'
                                    : 'text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <item.icon className={`w-4 h-4 ${item.active ? 'fill-blue-600' : ''}`} />
                            {item.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FileContextMenu;
