import React, { useState } from 'react';
import { User, Edit3, Check, X } from 'lucide-react';

interface UserProfileProps {
  userName: string;
  onNameChange: (name: string) => void;
  onlineDevices: number;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  userName,
  onNameChange,
  onlineDevices
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(userName);

  const handleSave = () => {
    if (tempName.trim() && tempName !== userName) {
      onNameChange(tempName.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempName(userName);
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-t-2xl md:rounded-tl-2xl md:rounded-t-none p-6 border border-white/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            {isEditing ? (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="bg-white/20 border border-white/30 rounded-lg px-3 py-1 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Enter your name"
                  autoFocus
                />
                <button
                  onClick={handleSave}
                  className="p-1 hover:bg-white/20 rounded-md transition-colors"
                >
                  <Check className="w-4 h-4 text-green-400" />
                </button>
                <button
                  onClick={handleCancel}
                  className="p-1 hover:bg-white/20 rounded-md transition-colors"
                >
                  <X className="w-4 h-4 text-red-400" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-semibold text-white">{userName}</h2>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1 hover:bg-white/20 rounded-md transition-colors"
                >
                  <Edit3 className="w-4 h-4 text-white/70 hover:text-white" />
                </button>
              </div>
            )}
            <div className="flex items-center space-x-2 mt-1">
              <div className={`w-3 h-3 rounded-full ${onlineDevices > 0 ? 'bg-green-400' : 'bg-gray-400'}`}>
                {onlineDevices > 0 && (
                  <div className="w-3 h-3 rounded-full bg-green-400 animate-ping" />
                )}
              </div>
              <span className="text-sm text-white/80">
                {onlineDevices > 0 ? `Online (${onlineDevices} devices)` : 'No devices nearby'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};