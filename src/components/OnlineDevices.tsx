import React from 'react';
import { Smartphone, Circle } from 'lucide-react';

interface OnlineDevice {
  id: string;
  name: string;
  lastSeen: number;
  isOnline: boolean;
}

interface OnlineDevicesProps {
  devices: OnlineDevice[];
}

export const OnlineDevices: React.FC<OnlineDevicesProps> = ({ devices }) => {
  const formatLastSeen = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
      <h3 className="text-lg font-semibold text-white mb-4">Online Devices</h3>
      
      {devices.length === 0 ? (
        <div className="text-center py-8">
          <Smartphone className="w-12 h-12 text-white/40 mx-auto mb-3" />
          <p className="text-white/60">No devices online</p>
          <p className="text-sm text-white/40 mt-1">
            Other devices will appear here automatically
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {devices.map((device) => (
            <div
              key={device.id}
              className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-white font-medium">{device.name}</p>
                  <div className="flex items-center space-x-1 text-green-400">
                    <Circle className="w-2 h-2 fill-current" />
                    <span className="text-sm">Online • {formatLastSeen(device.lastSeen)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-4 p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
        <p className="text-blue-400 text-sm">
          💡 Devices on the same network will appear here automatically. 
          You can message anyone who's online!
        </p>
      </div>
    </div>
  );
};