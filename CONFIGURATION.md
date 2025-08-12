# LocalChat Configuration Guide

This guide explains how to configure the LocalChat frontend for different environments.

## Quick Start

1. Copy the example environment file:
   ```bash
   cp env.example .env.local
   ```

2. Edit `.env.local` with your backend URLs:
   ```bash
   # For production (Render.com)
   VITE_WS_URL=wss://your-backend.onrender.com
   VITE_HTTP_URL=https://your-backend.onrender.com
   ```

3. Restart your development server:
   ```bash
   npm run dev
   ```

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_WS_URL` | WebSocket URL for real-time communication | `wss://your-backend.onrender.com` |
| `VITE_HTTP_URL` | HTTP URL for file uploads and API calls | `https://your-backend.onrender.com` |

### Optional Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `VITE_MAX_FILE_SIZE` | Maximum file size in bytes | `10485760` (10MB) | `20971520` (20MB) |
| `VITE_RECONNECT_ATTEMPTS` | WebSocket reconnection attempts | `5` | `10` |
| `VITE_RECONNECT_DELAY` | Base reconnection delay in ms | `1000` | `2000` |
| `VITE_MAX_RECONNECT_DELAY` | Maximum reconnection delay in ms | `10000` | `15000` |
| `VITE_MESSAGE_REFRESH_INTERVAL` | Device list refresh interval in ms | `5000` | `3000` |
| `VITE_MAX_MESSAGE_LENGTH` | Maximum characters per message | `1000` | `2000` |

## Environment Examples

### Development (Local Backend)
```bash
VITE_WS_URL=ws://localhost:3001
VITE_HTTP_URL=http://localhost:3001
```

### Production (Render.com)
```bash
VITE_WS_URL=wss://your-app-name.onrender.com
VITE_HTTP_URL=https://your-app-name.onrender.com
```

### Staging
```bash
VITE_WS_URL=wss://your-staging-app.onrender.com
VITE_HTTP_URL=https://your-staging-app.onrender.com
```

## Configuration File

The main configuration is in `src/config/index.ts`. This file:

- Loads environment variables
- Provides helper functions for URLs
- Contains default values
- Logs configuration in development mode

### Helper Functions

```typescript
import { getWsUrl, getFileUploadUrl, getFileDownloadUrl } from './config';

// Get WebSocket URL
const wsUrl = getWsUrl();

// Get file upload URL
const uploadUrl = getFileUploadUrl();

// Get file download URL
const downloadUrl = getFileDownloadUrl('filename.ext');
```

## File Structure

```
local-chat/
├── src/
│   └── config/
│       └── index.ts          # Main configuration
├── env.example              # Example environment file
├── .env.local               # Your local environment (create this)
└── CONFIGURATION.md         # This guide
```

## Troubleshooting

### Environment Variables Not Loading
- Make sure your `.env.local` file is in the root directory
- Restart your development server after changing environment variables
- Check that variable names start with `VITE_`

### Backend Connection Issues
- Verify your backend URLs are correct
- Check that your backend is running and accessible
- Ensure CORS is properly configured on your backend

### File Upload Issues
- Check that `VITE_HTTP_URL` points to your backend
- Verify file size limits match between frontend and backend
- Ensure your backend has the file upload endpoints configured

## Deployment

For production deployment (Netlify, Vercel, etc.):

1. Set environment variables in your deployment platform
2. Use the same `VITE_` prefix for all variables
3. Ensure your backend is deployed and accessible

### Netlify Example
```bash
# In Netlify dashboard or netlify.toml
VITE_WS_URL=wss://your-backend.onrender.com
VITE_HTTP_URL=https://your-backend.onrender.com
```
