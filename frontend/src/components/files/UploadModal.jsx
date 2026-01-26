import React, { useState, useRef } from 'react';
import { Upload, X, File } from 'lucide-react';
import fileService from '../../services/fileService';

const UploadModal = ({ isOpen, onClose, folderId, onUploadSuccess }) => {
    const [dragActive, setDragActive] = useState(false);
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef(null);

    if (!isOpen) return null;

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFiles(e.dataTransfer.files);
        }
    };

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFiles(e.target.files);
        }
    };

    const handleFiles = (fileList) => {
        const newFiles = Array.from(fileList).map(file => ({
            file,
            name: file.name,
            size: file.size,
            status: 'pending' // pending, uploading, success, error
        }));
        setFiles(prev => [...prev, ...newFiles]);
    };

    const formatSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleUpload = async () => {
        if (files.length === 0) return;
        setUploading(true);
        setProgress(0);

        const totalFiles = files.length;

        for (let i = 0; i < totalFiles; i++) {
            const fileItem = files[i];
            try {
                // Update specific file status to uploading
                setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'uploading' } : f));

                await fileService.uploadFile(fileItem.file, folderId, (percent) => {
                    // Update global progress (for simplicity in 1-file uploads) 
                    // or could calculate weighted average for multi-file
                    setProgress(percent);
                });

                setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'success' } : f));
            } catch (error) {
                console.error("Upload failed for", fileItem.name, error);
                setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'error' } : f));
            }
        }

        setUploading(false);
        onUploadSuccess(); // Refresh dashboard
        onClose();
        setFiles([]); // Reset
        setProgress(0);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                    <h3 className="text-lg font-semibold text-gray-800">Upload Files</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Dropzone */}
                    <div
                        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 bg-gray-50'
                            }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            className="hidden"
                            onChange={handleChange}
                        />

                        <div className="flex flex-col items-center gap-3">
                            <div className="p-3 bg-blue-100 rounded-full">
                                <Upload className="w-6 h-6 text-blue-600" />
                            </div>
                            <p className="text-sm text-gray-600">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
                                >
                                    Click to upload
                                </button>
                                {' '}or drag and drop
                            </p>
                            <p className="text-xs text-gray-400">Any file type supported</p>
                        </div>
                    </div>

                    {/* File List */}
                    {files.length > 0 && (
                        <div className="mt-6 max-h-48 overflow-y-auto space-y-2 tap-highlight-transparent">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase flex justify-between">
                                <span>Selected Files ({files.length})</span>
                                <button onClick={() => setFiles([])} className="text-red-500 hover:underline">Clear</button>
                            </h4>
                            <div className="space-y-2">
                                {files.map((item, index) => (
                                    <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg border border-gray-100">
                                        <File className="w-5 h-5 text-gray-400" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-700 truncate">{item.name}</p>
                                            <p className="text-xs text-gray-400">{formatSize(item.size)}</p>
                                        </div>
                                        {item.status === 'success' && <span className="text-xs text-green-600 font-medium">Done</span>}
                                        {item.status === 'error' && <span className="text-xs text-red-600 font-medium">Error</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Progress Bar (Global for simplicity) */}
                    {uploading && (
                        <div className="mt-4">
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-gray-600">Uploading...</span>
                                <span className="text-gray-900 font-medium">{progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                <div
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        disabled={uploading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleUpload}
                        disabled={files.length === 0 || uploading}
                        className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-all shadow-sm ${files.length === 0 || uploading
                            ? 'bg-blue-300 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                    >
                        {uploading ? 'Uploading...' : 'Upload Files'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UploadModal;
