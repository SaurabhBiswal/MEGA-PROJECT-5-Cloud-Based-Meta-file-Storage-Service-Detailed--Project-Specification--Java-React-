import React, { useEffect, useState } from 'react';
import { Trash2, RotateCcw, Trash } from 'lucide-react';
import fileService from '../services/fileService';
import FileCard from '../components/files/FileCard';

const TrashPage = () => {
    const [trashedFiles, setTrashedFiles] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTrashedFiles();
    }, []);

    const fetchTrashedFiles = async () => {
        try {
            // TODO: Create backend endpoint for trashed files
            // For now, filter from all files
            const allFiles = await fileService.getMyFiles();
            const trashed = allFiles.filter(f => f.isTrashed);
            setTrashedFiles(trashed);
        } catch (error) {
            console.error('Failed to load trash:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (fileId) => {
        try {
            // TODO: Create restore endpoint
            console.log('Restore file:', fileId);
            await fetchTrashedFiles();
        } catch (error) {
            console.error('Failed to restore file:', error);
        }
    };

    const handlePermanentDelete = async (fileId) => {
        if (!confirm('Permanently delete this file? This cannot be undone.')) return;

        try {
            await fileService.deleteFile(fileId);
            await fetchTrashedFiles();
        } catch (error) {
            console.error('Failed to delete file:', error);
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
                    <Trash2 className="w-6 h-6 text-gray-600" />
                    <h1 className="text-2xl font-bold text-gray-800">Trash</h1>
                </div>
                <p className="text-gray-500">Files in trash will be automatically deleted after 30 days</p>
            </div>

            {trashedFiles.length === 0 ? (
                <div className="text-center py-12">
                    <Trash2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Trash is empty</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {trashedFiles.map((file) => (
                        <div key={file.id} className="relative group">
                            <FileCard
                                file={file}
                                onMenuClick={() => { }}
                                onClick={() => { }}
                                onShareClick={() => { }}
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button
                                    onClick={() => handleRestore(file.id)}
                                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                                    title="Restore"
                                >
                                    <RotateCcw className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => handlePermanentDelete(file.id)}
                                    className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                                    title="Delete forever"
                                >
                                    <Trash className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TrashPage;
