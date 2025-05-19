import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { MobileMenuProvider } from '../../contexts/MobileMenuContext';

const Layout: React.FC = () => {
  return (
    <MobileMenuProvider>
      <div className="flex h-screen bg-gray-950 text-gray-100">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar />
          <main className="flex-1 overflow-y-auto bg-gray-900 p-4 md:p-6">
            <div className="mx-auto max-w-7xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </MobileMenuProvider>
  );
};

export default Layout;