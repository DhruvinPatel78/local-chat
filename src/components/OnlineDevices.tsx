import React from 'react';
import { Smartphone, Circle, Users, RefreshCw } from 'lucide-react';

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
  unreadCounts?: { [deviceId: string]: number };
  onRefresh?: () => void;
  isConnected?: boolean;
}

export const OnlineDevices: React.FC<OnlineDevicesProps> = ({ devices, currentUserId, selectedDeviceId, onSelectDevice, unreadCounts = {}, onRefresh, isConnected = false }) => {
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  
  console.log('OnlineDevices render - devices:', devices, 'currentUserId:', currentUserId);
  
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
  console.log('Filtered devices:', filteredDevices);

  return (
    <div>
      {/* Header with refresh button */}
      <div className="flex items-center justify-between p-3 border-b border-white/20">
        <h3 className="text-white font-medium">Online Devices</h3>
        {onRefresh && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsRefreshing(true);
              onRefresh();
              // Reset refreshing state after a short delay
              setTimeout(() => setIsRefreshing(false), 1000);
            }}
            disabled={isRefreshing || !isConnected}
            className={`p-2 hover:bg-white/10 rounded-lg transition-colors group ${(isRefreshing || !isConnected) ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={!isConnected ? "Connect to refresh device list" : "Refresh device list"}
          >
            <RefreshCw className={`w-4 h-4 text-white/70 group-hover:text-white transition-colors ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>
      
      {!isConnected ? (
        <div className="text-center py-8">
          <Smartphone className="w-12 h-12 text-white/40 mx-auto mb-3" />
          <p className="text-white/60">You are offline</p>
          <p className="text-sm text-white/40 mt-1">
            Connect to see online devices
          </p>
        </div>
      ) : filteredDevices.length === 0 ? (
        <div className="text-center py-8">
          <Smartphone className="w-12 h-12 text-white/40 mx-auto mb-3" />
          <p className="text-white/60">No devices online</p>
          <p className="text-sm text-white/40 mt-1">
            Other devices will appear here automatically
          </p>
        </div>
      ) : (
        <div className="">
          {filteredDevices.map((device, index) => {
            const unreadCount = unreadCounts[device.id] || 0;
            return (
              <div
                key={device.id}
                className={`flex items-center justify-between p-3 ${filteredDevices.length - 1 === index ? 'rounded-b-xl' : 'rounded-none'}  md:rounded-b-none border border-white/10 cursor-pointer transition-colors ${selectedDeviceId === device.id ? 'bg-blue-500/30 border-blue-400' : 'bg-white/5 hover:bg-white/10'}`}
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
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <p className="text-white font-medium">{device.name}</p>
                      {unreadCount > 0 && device.id !== '__broadcast__' && (
                        <div className="w-3 h-3 rounded-full bg-green-400 animate-ping" />
                      )}
                    </div>
                    {device.id !== '__broadcast__' && (
                      <div className="flex items-center space-x-1 text-green-400">
                        <Circle className="w-2 h-2 fill-current" />
                        <span className="text-sm">Online • {formatLastSeen(device.lastSeen)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};