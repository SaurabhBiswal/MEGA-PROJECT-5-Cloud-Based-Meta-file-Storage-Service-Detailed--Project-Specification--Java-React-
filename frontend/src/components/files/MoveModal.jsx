import React, { useState, useEffect } from 'react';
import { X, FolderPlus, Folder, ChevronRight, Loader2, FolderInput } from 'lucide-react';
import folderService from '../../services/folderService';
import fileService from '../../services/fileService';

const MoveModal = ({ isOpen, onClose, file, onSuccess }) => {
    const [folders, setFolders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [moving, setMoving] = useState(false);
    const [currentPath, setCurrentPath] = useState([{ id: null, name: 'My Drive' }]);
    const [error, setError] = useState('');

    const fetchFolders = async (parentId) => {
        setLoading(true);
        try {
            const data = parentId
                ? await folderService.getSubfolders(parentId)
                : await folderService.getRootFolders();
            setFolders(data);
        } catch (err) {
            console.error('Failed to fetch folders', err);
            setError('Failed to load folders');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchFolders(null);
            setCurrentPath([{ id: null, name: 'My Drive' }]);
        }
    }, [isOpen]);

    const handleNavigate = (folder) => {
        setCurrentPath([...currentPath, folder]);
        fetchFolders(folder.id);
    };

    const handleBack = (index) => {
        const newPath = currentPath.slice(0, index + 1);
        setCurrentPath(newPath);
        fetchFolders(newPath[newPath.length - 1].id);
    };

    const handleMove = async () => {
        setMoving(true);
        setError('');
        try {
            const targetFolderId = currentPath[currentPath.length - 1].id;
            await fileService.moveFile(file.id, targetFolderId);
            onSuccess();
            onClose();
        } catch (err) {
            setError('Failed to move item');
        } finally {
            setMoving(false);
        }
    };

    if (!isOpen || !file) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-[2px] p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-300">
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-50 rounded-2xl">
                            <FolderInput className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">Move item</h3>
                            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[250px]">Select target for "{file.fileName}"</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors group">
                        <X className="w-6 h-6 text-gray-400 group-hover:text-gray-600" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8">
                    {/* Breadcrumbs */}
                    <nav className="flex items-center gap-1 text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-6 overflow-x-auto whitespace-nowrap pb-2">
                        {currentPath.map((item, index) => (
                            <React.Fragment key={item.id || 'root'}>
                                <button
                                    onClick={() => handleBack(index)}
                                    className={`hover:text-blue-600 transition-colors ${index === currentPath.length - 1 ? 'text-gray-900' : ''}`}
                                >
                                    {item.name}
                                </button>
                                {index < currentPath.length - 1 && <ChevronRight className="w-3 h-3 text-gray-300" />}
                            </React.Fragment>
                        ))}
                    </nav>

                    <div className="bg-gray-50 rounded-2xl border border-gray-100 h-64 overflow-y-auto custom-scrollbar p-2">
                        {loading ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-3">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                                <p className="text-xs font-bold uppercase tracking-widest">Loading locations...</p>
                            </div>
                        ) : folders.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                <Folder className="w-10 h-10 mb-2 opacity-20" />
                                <p className="text-xs font-bold uppercase tracking-widest text-center px-8">No subfolders here</p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {folders.map((folder) => (
                                    <button
                                        key={folder.id}
                                        onClick={() => handleNavigate(folder)}
                                        className="w-full flex items-center justify-between p-4 hover:bg-white rounded-xl transition-all hover:shadow-sm border border-transparent hover:border-gray-100 group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Folder className="w-5 h-5 text-purple-400 group-hover:text-purple-600 transition-colors" />
                                            <span className="text-sm font-bold text-gray-700 tracking-tight">{folder.name}</span>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {error && <p className="text-xs text-red-500 mt-4 text-center font-bold uppercase tracking-widest">{error}</p>}
                </div>

                {/* Footer */}
                <div className="px-8 py-5 border-t border-gray-50 bg-gray-50/50 flex items-center justify-between">
                    <p className="text-[10px] font-bold text-gray-400 max-w-[200px] truncate">
                        Move to: <span className="text-gray-700">{currentPath[currentPath.length - 1].name}</span>
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleMove}
                            disabled={moving || (file.folder?.id === currentPath[currentPath.length - 1].id)}
                            className="px-8 py-2.5 bg-gray-900 hover:bg-black text-white font-bold rounded-xl transition-all disabled:opacity-50 shadow-lg active:scale-95"
                        >
                            {moving ? 'Moving...' : 'Move here'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MoveModal;
