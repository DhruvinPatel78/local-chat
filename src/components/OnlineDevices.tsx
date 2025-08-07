import React from 'react';
import { Smartphone, Circle, Users } from 'lucide-react';

interface OnlineDevice {
  id: string;
  name: string;
  lastSeen: number;
  isOnline: boolean;
}

interface OnlineDevicesProps {
  devices: OnlineDevice[];
  currentUserId: string;
  selectedDeviceId?: string | null;
  onSelectDevice?: (id: string) => void;
}

export const OnlineDevices: React.FC<OnlineDevicesProps> = ({ devices, currentUserId, selectedDeviceId, onSelectDevice }) => {
  const formatLastSeen = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  // Filter out the current user except for the broadcast option
  const filteredDevices = devices.filter(device => device.id !== currentUserId || device.id === '__broadcast__');

  return (
    <div>
      {filteredDevices.length === 0 ? (
        <div className="text-center py-8">
          <Smartphone className="w-12 h-12 text-white/40 mx-auto mb-3" />
          <p className="text-white/60">No devices online</p>
          <p className="text-sm text-white/40 mt-1">
            Other devices will appear here automatically
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {filteredDevices.map((device) => (
            <div
              key={device.id}
              className={`flex items-center justify-between p-3 rounded-b-xl md:rounded-b-none border border-white/10 cursor-pointer transition-colors ${selectedDeviceId === device.id ? 'bg-blue-500/30 border-blue-400' : 'bg-white/5 hover:bg-white/10'}`}
              onClick={() => onSelectDevice && onSelectDevice(device.id)}
            >
              <div className="flex items-center space-x-3">
                {device.id === '__broadcast__' ? (
                  <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-green-400" />
                  </div>
                ) : (
                  <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-blue-400" />
                  </div>
                )}
                <div>
                  <p className="text-white font-medium">{device.name}</p>
                  {device.id !== '__broadcast__' && (
                    <div className="flex items-center space-x-1 text-green-400">
                      <Circle className="w-2 h-2 fill-current" />
                      <span className="text-sm">Online • {formatLastSeen(device.lastSeen)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};