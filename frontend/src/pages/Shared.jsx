import React, { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import shareService from '../services/shareService';
import FileCard from '../components/files/FileCard';
import FilePreviewModal from '../components/files/FilePreviewModal';

const Shared = () => {
    const [shares, setShares] = useState([]);
    const [loading, setLoading] = useState(true);
    const [previewFile, setPreviewFile] = useState(null);

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
                                file={share.file}
                                onMenuClick={() => { }}
                                onClick={() => setPreviewFile(share.file)}
                                onShareClick={() => { }}
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
        </div>
    );
};

export default Shared;
