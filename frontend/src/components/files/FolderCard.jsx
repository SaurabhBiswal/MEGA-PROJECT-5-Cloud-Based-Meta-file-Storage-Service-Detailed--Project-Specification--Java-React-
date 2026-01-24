import { Folder } from 'lucide-react';
import React from 'react';

const FolderCard = ({ folder, onClick, onContextMenu }) => {
    return (
        <div
            onClick={onClick}
            onContextMenu={onContextMenu}
            className="bg-white p-4 rounded-xl border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group flex items-center gap-3"
        >
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <Folder className="w-6 h-6 text-blue-500 fill-current" />
            </div>
            <div className="flex-1 min-w-0 text-left">
                <h3 className="text-sm font-medium text-gray-700 truncate" title={folder.name}>
                    {folder.name}
                </h3>
                <p className="text-xs text-gray-400">Folder</p>
            </div>
        </div>
    );
};

export default FolderCard;
