import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import fileService from '../services/fileService';
import FileCard from '../components/files/FileCard';
import FilePreviewModal from '../components/files/FilePreviewModal';
import ShareModal from '../components/files/ShareModal';

const Recent = () => {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [previewFile, setPreviewFile] = useState(null);
    const [shareFile, setShareFile] = useState(null);

    useEffect(() => {
        fetchRecentFiles();
    }, []);

    const fetchRecentFiles = async () => {
        try {
            const data = await fileService.getMyFiles();
            // Sort by createdAt descending (most recent first)
            const sorted = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setFiles(sorted.slice(0, 20)); // Show last 20 files
        } catch (error) {
            console.error('Failed to load recent files:', error);
        } finally {
            setLoading(false);
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
                            onMenuClick={() => { }}
                            onClick={() => setPreviewFile(file)}
                            onShareClick={() => setShareFile(file)}
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
            />
        </div>
    );
};

export default Recent;
