import React, { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import fileService from '../services/fileService';
import FileCard from '../components/files/FileCard';
import FilePreviewModal from '../components/files/FilePreviewModal';
import ShareModal from '../components/files/ShareModal';
import RenameModal from '../components/files/RenameModal';

const Starred = () => {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [previewFile, setPreviewFile] = useState(null);
    const [shareFile, setShareFile] = useState(null);
    const [renamingFile, setRenamingFile] = useState(null);
    const [searchQuery] = useOutletContext();

    useEffect(() => {
        fetchStarredFiles();
    }, []);

    const fetchStarredFiles = async () => {
        try {
            const data = await fileService.getStarredFiles();
            setFiles(data);
        } catch (error) {
            console.error('Failed to load starred files:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteFile = async (file) => {
        if (window.confirm(`Move "${file.fileName}" to trash?`)) {
            try {
                await fileService.deleteFile(file.id);
                fetchStarredFiles();
            } catch (error) {
                alert('Failed to delete file');
            }
        }
    };

    const handleStarFile = async (file) => {
        try {
            await fileService.starFile(file.id);
            fetchStarredFiles();
        } catch (error) {
            console.error('Failed to star file:', error);
        }
    };

    const filteredFiles = files.filter(file =>
        file.fileName.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                    <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                    <h1 className="text-2xl font-bold text-gray-800">Starred</h1>
                </div>
                <p className="text-gray-500">Files you've marked as important</p>
            </div>

            {filteredFiles.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
                    <Star className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-500">No starred files yet</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {filteredFiles.map((file) => (
                        <FileCard
                            key={file.id}
                            file={file}
                            onClick={() => setPreviewFile(file)}
                            onShareClick={() => setShareFile(file)}
                            onDelete={() => handleDeleteFile(file)}
                            onRename={() => setRenamingFile(file)}
                            onStar={() => handleStarFile(file)}
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

            <RenameModal
                isOpen={!!renamingFile}
                file={renamingFile}
                onClose={() => setRenamingFile(null)}
                onSuccess={fetchStarredFiles}
            />
        </div>
    );
};

export default Starred;
