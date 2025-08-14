import React, { useState } from 'react';

interface ConnectionToggleProps {
  isConnected: boolean;
  onToggle: () => void;
}

export const ConnectionToggle: React.FC<ConnectionToggleProps> = ({ isConnected, onToggle }) => {
  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = () => {
    setIsToggling(true);
    onToggle();
    // Reset toggling state after a short delay
    setTimeout(() => setIsToggling(false), 1000);
  };

  return (
    <div className="flex items-center justify-between p-3 bg-white/10 border-b border-white/20">
      <div className="flex items-center space-x-3">
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
        <span className="text-white text-sm font-medium">
          {isToggling ? 'Connecting...' : (isConnected ? 'Online' : 'Offline')}
        </span>
      </div>
      
      <button
        onClick={handleToggle}
        disabled={isToggling}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          isConnected ? 'bg-blue-600' : 'bg-gray-600'
        } ${isToggling ? 'opacity-50 cursor-not-allowed' : ''}`}
        role="switch"
        aria-checked={isConnected}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            isConnected ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
};
