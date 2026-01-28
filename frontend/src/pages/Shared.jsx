import React, { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import shareService from '../services/shareService';
import fileService from '../services/fileService';
import FileCard from '../components/files/FileCard';
import FilePreviewModal from '../components/files/FilePreviewModal';
import ShareModal from '../components/files/ShareModal';
import RenameModal from '../components/files/RenameModal';

const Shared = () => {
    const [shares, setShares] = useState([]);
    const [loading, setLoading] = useState(true);
    const [previewFile, setPreviewFile] = useState(null);
    const [shareFile, setShareFile] = useState(null);
    const [renamingFile, setRenamingFile] = useState(null);

    useEffect(() => {
        fetchSharedFiles();
    }, []);

    const fetchSharedFiles = async () => {
        try {
            const data = await shareService.getSharedWithMe();
            setShares(data);
        } catch (error) {
            console.error('Failed to load shared files:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStar = async (id) => {
        try {
            await fileService.starFile(id);
            fetchSharedFiles();
        } catch (error) {
            console.error('Failed to star file:', error);
        }
    };

    const handleDownload = async (file) => {
        try {
            const url = fileService.getDownloadUrl(file.id);
            window.open(url, '_blank');
        } catch (error) {
            console.error('Failed to download file:', error);
        }
    };

    const handleDelete = async (id) => {
        try {
            await fileService.deleteFile(id);
            fetchSharedFiles();
        } catch (error) {
            console.error('Failed to delete file:', error);
            alert("You might not have permission to delete this shared file.");
        }
    };

    const handleRename = async (id) => {
        const newName = prompt("Enter new filename:");
        if (!newName) return;
        try {
            await fileService.renameFile(id, newName);
            fetchSharedFiles();
        } catch (error) {
            console.error('Failed to rename:', error);
        }
    };

    const handleMove = (file) => {
        // For MVP, move logic is more complex for shared files, but we can prompt
        alert("Moving shared files to personal folders is a Phase 2 feature.");
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <Users className="w-6 h-6 text-gray-600" />
                    <h1 className="text-2xl font-bold text-gray-800">Shared with me</h1>
                </div>
                <p className="text-gray-500">Files others have shared with you</p>
            </div>

            {shares.length === 0 ? (
                <div className="text-center py-12">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No files shared with you yet</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {shares.map((share) => (
                        <div key={share.id} className="relative">
                            <FileCard
                                file={{ ...share.file, isStarred: share.isStarred }}
                                onClick={() => setPreviewFile(share.file)}
                                onStar={(f) => handleStar(f.id)}
                                onDelete={(f) => handleDelete(f.id)}
                                onDownload={(f) => window.open(fileService.getDownloadUrl(f.id), '_blank')}
                                onRename={share.permission === 'EDITOR' ? (f) => setRenamingFile(f) : undefined}
                                onShareClick={(f) => setShareFile(f)}
                                onMove={undefined} // Move not supported for shared files in MVP
                            />
                            <div className="absolute top-2 right-2 bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
                                {share.permission === 'VIEWER' ? 'View only' : 'Can edit'}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <FilePreviewModal
                isOpen={!!previewFile}
                file={previewFile}
                onClose={() => setPreviewFile(null)}
            />

            <ShareModal
                isOpen={!!shareFile}
                file={shareFile}
                onClose={() => setShareFile(null)}
                onSuccess={fetchSharedFiles}
            />

            <RenameModal
                isOpen={!!renamingFile}
                file={renamingFile}
                onClose={() => setRenamingFile(null)}
                onSuccess={fetchSharedFiles}
            />
        </div>
    );
};

export default Shared;
