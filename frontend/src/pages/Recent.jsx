import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import fileService from '../services/fileService';
import FileCard from '../components/files/FileCard';
import FilePreviewModal from '../components/files/FilePreviewModal';
import ShareModal from '../components/files/ShareModal';
import RenameModal from '../components/files/RenameModal';

const Recent = () => {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [previewFile, setPreviewFile] = useState(null);
    const [shareFile, setShareFile] = useState(null);
    const [renamingFile, setRenamingFile] = useState(null);

    useEffect(() => {
        fetchRecentFiles();
    }, []);

    const fetchRecentFiles = async () => {
        try {
            const data = await fileService.getRecentFiles();
            setFiles(data);
        } catch (error) {
            console.error('Failed to load recent files:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (file) => {
        if (window.confirm(`Move "${file.fileName}" to trash?`)) {
            try {
                await fileService.deleteFile(file.id);
                fetchRecentFiles();
            } catch (error) {
                console.error('Failed to delete:', error);
            }
        }
    };

    const handleStar = async (file) => {
        try {
            await fileService.starFile(file.id);
            fetchRecentFiles();
        } catch (error) {
            console.error('Failed to star:', error);
        }
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
                    <Clock className="w-6 h-6 text-gray-600" />
                    <h1 className="text-2xl font-bold text-gray-800">Recent</h1>
                </div>
                <p className="text-gray-500">Files you've recently uploaded or modified</p>
            </div>

            {files.length === 0 ? (
                <div className="text-center py-12">
                    <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No recent files</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {files.map((file) => (
                        <FileCard
                            key={file.id}
                            file={file}
                            onClick={() => setPreviewFile(file)}
                            onShareClick={(f) => setShareFile(f)}
                            onDelete={(f) => handleDelete(f)}
                            onStar={(f) => handleStar(f)}
                            onDownload={(f) => window.open(fileService.getDownloadUrl(f.id), '_blank')}
                            onRename={(f) => {
                                const newName = prompt("New name:", f.fileName);
                                if (newName) fileService.renameFile(f.id, newName).then(() => fetchRecentFiles());
                            }}
                        />
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
                onSuccess={fetchRecentFiles}
            />

            <RenameModal
                isOpen={!!renamingFile}
                file={renamingFile}
                onClose={() => setRenamingFile(null)}
                onSuccess={fetchRecentFiles}
            />
        </div>
    );
};

export default Recent;
