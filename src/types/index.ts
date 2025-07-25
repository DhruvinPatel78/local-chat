export interface User {
  id: string;
  name: string;
  lastSeen: number;
  isOnline: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: number;
  type: 'text' | 'file';
  fileName?: string;
  fileSize?: number;
}

export interface OnlineDevice {
  id: string;
  name: string;
  lastSeen: number;
  isOnline: boolean;
}

export interface FileTransfer {
  id: string;
  fileName: string;
  fileSize: number;
  progress: number;
  status: 'sending' | 'receiving' | 'completed' | 'failed';
}