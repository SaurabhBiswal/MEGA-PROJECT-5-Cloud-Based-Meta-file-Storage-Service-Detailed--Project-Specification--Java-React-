import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const Layout = () => {
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <div className="flex h-screen bg-white">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <Navbar onSearch={setSearchQuery} />
                <main className="flex-1 overflow-auto p-6 bg-gray-50">
                    <Outlet context={[searchQuery, setSearchQuery]} />
                </main>
            </div>
        </div>
    );
};

export default Layout;
