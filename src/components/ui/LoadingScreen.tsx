import React from 'react';
import { Camera } from 'lucide-react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <Camera className="h-16 w-16 text-violet-500" />
          <div className="absolute -top-1 -right-1 h-4 w-4">
            <div className="animate-spin h-4 w-4 border-2 border-violet-500 border-t-transparent rounded-full"></div>
          </div>
        </div>
        <h2 className="text-xl font-semibold text-gray-100">Carregando...</h2>
      </div>
    </div>
  );
};

export default LoadingScreen;