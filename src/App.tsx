import React, { useState, useEffect } from 'react';
import { UserProfile } from './components/UserProfile';
import { OnlineDevices } from './components/OnlineDevices';
import { ChatArea } from './components/ChatArea';
import { ConnectionGuide } from './components/ConnectionGuide';
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

  useEffect(() => {
    // Setup network service event listeners
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

    // Get initial online devices
    setOnlineDevices(networkService.getOnlineDevices());

    return () => {
      networkService.disconnect();
    };
  }, []);
  )

  const handleNameChange = (newName: string) => {
    networkService.updateUserName(newName);
    setCurrentUser({ ...currentUser!, name: newName });
  };

  const handleSendMessage = (message: string) => {
    const messageData = networkService.sendMessage(message);
    const newMessage: Message = {
      id: messageData.id,
      senderId: messageData.senderId || currentUser!.id,
      senderName: messageData.senderName || currentUser!.name,
      content: messageData.content,
      timestamp: messageData.timestamp,
      type: 'text'
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSendFile = (file: File) => {
    const fileData = networkService.sendFile(file);
    const newMessage: Message = {
      id: fileData.id,
      senderId: fileData.senderId || currentUser!.id,
      senderName: fileData.senderName || currentUser!.name,
      content: '',
      timestamp: fileData.timestamp,
      type: 'file',
      fileName: fileData.fileName,
      fileSize: fileData.fileSize
    };
    setMessages(prev => [...prev, newMessage]);
  };

  if (!currentUser) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <div className="container mx-auto px-4 py-6 h-screen">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <UserProfile
              userName={currentUser.name}
              onNameChange={handleNameChange}
              onlineDevices={onlineDevices.length}
            />
            
            <OnlineDevices
              devices={onlineDevices}
            />
            
            <div className="hidden lg:block">
              <ConnectionGuide />
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="lg:col-span-3">
            <ChatArea
              messages={messages}
              onSendMessage={handleSendMessage}
              onSendFile={handleSendFile}
              currentUserId={currentUser.id}
            />
          </div>
        </div>

        {/* Mobile Connection Guide */}
        <div className="lg:hidden mt-6">
          <ConnectionGuide />
        </div>
      </div>
    </div>
  );
}

export default App;