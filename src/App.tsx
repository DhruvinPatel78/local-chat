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

  // Calculate unread message counts for each device
  const unreadCounts = React.useMemo(() => {
    const counts: { [deviceId: string]: number } = {};
    
    if (!currentUser) return counts;
    
    // Peer-to-peer unread counts
    onlineDevices.forEach(device => {
      if (device.id !== currentUser.id) {
        const unreadCount = messages.filter(message => 
          message.senderId === device.id && 
          message.receiverId === currentUser.id && 
          !message.isRead
        ).length;
        counts[device.id] = unreadCount;
      }
    });
    
    // Broadcast unread count
    const broadcastUnread = messages.filter(
      message => message.receiverId === null && message.senderId !== currentUser.id && !message.isRead
    ).length;
    counts[BROADCAST_ID] = broadcastUnread;
    
    return counts;
  }, [messages, onlineDevices, currentUser]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    console.log('App useEffect running - setting up network service');
    
    networkService.start();
    
    // Store callback references to prevent duplicates
    const messageCallback = (data: any) => {
      if (data.type === 'message') {
        console.log('Received message from network service:', data);
        
        // Skip if this is our own message (we already added it when sending)
        if (data.senderId === currentUser!.id) {
          console.log('Skipping own message from server:', data.id);
          return;
        }
        
        // Determine if this is a peer-to-peer message or broadcast
        const isPeerToPeer = data.receiverId !== null && data.receiverId !== undefined;
        
        const message: Message = {
          id: data.id,
          senderId: data.senderId,
          senderName: data.senderName,
          content: data.content || '',
          timestamp: data.timestamp,
          type: data.messageType === 'file' ? 'file' : 'text',
          fileName: data.fileName,
          fileSize: data.fileSize,
          receiverId: isPeerToPeer ? data.receiverId : null, // Set receiverId for peer-to-peer messages
        };
        
        console.log('Processed message:', message);
        
        // Prevent duplicate messages by checking if message ID already exists
        setMessages(prev => {
          const messageExists = prev.some(m => m.id === message.id);
          if (messageExists) {
            console.log('Message already exists, skipping duplicate:', message.id);
            return prev;
          }
          console.log('Adding new message:', message.id);
          return [...prev, message];
        });
      } else if (data.type === 'read-receipt') {
        console.log('Received read receipt:', data);
        console.log('Current user ID:', currentUser!.id);
        console.log('Looking for message with ID:', data.messageId);
        
        // Find the message that should be updated
        const messageToUpdate = messages.find(message => 
          message.id === data.messageId && 
          message.senderId === currentUser!.id && 
          message.receiverId === data.senderId
        );
        
        console.log('Message to update:', messageToUpdate);
        
        // Update message read status for messages sent by current user
        // data.senderId = who read the message (Chrome), data.originalSenderId = who sent the original message (Safari)
        // We need to find messages sent by current user (Safari) to the person who read it (Chrome)
        setMessages(prev => {
          const updatedMessages = prev.map(message => {
            if (message.id === data.messageId && 
                message.senderId === currentUser!.id && 
                message.receiverId === data.senderId) {
              console.log('Updating message to read:', message.id, message.content);
              return { ...message, isRead: true, readAt: data.timestamp };
            }
            return message;
          });
          
          console.log('Messages after read receipt update:', updatedMessages);
          return updatedMessages;
        });
      }
    };
    
    const deviceUpdateCallback = (devices: any[]) => {
      console.log('Device update received in App:', devices);
      // Always apply updates to reflect disconnects immediately
      setOnlineDevices(Array.isArray(devices) ? devices : []);
    };
    
    // Register callbacks
    networkService.onMessage(messageCallback);
    networkService.onDeviceUpdate(deviceUpdateCallback);
    
    const initialDevices = networkService.getOnlineDevices();
    console.log('Initial devices from network service:', initialDevices);
    setOnlineDevices(initialDevices ?? []);
    
    // Periodic refresh of online devices
    const interval = setInterval(() => {
      const currentDevices = networkService.getOnlineDevices();
      console.log('Periodic device refresh:', currentDevices);
      setOnlineDevices(currentDevices ?? []);
    }, 5000); // Refresh every 5 seconds
    
    return () => {
      console.log('App useEffect cleanup - cleaning up network service');
      clearInterval(interval);
      networkService.disconnect();
    };
  }, []);

  // Automatically mark messages as read when they're viewed in the chat
  useEffect(() => {
    if (selectedDeviceId && selectedDeviceId !== BROADCAST_ID) {
      // Small delay to ensure the chat is fully loaded
      const timer = setTimeout(() => {
        markMessagesAsRead(selectedDeviceId);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [selectedDeviceId, messages]);

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
        senderId: messageData.senderId,
        senderName: messageData.senderName,
        content: messageData.content,
        timestamp: messageData.timestamp,
        type: 'text',
        receiverId: messageData.receiverId,
      };
      setMessages(prev => [...prev, newMessage]);
      return;
    }
    const messageData = networkService.sendMessage(message, selectedDeviceId);
    if (!messageData) return;
    const newMessage: Message = {
      id: messageData.id,
      senderId: messageData.senderId,
      senderName: messageData.senderName,
      content: messageData.content,
      timestamp: messageData.timestamp,
      type: 'text',
      receiverId: messageData.receiverId,
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSendFile = (file: File) => {
    return;
  };

  const filteredMessages = selectedDeviceId && selectedDeviceId !== BROADCAST_ID && currentUser
    ? messages.filter(
        m => {
          const isMatch = ((m.senderId === currentUser.id && m.receiverId === selectedDeviceId) ||
          (m.senderId === selectedDeviceId && m.receiverId === currentUser.id));
          
          console.log('Filtering message:', {
            message: m,
            selectedDeviceId,
            currentUserId: currentUser.id,
            isMatch,
            senderId: m.senderId,
            receiverId: m.receiverId,
            isRead: m.isRead,
            readAt: m.readAt
          });
          
          return isMatch;
        }
      )
    : messages.filter(m => m.receiverId === null);

  // Force re-render when messages are updated with read status
  useEffect(() => {
    console.log('Messages updated, filtered messages:', filteredMessages);
  }, [messages, filteredMessages]);

  const deviceList = onlineDevices;
  const deviceListWithBroadcast = [
    { id: BROADCAST_ID, name: 'Broadcast', lastSeen: 0, isOnline: true },
    ...deviceList
  ];

  // Mobile navigation logic
  const handleSelectDevice = (id: string) => {
    setSelectedDeviceId(id);
    if (isMobile) setShowChatOnMobile(true);
    
    // Mark messages from this device as read and send read receipts
    if (id !== BROADCAST_ID && currentUser) {
      const unreadMessages = messages.filter(message => 
        message.senderId === id && message.receiverId === currentUser.id && !message.isRead
      );
      
      if (unreadMessages.length > 0) {
        setMessages(prev => prev.map(message => 
          message.senderId === id && message.receiverId === currentUser.id && !message.isRead
            ? { ...message, isRead: true, readAt: Date.now() }
            : message
        ));
        
        // Send read receipts for all unread messages
        unreadMessages.forEach(message => {
          networkService.sendReadReceipt(message.id, id);
        });
      }
    }
  };

  // Function to mark messages as read when they're viewed
  const markMessagesAsRead = (deviceId: string) => {
    if (deviceId === BROADCAST_ID || !currentUser) return;
    
    const unreadMessages = messages.filter(message => 
      message.senderId === deviceId && message.receiverId === currentUser.id && !message.isRead
    );
    
    if (unreadMessages.length > 0) {
      setMessages(prev => prev.map(message => 
        message.senderId === deviceId && message.receiverId === currentUser.id && !message.isRead
          ? { ...message, isRead: true, readAt: Date.now() }
          : message
      ));
      
      // Send read receipts for all unread messages
      unreadMessages.forEach(message => {
        networkService.sendReadReceipt(message.id, deviceId);
      });
    }
  };
  const handleBackToList = () => {
    setShowChatOnMobile(false);
    setSelectedDeviceId(null);
  };

  // Don't render if currentUser is not available
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading user...</div>
      </div>
    );
  }

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
                  unreadCounts={unreadCounts}
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
                  onMessageViewed={(messageId) => {
                    // Find the message and mark it as read if it's from the selected device
                    if (selectedDeviceId && selectedDeviceId !== BROADCAST_ID) {
                      const message = messages.find(m => m.id === messageId);
                      if (message && message.senderId === selectedDeviceId && message.receiverId === currentUser.id && !message.isRead) {
                        setMessages(prev => prev.map(m => 
                          m.id === messageId ? { ...m, isRead: true, readAt: Date.now() } : m
                        ));
                        networkService.sendReadReceipt(messageId, selectedDeviceId);
                      }
                    }
                  }}
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