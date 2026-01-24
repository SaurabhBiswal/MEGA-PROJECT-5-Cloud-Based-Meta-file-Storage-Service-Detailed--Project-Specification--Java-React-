import React, { useState, useEffect } from 'react';
import { X, Edit } from 'lucide-react';
import fileService from '../../services/fileService';

const RenameModal = ({ isOpen, onClose, file, onSuccess }) => {
    const [newName, setNewName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && file) {
            setNewName(file.fileName);
            setError('');
        }
    }, [isOpen, file]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newName.trim()) {
            setError('Name is required');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await fileService.renameFile(file.id, newName);
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data || 'Failed to rename file');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !file) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-[2px] p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-300">
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 rounded-2xl">
                            <Edit className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">Rename</h3>
                            <p className="text-xs text-gray-500 mt-0.5">Enter a new name for the item</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors group">
                        <X className="w-6 h-6 text-gray-400 group-hover:text-gray-600" />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-8">
                    <div className="space-y-4 mb-8">
                        <div>
                            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                File name
                            </label>
                            <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="e.g. Vacation Photo.jpg"
                                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-medium"
                                autoFocus
                            />
                            {error && (
                                <p className="text-xs text-red-500 mt-3 flex items-center gap-1.5 ml-1 font-medium">
                                    <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                                    {error}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || newName === file.fileName}
                            className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-blue-100 active:scale-95"
                        >
                            {loading ? 'Processing...' : 'Ok'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RenameModal;
