import React, { useState, useEffect } from 'react';
import { UserProfile } from './components/UserProfile';
import { OnlineDevices } from './components/OnlineDevices';
import { ChatArea } from './components/ChatArea';
import { NetworkService } from './services/NetworkService';
import { Message } from './types';

interface OnlineDevice {
  id: string;
  name: string;
  lastSeen: number;
  isOnline: boolean;
}

function App() {
  const [networkService] = useState(() => new NetworkService());
  const [currentUser, setCurrentUser] = useState(networkService.getLocalUser());
  const [onlineDevices, setOnlineDevices] = useState<OnlineDevice[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showChatOnMobile, setShowChatOnMobile] = useState(false);
  const BROADCAST_ID = '__broadcast__';

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    networkService.start();
    networkService.onMessage((data) => {
      if (data.type === 'message') {
        const message: Message = {
          id: data.id,
          senderId: data.senderId,
          senderName: data.senderName,
          content: data.content || '',
          timestamp: data.timestamp,
          type: data.messageType === 'file' ? 'file' : 'text',
          fileName: data.fileName,
          fileSize: data.fileSize
        };
        setMessages(prev => [...prev, message]);
      }
    });
    networkService.onDeviceUpdate((devices) => {
      setOnlineDevices(devices);
    });
    setOnlineDevices(networkService.getOnlineDevices());
    return () => {
      networkService.disconnect();
    };
  }, []);

  const handleNameChange = (newName: string) => {
    networkService.updateUserName(newName);
    setCurrentUser({ ...currentUser!, name: newName });
  };

  const handleSendMessage = (message: string) => {
    if (!selectedDeviceId || selectedDeviceId === BROADCAST_ID) {
      const messageData = networkService.sendMessage(message);
      if (!messageData) return;
      const newMessage: Message = {
        id: messageData.id,
        senderId: messageData.senderId || currentUser!.id,
        senderName: messageData.senderName || currentUser!.name,
        content: messageData.content,
        timestamp: messageData.timestamp,
        type: 'text',
        receiverId: null,
      };
      setMessages(prev => [...prev, newMessage]);
      return;
    }
    const messageData = networkService.sendMessage(message, selectedDeviceId);
    if (!messageData) return;
    const newMessage: Message = {
      id: messageData.id,
      senderId: messageData.senderId || currentUser!.id,
      senderName: messageData.senderName || currentUser!.name,
      content: messageData.content,
      timestamp: messageData.timestamp,
      type: 'text',
      receiverId: selectedDeviceId,
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSendFile = (file: File) => {
    return;
  };

  const filteredMessages = selectedDeviceId && selectedDeviceId !== BROADCAST_ID
    ? messages.filter(
        m =>
          ((m.senderId === currentUser!.id && m.receiverId === selectedDeviceId) ||
          (m.senderId === selectedDeviceId && m.receiverId === currentUser!.id))
      )
    : messages.filter(m => m.receiverId === null);

  const deviceList = onlineDevices;
  const deviceListWithBroadcast = [
    { id: BROADCAST_ID, name: 'Broadcast', lastSeen: 0, isOnline: true },
    ...deviceList
  ];

  // Mobile navigation logic
  const handleSelectDevice = (id: string) => {
    setSelectedDeviceId(id);
    if (isMobile) setShowChatOnMobile(true);
  };
  const handleBackToList = () => {
    setShowChatOnMobile(false);
    setSelectedDeviceId(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <div className="container mx-auto px-4 py-6 h-screen">
        {/* Desktop: split view, Mobile: conditional view */}
        <div className={isMobile ? 'h-full' : 'flex h-full rounded-2xl overflow-hidden shadow-lg border border-white/20 bg-white/5'}>
          {/* Device List (always visible on desktop, only if not in chat on mobile) */}
          {(!isMobile || !showChatOnMobile) && (
            <div className={isMobile ? 'h-full' : 'w-full max-w-xs bg-white/10 border-r border-white/20 flex flex-col'}>
              <UserProfile
                userName={currentUser.name}
                onNameChange={handleNameChange}
                onlineDevices={deviceList.length}
              />
              <div className="flex-1 overflow-y-auto">
                <OnlineDevices
                  devices={deviceListWithBroadcast}
                  currentUserId={currentUser.id}
                  selectedDeviceId={selectedDeviceId}
                  onSelectDevice={handleSelectDevice}
                />
              </div>
            </div>
          )}
          {/* Chat Area (always visible on desktop, only if in chat on mobile) */}
          {(!isMobile || showChatOnMobile) && (
            <div className={isMobile ? 'h-full' : 'flex-1 flex flex-col'}>
              {selectedDeviceId ? (
                <ChatArea
                  messages={filteredMessages}
                  onSendMessage={handleSendMessage}
                  onSendFile={handleSendFile}
                  currentUserId={currentUser.id}
                  selectedDevice={
                    selectedDeviceId === BROADCAST_ID
                      ? { id: BROADCAST_ID, name: 'Broadcast', lastSeen: 0, isOnline: true }
                      : deviceList.find(d => d.id === selectedDeviceId) || null
                  }
                  onBack={isMobile ? handleBackToList : undefined}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center text-white/60 text-lg">
                  Select a device to start chatting
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;