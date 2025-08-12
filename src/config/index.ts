// Configuration for the LocalChat application
export const config = {
  // Backend URLs
  backend: {
    // WebSocket URL for real-time communication
    wsUrl: import.meta.env.VITE_WS_URL || 'wss://local-chat-be.onrender.com',
    // HTTP URL for file uploads and other API calls
    httpUrl: import.meta.env.VITE_HTTP_URL || 'https://local-chat-be.onrender.com',
  },
  
  // File upload settings
  fileUpload: {
    maxSize: parseInt(import.meta.env.VITE_MAX_FILE_SIZE || '10485760'), // 10MB in bytes
    allowedTypes: [
      'image/*',
      'application/pdf',
      'text/*',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/zip',
      'application/x-rar-compressed'
    ]
  },
  
  // WebSocket settings
  websocket: {
    reconnectAttempts: parseInt(import.meta.env.VITE_RECONNECT_ATTEMPTS || '5'),
    reconnectDelay: parseInt(import.meta.env.VITE_RECONNECT_DELAY || '1000'), // Base delay in ms
    maxReconnectDelay: parseInt(import.meta.env.VITE_MAX_RECONNECT_DELAY || '10000'), // Maximum delay in ms
  },
  
  // UI settings
  ui: {
    messageRefreshInterval: parseInt(import.meta.env.VITE_MESSAGE_REFRESH_INTERVAL || '5000'), // How often to refresh device list (ms)
    maxMessageLength: parseInt(import.meta.env.VITE_MAX_MESSAGE_LENGTH || '1000'), // Maximum characters per message
  }
};

// Helper function to get full API URL
export const getApiUrl = (endpoint: string): string => {
  return `${config.backend.httpUrl}${endpoint}`;
};

// Helper function to get WebSocket URL
export const getWsUrl = (): string => {
  return config.backend.wsUrl;
};

// Helper function to get file upload URL
export const getFileUploadUrl = (): string => {
  return getApiUrl('/upload');
};

// Helper function to get file download URL
export const getFileDownloadUrl = (fileId: string): string => {
  return getApiUrl(`/files/${fileId}`);
};

// Environment detection
export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;

// Log configuration in development
if (isDevelopment) {
  console.log('LocalChat Configuration:', {
    backend: config.backend,
    fileUpload: config.fileUpload,
    websocket: config.websocket,
    ui: config.ui
  });
}
