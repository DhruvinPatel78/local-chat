export class NetworkService {
  private localUser: { id: string; name: string } | null = null;
  private onlineDevices: Map<string, any> = new Map();
  private messageCallbacks: ((message: any) => void)[] = [];
  private deviceUpdateCallbacks: ((devices: any[]) => void)[] = [];
  private ws: WebSocket | null = null;
  private pendingNameUpdate: string | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  constructor() {
    this.initializeLocalUser();
    console.log('NetworkService initialized with user:', this.localUser);
  }

  start() {
    if (!this.ws) {
      console.log('Starting WebSocket connection to wss://local-chat-be.onrender.com');
      this.ws = new WebSocket('wss://local-chat-be.onrender.com');

      this.ws.onopen = () => {
        console.log('WebSocket connected successfully to wss://local-chat-be.onrender.com');
        this.isConnected = true;
        this.reconnectAttempts = 0;
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
            // Only update if we have devices, don't clear on empty arrays
            if (data.devices && data.devices.length > 0) {
              this.onlineDevices.clear();
              data.devices.forEach((device: any) => {
                this.onlineDevices.set(device.id, device);
              });
              console.log('Updated online devices map:', Array.from(this.onlineDevices.values()));
              this.notifyDeviceUpdate();
            } else {
              console.log('Received empty devices array, keeping current devices');
            }
            break;
          case 'message':
            console.log('NetworkService received message:', data);
            this.messageCallbacks.forEach(callback => callback(data));
            break;
        }
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket connection closed', event.code, event.reason);
        this.isConnected = false;
        this.ws = null;

        // Try to reconnect if we haven't exceeded max attempts
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000); // Exponential backoff
          console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
          setTimeout(() => {
            this.start();
          }, delay);
        } else {
          console.error('Max reconnection attempts reached');
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
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

  sendFile(file: File): any {
    // File transfer not implemented in backend yet
    return null;
  }

  onMessage(callback: (message: any) => void) {
    console.log('Adding message callback, total callbacks:', this.messageCallbacks.length + 1);
    this.messageCallbacks.push(callback);
  }

  onDeviceUpdate(callback: (devices: any[]) => void) {
    console.log('Adding device update callback, total callbacks:', this.deviceUpdateCallbacks.length + 1);
    this.deviceUpdateCallbacks.push(callback);
  }

  getOnlineDevices() {
    return Array.from(this.onlineDevices.values());
  }

  private notifyDeviceUpdate() {
    const devices = Array.from(this.onlineDevices.values());
    this.deviceUpdateCallbacks.forEach(callback => callback(devices));
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    // Clear all callbacks to prevent duplicate handling
    this.messageCallbacks = [];
    this.deviceUpdateCallbacks = [];
    console.log('NetworkService disconnected and callbacks cleared');
  }
}
