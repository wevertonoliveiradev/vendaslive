import React from 'react';
import { Camera, Menu, X, User, LogOut } from 'lucide-react';
import { useSupabase } from '../../contexts/SupabaseContext';
import { useMobileMenu } from '../../contexts/MobileMenuContext';

const Navbar: React.FC = () => {
  const { user, signOut } = useSupabase();
  const { isOpen, toggle } = useMobileMenu();
  
  const handleLogout = async () => {
    await signOut();
  };

  return (
    <header className="bg-gray-900 border-b border-gray-800 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-800 hover:text-white md:hidden"
              onClick={toggle}
            >
              <span className="sr-only">Abrir menu</span>
              {isOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
            <div className="hidden md:flex md:items-center md:space-x-4">
              <Camera className="h-8 w-8 text-violet-500" />
              <span className="text-xl font-bold text-gray-100">FotoVendas</span>
            </div>
          </div>
          
          <div className="ml-4 flex items-center md:ml-6">
            <div className="relative">
              <div className="flex items-center">
                <div className="hidden md:block mr-3">
                  <p className="text-sm text-gray-300">{user?.user_metadata?.full_name || user?.email}</p>
                </div>
                <div className="bg-gray-700 rounded-full p-1">
                  <User className="h-6 w-6 text-gray-300" />
                </div>
                <button 
                  onClick={handleLogout}
                  className="ml-2 p-1.5 rounded-full hover:bg-gray-800"
                >
                  <LogOut className="h-5 w-5 text-gray-400 hover:text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;