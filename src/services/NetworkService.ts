export class NetworkService {
  private localUser: { id: string; name: string } | null = null;
  private onlineDevices: Map<string, any> = new Map();
  private messageCallbacks: ((message: any) => void)[] = [];
  private deviceUpdateCallbacks: ((devices: any[]) => void)[] = [];
  private ws: WebSocket | null = null;
  private pendingNameUpdate: string | null = null;

  constructor() {
    this.initializeLocalUser();
  }

  start() {
    if (!this.ws) {
      this.ws = new WebSocket('ws://localhost:3001');
      this.ws.onopen = () => {
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
            this.onlineDevices.clear();
            data.devices.forEach((device: any) => {
              this.onlineDevices.set(device.id, device);
            });
            this.notifyDeviceUpdate();
            break;
          case 'message':
            this.messageCallbacks.forEach(callback => callback(data));
            break;
        }
      };
      this.ws.onclose = () => {
        this.ws = null;
      };
    }
  }

  private sendInit() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN && this.localUser) {
      this.ws.send(JSON.stringify({ type: 'init', id: this.localUser.id, name: this.localUser.name }));
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
    const messageData: any = {
      type: 'message',
      content,
    };
    if (receiverId) {
      messageData.receiverId = receiverId;
    }
    console.log('Sending message:', messageData);
    this.ws.send(JSON.stringify(messageData));
    // The backend will broadcast or send one-to-one as appropriate
    return messageData;
  }

  sendFile(file: File): any {
    // File transfer not implemented in backend yet
    return null;
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

  private notifyDeviceUpdate() {
    const devices = Array.from(this.onlineDevices.values());
    this.deviceUpdateCallbacks.forEach(callback => callback(devices));
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}