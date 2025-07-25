export class NetworkService {
  private localUser: { id: string; name: string } | null = null;
  private onlineDevices: Map<string, any> = new Map();
  private messageCallbacks: ((message: any) => void)[] = [];
  private deviceUpdateCallbacks: ((devices: any[]) => void)[] = [];
  private broadcastChannel: BroadcastChannel;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeLocalUser();
    this.broadcastChannel = new BroadcastChannel('local-network-chat');
    this.setupBroadcastListener();
    this.startHeartbeat();
  }

  private initializeLocalUser() {
    const savedUser = localStorage.getItem('localUser');
    if (savedUser) {
      this.localUser = JSON.parse(savedUser);
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

  private setupBroadcastListener() {
    this.broadcastChannel.onmessage = (event) => {
      const data = event.data;
      
      switch (data.type) {
        case 'heartbeat':
          if (data.userId !== this.localUser?.id) {
            this.onlineDevices.set(data.userId, {
              id: data.userId,
              name: data.userName,
              lastSeen: Date.now(),
              isOnline: true
            });
            this.notifyDeviceUpdate();
          }
          break;
          
        case 'message':
          if (data.senderId !== this.localUser?.id) {
            this.messageCallbacks.forEach(callback => callback(data));
          }
          break;
          
        case 'user-update':
          if (data.userId !== this.localUser?.id) {
            const device = this.onlineDevices.get(data.userId);
            if (device) {
              device.name = data.userName;
              this.onlineDevices.set(data.userId, device);
              this.notifyDeviceUpdate();
            }
          }
          break;
          
        case 'user-offline':
          if (data.userId !== this.localUser?.id) {
            this.onlineDevices.delete(data.userId);
            this.notifyDeviceUpdate();
          }
          break;
      }
    };
  }

  private startHeartbeat() {
    // Send initial heartbeat
    this.sendHeartbeat();
    
    // Send heartbeat every 3 seconds
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
      this.cleanupOfflineDevices();
    }, 3000);
  }

  private sendHeartbeat() {
    if (this.localUser) {
      this.broadcastChannel.postMessage({
        type: 'heartbeat',
        userId: this.localUser.id,
        userName: this.localUser.name,
        timestamp: Date.now()
      });
    }
  }

  private cleanupOfflineDevices() {
    const now = Date.now();
    const offlineThreshold = 10000; // 10 seconds
    
    let hasChanges = false;
    this.onlineDevices.forEach((device, id) => {
      if (now - device.lastSeen > offlineThreshold) {
        this.onlineDevices.delete(id);
        hasChanges = true;
      }
    });
    
    if (hasChanges) {
      this.notifyDeviceUpdate();
    }
  }

  private notifyDeviceUpdate() {
    const devices = Array.from(this.onlineDevices.values());
    this.deviceUpdateCallbacks.forEach(callback => callback(devices));
  }

  getLocalUser() {
    return this.localUser;
  }

  updateUserName(name: string) {
    if (this.localUser) {
      this.localUser.name = name;
      localStorage.setItem('localUser', JSON.stringify(this.localUser));
      
      // Broadcast name change
      this.broadcastChannel.postMessage({
        type: 'user-update',
        userId: this.localUser.id,
        userName: name,
        timestamp: Date.now()
      });
    }
  }

  sendMessage(content: string): any {
    if (!this.localUser) return null;
    
    const messageData = {
      type: 'message',
      id: this.generateId(),
      senderId: this.localUser.id,
      senderName: this.localUser.name,
      content: content,
      timestamp: Date.now(),
      messageType: 'text'
    };

    this.broadcastChannel.postMessage(messageData);
    return messageData;
  }

  sendFile(file: File): any {
    if (!this.localUser) return null;
    
    const fileData = {
      type: 'message',
      id: this.generateId(),
      senderId: this.localUser.id,
      senderName: this.localUser.name,
      content: '',
      timestamp: Date.now(),
      messageType: 'file',
      fileName: file.name,
      fileSize: file.size
    };

    this.broadcastChannel.postMessage(fileData);
    return fileData;
  }

  onMessage(callback: (message: any) => void) {
    this.messageCallbacks.push(callback);
  }

  onDeviceUpdate(callback: (devices: any[]) => void) {
    this.deviceUpdateCallbacks.push(callback);
  }

  getOnlineDevices() {
    return Array.from(this.onlineDevices.values());
  }

  disconnect() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    // Notify others that we're going offline
    if (this.localUser) {
      this.broadcastChannel.postMessage({
        type: 'user-offline',
        userId: this.localUser.id,
        timestamp: Date.now()
      });
    }
    
    this.broadcastChannel.close();
  }
}