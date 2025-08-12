#!/bin/bash

# Setup script for LocalChat environment configuration

echo "Setting up LocalChat environment configuration..."

# Create .env.local file
cat > .env.local << EOF
# LocalChat Environment Configuration
# Backend URLs for production (Render.com)
VITE_WS_URL=wss://local-chat-be.onrender.com
VITE_HTTP_URL=https://local-chat-be.onrender.com

# Optional: Override other settings if needed
# VITE_MAX_FILE_SIZE=10485760
# VITE_RECONNECT_ATTEMPTS=5
# VITE_MESSAGE_REFRESH_INTERVAL=5000
EOF

echo "✅ Created .env.local file with production backend URLs"
echo ""
echo "📋 Configuration:"
echo "   WebSocket URL: wss://local-chat-be.onrender.com"
echo "   HTTP URL: https://local-chat-be.onrender.com"
echo ""
echo "🔄 Restart your development server to apply changes:"
echo "   npm run dev"
echo ""
echo "🧪 Test file sharing with:"
echo "   Open debug-file-upload.html in your browser"
