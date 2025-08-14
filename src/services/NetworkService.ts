import { config, getWsUrl, getFileUploadUrl } from '../config';

export class NetworkService {
  private localUser: { id: string; name: string } | null = null;
  private onlineDevices: Map<string, any> = new Map();
  private messageCallbacks: ((message: any) => void)[] = [];
  private deviceUpdateCallbacks: ((devices: any[]) => void)[] = [];
  private connectionStateCallbacks: ((isConnected: boolean) => void)[] = [];
  private ws: WebSocket | null = null;
  private pendingNameUpdate: string | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = config.websocket.reconnectAttempts;
  private autoReconnect: boolean = true;

  constructor() {
    this.initializeLocalUser();
    console.log('NetworkService initialized with user:', this.localUser);
    this.setupUnloadHandlers();
  }

  start() {
    // Close existing connection if any
    if (this.ws) {
      console.log('Closing existing WebSocket connection before starting new one');
      this.ws.close();
      this.ws = null;
    }
    
    const wsUrl = getWsUrl();
    console.log('Starting WebSocket connection to', wsUrl);
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected successfully to', getWsUrl());
      this.isConnected = true;
      this.reconnectAttempts = 0;
      console.log('Notifying connection state change to:', this.connectionStateCallbacks.length, 'callbacks');
      this.notifyConnectionStateChange();
      // Always send id and name on connect
      this.sendInit();
      // Send any pending name update
      if (this.pendingNameUpdate !== null) {
        this.sendUpdateName(this.pendingNameUpdate);
        this.pendingNameUpdate = null;
      }
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Received from server:', data);
      switch (data.type) {
        case 'online-devices':
          console.log('Received online devices update:', data.devices);
          // Always update devices (including empty) so offline state is reflected immediately
          this.onlineDevices.clear();
          if (Array.isArray(data.devices)) {
            data.devices.forEach((device: any) => {
              this.onlineDevices.set(device.id, device);
            });
          }
          console.log('Updated online devices map:', Array.from(this.onlineDevices.values()));
          this.notifyDeviceUpdate();
          break;
        case 'message':
          console.log('NetworkService received message:', data);
          // Ensure file messages are properly marked
          if (data.messageType === 'file') {
            data.type = 'file';
          }
          this.messageCallbacks.forEach(callback => callback(data));
          break;
      }
    };

    this.ws.onclose = (event) => {
      console.log('WebSocket connection closed', event.code, event.reason);
      this.isConnected = false;
      this.notifyConnectionStateChange();
      this.ws = null;

        // Clear online devices and notify listeners so UI reflects offline state immediately
        this.onlineDevices.clear();
        this.notifyDeviceUpdate();

      // Try to reconnect if auto-reconnect is enabled and we haven't exceeded max attempts
      if (this.autoReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        const delay = Math.min(
          config.websocket.reconnectDelay * Math.pow(2, this.reconnectAttempts), 
          config.websocket.maxReconnectDelay
        );
        console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        setTimeout(() => {
          this.start();
        }, delay);
      } else if (!this.autoReconnect) {
        console.log('Auto-reconnect disabled, not attempting to reconnect');
      } else {
        console.error('Max reconnection attempts reached');
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  private setupUnloadHandlers() {
    const closeWs = () => {
      try {
        console.log('Disconnecting due to page unload/close');
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          // Send a disconnect message to server before closing
          if (this.localUser) {
            const disconnectMessage = { 
              type: 'disconnect', 
              id: this.localUser.id, 
              name: this.localUser.name,
              timestamp: Date.now()
            };
            this.ws.send(JSON.stringify(disconnectMessage));
          }
          this.ws.close();
        }
        this.isConnected = false;
        this.notifyConnectionStateChange();
      } catch (e) {
        console.error('Error during disconnect:', e);
      }
    };

    // Standard events for tab/browser close
    window.addEventListener('beforeunload', (event) => {
      console.log('Tab/browser closing, disconnecting');
      // Use synchronous XMLHttpRequest for beforeunload (modern browsers block async)
      try {
        if (this.ws && this.ws.readyState === WebSocket.OPEN && this.localUser) {
          const disconnectMessage = { 
            type: 'disconnect', 
            id: this.localUser.id, 
            name: this.localUser.name,
            timestamp: Date.now()
          };
          this.ws.send(JSON.stringify(disconnectMessage));
        }
      } catch (e) {
        console.log('Could not send disconnect message during beforeunload');
      }
      closeWs();
    });
    window.addEventListener('unload', (event) => {
      console.log('Tab/browser unload, disconnecting');
      closeWs();
    });



    // Page Visibility API - Only disconnect on mobile when app goes to background
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        // Check if this is a mobile device
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        
        if (isMobile && !isStandalone) {
          // On mobile browser (not PWA), disconnect when app goes to background
          console.log('Mobile browser going to background, disconnecting');
          closeWs();
        } else if (isMobile && isStandalone) {
          // On mobile PWA, be more conservative - only disconnect on actual close
          console.log('Mobile PWA visibility changed, not disconnecting (PWA mode)');
        } else {
          // On desktop, don't disconnect just for tab switching
          console.log('Desktop tab visibility changed to hidden (likely tab switch), not disconnecting');
        }
      }
    });

    // Handle iOS Safari and mobile browser behavior
    if ('onpagehide' in window) {
      window.addEventListener('pagehide', (event) => {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (event.persisted) {
          // Page is being cached (back/forward navigation)
          console.log('Page being cached (back/forward navigation), not disconnecting');
        } else if (isMobile) {
          // On mobile, pagehide without persisted usually means app going to background
          console.log('Mobile pagehide without persisted (app background), disconnecting');
          closeWs();
        } else {
          // On desktop, pagehide without persisted means tab/browser close
          console.log('Desktop pagehide without persisted (tab/browser close), disconnecting');
          closeWs();
        }
      });
    }



    // Handle tab close (Firefox)
    window.addEventListener('unload', closeWs);









    // Handle online/offline status changes
    window.addEventListener('online', () => {
      console.log('Network came back online');
    });

    window.addEventListener('offline', () => {
      console.log('Network went offline, disconnecting');
      closeWs();
    });

    // Handle app state changes (PWA)
    window.addEventListener('appStateChange', (event: any) => {
      console.log('App state changed, disconnecting');
      closeWs();
    });

    // Handle service worker messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'APP_STATE_CHANGE') {
          console.log('App state changed via service worker, disconnecting');
          closeWs();
        }
      });
    }

    // PWA-specific events for app close
    if ('serviceWorker' in navigator) {
      // Listen for PWA app close events
      window.addEventListener('beforeunload', (event) => {
        console.log('PWA app closing, disconnecting');
        closeWs();
      });

      // Handle PWA app suspend/resume
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          // Check if this is a PWA in standalone mode
          const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
          if (isStandalone) {
            console.log('PWA app going to background, disconnecting');
            closeWs();
          }
        }
      });

      // Handle PWA app state changes via service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'PWA_APP_CLOSE') {
          console.log('PWA app close detected via service worker, disconnecting');
          closeWs();
        }
      });
    }
  }

  private sendInit() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN && this.localUser) {
      const initMessage = { type: 'init', id: this.localUser.id, name: this.localUser.name };
      console.log('Sending init message:', initMessage);
      this.ws.send(JSON.stringify(initMessage));
    } else {
      console.error('Cannot send init - WebSocket not ready or user not available');
      console.log('WebSocket state:', this.ws?.readyState, 'User:', this.localUser);
    }
  }

  private initializeLocalUser() {
    const savedUser = localStorage.getItem('localUser');
    if (savedUser) {
      this.localUser = JSON.parse(savedUser);
      if (this.localUser && !this.localUser.id) {
        this.localUser.id = this.generateId();
        localStorage.setItem('localUser', JSON.stringify(this.localUser));
      }
    } else {
      this.localUser = {
        id: this.generateId(),
        name: 'User-' + Math.random().toString(36).substr(2, 4)
      };
      localStorage.setItem('localUser', JSON.stringify(this.localUser));
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  getLocalUser() {
    return this.localUser;
  }

  updateUserName(name: string) {
    if (this.localUser) {
      this.localUser.name = name;
      localStorage.setItem('localUser', JSON.stringify(this.localUser));
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.sendUpdateName(name);
      } else {
        this.pendingNameUpdate = name;
      }
    }
  }

  private sendUpdateName(name: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN && this.localUser) {
      this.ws.send(JSON.stringify({ type: 'update-name', id: this.localUser.id, name }));
    }
  }

  sendMessage(content: string, receiverId?: string): any {
    if (!this.localUser || !this.ws || this.ws.readyState !== WebSocket.OPEN) return null;

    const messageId = this.generateId();
    const timestamp = Date.now();

    const messageData: any = {
      type: 'message',
      content,
      id: messageId,
      timestamp: timestamp,
      senderId: this.localUser.id,
      senderName: this.localUser.name,
    };

    if (receiverId) {
      messageData.receiverId = receiverId;
    }

    console.log('Sending message:', messageData);
    this.ws.send(JSON.stringify(messageData));

    // Return properly structured message data for the frontend
    return {
      id: messageId,
      content: content,
      timestamp: timestamp,
      senderId: this.localUser.id,
      senderName: this.localUser.name,
      receiverId: receiverId || null,
    };
  }

  sendReadReceipt(messageId: string, receiverId: string): void {
    if (!this.localUser || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const readReceipt = {
      type: 'read-receipt',
      messageId: messageId,
      senderId: this.localUser.id,
      receiverId: receiverId,
      timestamp: Date.now(),
    };

    console.log('Sending read receipt:', readReceipt);
    this.ws.send(JSON.stringify(readReceipt));
  }

  async sendFile(file: File, receiverId?: string): Promise<any> {
    if (!this.localUser || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('Cannot send file - WebSocket not ready or user not available');
      return null;
    }

    try {
      console.log('Starting file upload:', file.name, file.size, 'bytes');
      
      // Upload file to server
      const formData = new FormData();
      formData.append('file', file);

      const uploadUrl = getFileUploadUrl();
      console.log('Uploading to:', uploadUrl);
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`File upload failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const fileInfo = await response.json();
      console.log('File uploaded successfully:', fileInfo);

      // Send file message through WebSocket
      const messageId = this.generateId();
      const timestamp = Date.now();

      const messageData: any = {
        type: 'message',
        content: `Sent file: ${file.name}`,
        id: messageId,
        timestamp: timestamp,
        senderId: this.localUser!.id,
        senderName: this.localUser!.name,
        messageType: 'file',
        fileName: file.name,
        fileSize: file.size,
        fileId: fileInfo.filename,
      };

      if (receiverId) {
        messageData.receiverId = receiverId;
      }

      console.log('Sending file message:', messageData);
      this.ws!.send(JSON.stringify(messageData));

      // Return properly structured message data for the frontend
      return {
        id: messageId,
        content: `Sent file: ${file.name}`,
        timestamp: timestamp,
        senderId: this.localUser!.id,
        senderName: this.localUser!.name,
        receiverId: receiverId || null,
        type: 'file',
        fileName: file.name,
        fileSize: file.size,
        fileId: fileInfo.filename,
      };
    } catch (error) {
      console.error('Error sending file:', error);
      return null;
    }
  }

  onMessage(callback: (message: any) => void) {
    console.log('Adding message callback, total callbacks:', this.messageCallbacks.length + 1);
    this.messageCallbacks.push(callback);
  }

  onDeviceUpdate(callback: (devices: any[]) => void) {
    console.log('Adding device update callback, total callbacks:', this.deviceUpdateCallbacks.length + 1);
    this.deviceUpdateCallbacks.push(callback);
  }

  onConnectionStateChange(callback: (isConnected: boolean) => void) {
    console.log('Adding connection state callback, total callbacks:', this.connectionStateCallbacks.length + 1);
    this.connectionStateCallbacks.push(callback);
  }

  getOnlineDevices() {
    return Array.from(this.onlineDevices.values());
  }

  private notifyDeviceUpdate() {
    const devices = Array.from(this.onlineDevices.values());
    this.deviceUpdateCallbacks.forEach(callback => callback(devices));
  }

  private notifyConnectionStateChange() {
    this.connectionStateCallbacks.forEach(callback => callback(this.isConnected));
  }

  connect() {
    console.log('Manually connecting to WebSocket...');
    console.log('Current WebSocket state:', this.ws?.readyState);
    this.autoReconnect = true;
    this.reconnectAttempts = 0;
    
    // Small delay to ensure any existing connection is properly closed
    setTimeout(() => {
      this.start();
    }, 100);
  }

  disconnect() {
    console.log('Manually disconnecting from WebSocket...');
    this.autoReconnect = false;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.notifyConnectionStateChange();
    // Clear online devices and notify listeners so UI shows empty list when offline
    this.onlineDevices.clear();
    this.notifyDeviceUpdate();
    console.log('NetworkService disconnected');
  }

  getConnectionState(): boolean {
    return this.isConnected;
  }

  refreshDevices() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN && this.localUser) {
      console.log('Requesting fresh device list from server');
      // Send a request to get fresh device list
      const refreshMessage = { 
        type: 'refresh-devices', 
        id: this.localUser.id, 
        name: this.localUser.name,
        timestamp: Date.now()
      };
      this.ws.send(JSON.stringify(refreshMessage));
    } else {
      console.log('Cannot refresh devices - WebSocket not ready or user not available');
      console.log('WebSocket state:', this.ws?.readyState);
      console.log('User available:', !!this.localUser);
    }
  }
}
