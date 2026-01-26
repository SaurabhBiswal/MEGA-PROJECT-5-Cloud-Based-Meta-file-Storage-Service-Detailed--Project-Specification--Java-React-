
import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import FolderCard from '../components/files/FolderCard';
import FileCard from '../components/files/FileCard';
import UploadModal from '../components/files/UploadModal';
import FilePreviewModal from '../components/files/FilePreviewModal';
import ShareModal from '../components/files/ShareModal';
import FolderModal from './../components/files/FolderModal';
import RenameModal from './../components/files/RenameModal';
import MoveModal from './../components/files/MoveModal';
import folderService from '../services/folderService';
import fileService from '../services/fileService';
import { Home, ChevronRight, Upload, Plus, FolderPlus, Search, User as UserIcon, Settings, LogOut, CheckCircle, Info } from 'lucide-react';

const Dashboard = () => {
    const [folders, setFolders] = useState([]);
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentFolder, setCurrentFolder] = useState(null);
    const [breadcrumbs, setBreadcrumbs] = useState([{ id: null, name: 'Home' }]);
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [previewFile, setPreviewFile] = useState(null);
    const [shareFile, setShareFile] = useState(null);
    const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
    const [renamingFile, setRenamingFile] = useState(null);
    const [movingFile, setMovingFile] = useState(null);
    const [toast, setToast] = useState(null);
    const [searchQuery] = useOutletContext();

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const folderId = currentFolder?.id || null;

            // Decide which folder API to call
            const folderReq = folderId
                ? folderService.getSubfolders(folderId) // Need to implement/verify this service method handles simple call
                : folderService.getRootFolders();

            const [foldersData, filesData] = await Promise.all([
                folderReq,
                fileService.getMyFiles(folderId)
            ]);

            setFolders(Array.isArray(foldersData) ? foldersData : []);
            setFiles(Array.isArray(filesData) ? filesData : []);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [currentFolder]); // Re-fetch when current folder changes

    const handleFolderClick = (folder) => {
        setCurrentFolder(folder);
        setBreadcrumbs([...breadcrumbs, { id: folder.id, name: folder.name }]);
    };

    const handleBreadcrumbClick = (index) => {
        const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
        setBreadcrumbs(newBreadcrumbs);
        const targetFolderId = newBreadcrumbs[newBreadcrumbs.length - 1].id;
        // If target is Home (id: null), set currentFolder to null
        // If target is a folder, need to reconstruct folder object or just use ID (logic depends on state needs)
        // For simplicity, we just set ID and name in currentFolder or fetch by ID if needed.
        // Better approach: just store necessary info.
        setCurrentFolder(targetFolderId ? { id: targetFolderId, name: newBreadcrumbs[newBreadcrumbs.length - 1].name } : null);
    };

    const handleFileMenu = (file) => {
        console.log('Menu for file:', file.id);
    };

    const handleFolderRename = async (id, newName) => {
        try {
            await folderService.renameFolder(id, newName);
            showToast("Directory renamed successfully");
            fetchData();
        } catch (error) {
            console.error("Folder rename failed:", error);
            showToast("Could not rename directory", 'error');
        }
    };

    const handleFolderDelete = async (id) => {
        if (!window.confirm("Are you sure you want to move this folder to trash?")) return;
        try {
            await folderService.deleteFolder(id);
            showToast("Directory moved to trash");
            fetchData();
        } catch (error) {
            console.error("Folder delete failed:", error);
            showToast("Could not delete directory", 'error');
        }
    };

    const handleDeleteFile = async (file) => {
        if (window.confirm(`Move "${file.fileName}" to trash?`)) {
            try {
                await fileService.deleteFile(file.id);
                showToast(`"${file.fileName}" moved to trash`, 'info');
                fetchData();
            } catch (error) {
                showToast('Failed to delete file', 'error');
            }
        }
    };

    const handleStarFile = async (file) => {
        try {
            await fileService.starFile(file.id);
            showToast(file.isStarred ? 'Removed from Starred' : 'Added to Starred');
            fetchData();
        } catch (error) {
            showToast('Failed to update starred status', 'error');
        }
    };

    const handleUploadSuccess = () => {
        showToast('File uploaded successfully!');
        fetchData();
    };

    const filteredFiles = files.filter(file =>
        file.fileName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredFolders = folders.filter(folder =>
        folder.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading && !currentFolder) { // Only full screen loader on initial load
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div>
            {/* Dashboard Breadcrumbs & Actions */}
            <div className="flex items-center justify-between mb-10">
                <nav className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest bg-white shadow-xl shadow-slate-100/50 px-6 py-3.5 rounded-2xl border border-slate-50">
                    {breadcrumbs.map((item, index) => (
                        <div key={item.id || 'home'} className="flex items-center gap-2">
                            {index > 0 && <ChevronRight className="w-3 h-3 text-slate-300" />}
                            <button
                                onClick={() => handleBreadcrumbClick(index)}
                                className={`hover:text-indigo-600 transition-colors ${index === breadcrumbs.length - 1 ? 'text-slate-800' : ''}`}
                            >
                                {index === 0 && <Home className="w-3.5 h-3.5 mr-1 inline-block -mt-0.5" />}
                                {item.name}
                            </button>
                        </div>
                    ))}
                </nav>

                <div className="flex gap-4">
                    <button
                        onClick={() => setIsFolderModalOpen(true)}
                        className="flex items-center gap-2.5 px-6 py-3 bg-white border border-slate-100 text-slate-700 font-black text-sm rounded-2xl hover:bg-slate-50 hover:shadow-lg transition-all active:scale-95 shadow-sm"
                    >
                        <FolderPlus className="w-4 h-4 text-indigo-500" />
                        New Folder
                    </button>
                    <button
                        onClick={() => setIsUploadOpen(true)}
                        className="btn-primary flex items-center gap-2.5"
                    >
                        <Upload className="w-4 h-4" />
                        Add File
                    </button>
                </div>
            </div>

            <div className="mb-10">
                <h2 className="text-3xl font-black text-slate-800 tracking-tighter">
                    {currentFolder ? currentFolder.name : 'Digital Assets'}
                </h2>
                <div className="h-1 w-12 bg-indigo-500 rounded-full mt-2"></div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 text-slate-400">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                    <p className="text-xs font-black uppercase tracking-widest">Optimizing View...</p>
                </div>
            ) : (
                <>
                    {/* Folders Section */}
                    {(filteredFolders.length > 0) && (
                        <div className="mb-12">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 ml-1">Directories</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                                {filteredFolders.map((folder) => (
                                    <FolderCard
                                        key={folder.id}
                                        folder={folder}
                                        onClick={() => handleFolderClick(folder)}
                                        onRename={(f) => setRenamingFile({ ...f, type: 'folder' })}
                                        onDelete={(f) => handleFolderDelete(f.id)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Files Section */}
                    <div>
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 ml-1">All Assets</h3>
                        {files.length === 0 && folders.length === 0 ? (
                            <div className="text-center py-24 bg-white/50 backdrop-blur-sm rounded-[40px] border-2 border-dashed border-slate-200">
                                <div className="h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Upload className="w-8 h-8 text-slate-300" />
                                </div>
                                <p className="text-slate-500 font-bold">This space is currently empty.</p>
                                <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest">Upload files to get started</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                                {filteredFiles.map((file) => (
                                    <FileCard
                                        key={file.id}
                                        file={file}
                                        onClick={() => setPreviewFile(file)}
                                        onShareClick={(f) => setShareFile(f)}
                                        onDelete={(f) => handleDeleteFile(f)}
                                        onStar={(f) => handleStarFile(f)}
                                        onDownload={(f) => window.open(fileService.getDownloadUrl(f.id), '_blank')}
                                        onRename={(f) => {
                                            const newName = prompt("New name:", f.fileName);
                                            if (newName) fileService.renameFile(f.id, newName).then(() => fetchData());
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Toast System */}
            {toast && (
                <div className="fixed bottom-10 right-10 z-[100] animate-in slide-in-from-bottom-10 fade-in duration-500">
                    <div className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/20 backdrop-blur-xl ${toast.type === 'success' ? 'bg-emerald-500/90 text-white' :
                        toast.type === 'error' ? 'bg-rose-500/90 text-white' :
                            'bg-indigo-600/90 text-white'
                        }`}>
                        <div className="h-6 w-6 bg-white/20 rounded-lg flex items-center justify-center">
                            {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                        </div>
                        <p className="text-sm font-black tracking-tight">{toast.message}</p>
                    </div>
                </div>
            )}

            {/* Modals... (omitted but preserved) */}
            <MoveModal
                isOpen={!!movingFile}
                file={movingFile}
                onClose={() => setMovingFile(null)}
                onSuccess={() => { fetchData(); showToast('Item moved successfully'); }}
            />
            <UploadModal
                isOpen={isUploadOpen}
                onClose={() => setIsUploadOpen(false)}
                folderId={currentFolder?.id}
                onUploadSuccess={handleUploadSuccess}
            />
            <FilePreviewModal
                isOpen={!!previewFile}
                file={previewFile}
                onClose={() => setPreviewFile(null)}
                onShare={(file) => { setPreviewFile(null); setShareFile(file); }}
                onStar={handleStarFile}
            />
            <ShareModal
                isOpen={!!shareFile}
                file={files.find(f => f.id === shareFile?.id) || shareFile}
                onClose={() => setShareFile(null)}
                onSuccess={() => fetchData()}
            />
            <FolderModal
                isOpen={isFolderModalOpen}
                onClose={() => setIsFolderModalOpen(false)}
                parentFolderId={currentFolder?.id || null}
                onSuccess={() => { fetchData(); showToast('Folder created'); }}
            />
            <RenameModal
                isOpen={!!renamingFile}
                file={renamingFile}
                onClose={() => setRenamingFile(null)}
                onRename={renamingFile?.type === 'folder'
                    ? (id, name) => folderService.renameFolder(id, name)
                    : (id, name) => fileService.renameFile(id, name)
                }
                onSuccess={() => { fetchData(); showToast('Item renamed'); }}
            />
        </div>
    );
};

export default Dashboard;
