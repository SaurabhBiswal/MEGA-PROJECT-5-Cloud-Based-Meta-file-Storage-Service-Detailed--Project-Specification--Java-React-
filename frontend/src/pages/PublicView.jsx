import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Download, FileText, ImageIcon, Loader2, Globe, Shield, ExternalLink, AlertCircle } from 'lucide-react';
import fileService from '../services/fileService';

const PublicView = () => {
    const { token } = useParams();
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => {
        const fetchFile = async () => {
            try {
                const fileData = await fileService.getPublicFile(token);
                setFile(fileData);

                // If it's previewable, get the blob
                const isImage = fileData.fileType?.startsWith('image/');
                const isPdf = fileData.fileType === 'application/pdf';
                const isVideo = fileData.fileType?.startsWith('video/');

                if (isImage || isPdf || isVideo) {
                    const downloadUrl = fileService.getPublicDownloadUrl(token);
                    setPreviewUrl(downloadUrl);
                }
            } catch (err) {
                console.error("Failed to load public file", err);
                setError("This link is invalid, expired, or the owner has revoked access.");
            } finally {
                setLoading(false);
            }
        };

        fetchFile();
    }, [token]);

    const handleDownload = () => {
        if (!file) return;
        const link = document.createElement('a');
        link.href = fileService.getPublicDownloadUrl(token);
        link.setAttribute('download', file.fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
                <p className="text-gray-500 font-medium animate-pulse">Securing shared access...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-red-100 rounded-3xl flex items-center justify-center mb-6">
                    <AlertCircle className="w-10 h-10 text-red-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
                <p className="text-gray-500 max-w-sm mb-8">{error}</p>
                <a href="/login" className="px-8 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all">
                    Go to CloudBox Home
                </a>
            </div>
        );
    }

    const isImage = file.fileType?.startsWith('image/');
    const isPdf = file.fileType === 'application/pdf';
    const isVideo = file.fileType?.startsWith('video/');

    return (
        <div className="min-h-screen bg-[#f8f9fc] flex flex-col">
            {/* Minimal Header */}
            <header className="h-16 px-8 flex items-center justify-between bg-white border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-blue-200">
                        CB
                    </div>
                    <span className="font-bold text-gray-900 tracking-tight">CloudBox <span className="text-blue-600 font-black">Shared</span></span>
                </div>
                <a href="/register" className="text-sm font-bold text-blue-600 hover:underline">
                    Create your own CloudBox account
                </a>
            </header>

            {/* Content Area */}
            <main className="flex-1 max-w-6xl w-full mx-auto p-8 flex flex-col md:flex-row gap-8">
                {/* Left: Preview Area */}
                <div className="flex-[2] bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {isImage ? <ImageIcon className="w-4 h-4 text-purple-500" /> : <FileText className="w-4 h-4 text-blue-500" />}
                            <span className="text-sm font-bold text-gray-700 truncate max-w-xs">{file.fileName}</span>
                        </div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-white px-2 py-1 rounded-md border border-gray-200">
                            {file.fileType}
                        </span>
                    </div>

                    <div className="flex-1 bg-gray-100/50 flex items-center justify-center p-4">
                        {previewUrl ? (
                            isImage ? (
                                <img src={previewUrl} alt={file.fileName} className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-xl" />
                            ) : isVideo ? (
                                <div className="w-full h-full max-h-[60vh] flex items-center justify-center p-4">
                                    <video
                                        src={previewUrl}
                                        controls
                                        className="max-w-full max-h-full rounded-xl shadow-2xl border border-gray-200"
                                    />
                                </div>
                            ) : (
                                <iframe src={previewUrl} title={file.fileName} className="w-full h-full bg-white rounded-lg" />
                            )
                        ) : (
                            <div className="text-center p-12">
                                <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-200 text-gray-300">
                                    <FileText className="w-10 h-10" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">Visual preview restricted</h3>
                                <p className="text-sm text-gray-500">Download the file to view its contents safely.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Info Area */}
                <div className="flex-1 space-y-6">
                    <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
                        <div className="flex items-start justify-between mb-6">
                            <h2 className="text-2xl font-black text-gray-900">File Details</h2>
                            <div className="p-2 bg-green-50 rounded-xl">
                                <Shield className="w-5 h-5 text-green-600" />
                            </div>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Owner Email</p>
                                <p className="text-sm font-bold text-gray-900">{file.user?.email || 'CloudBox User'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">File Size</p>
                                <p className="text-sm font-bold text-gray-900">{(file.fileSize / 1024).toFixed(2)} KB</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Shared Via</p>
                                <p className="text-sm font-bold text-blue-600 flex items-center gap-1.5">
                                    <Globe className="w-4 h-4" />
                                    Secure Public Link
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={handleDownload}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-blue-200 flex items-center justify-center gap-3 active:scale-95"
                        >
                            <Download className="w-5 h-5" />
                            Download This File
                        </button>
                    </div>

                    <div className="bg-blue-600 p-8 rounded-3xl text-white shadow-xl shadow-blue-100">
                        <h3 className="text-lg font-bold mb-2">Need more space?</h3>
                        <p className="text-blue-100 text-sm mb-6 leading-relaxed">Sign up for CloudBox today and get 10GB of secure storage for free!</p>
                        <a href="/register" className="block w-full py-3 bg-white text-blue-600 text-center font-bold rounded-xl hover:bg-blue-50 transition-colors">
                            Get Started Free
                        </a>
                    </div>
                </div>
            </main>

            <footer className="py-8 text-center text-gray-400 text-xs font-medium">
                &copy; 2026 CloudBox Inc. All rights reserved. Professional File Management.
            </footer>
        </div>
    );
};

export default PublicView;
