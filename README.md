# Local Network Chat - Desktop App

A cross-platform desktop application for local network communication built with React, TypeScript, and Electron.

## Features

- 🖥️ Cross-platform desktop app (Mac, Windows, Linux)
- 💬 Real-time messaging between devices on the same network
- 📁 File sharing capabilities
- 🔄 Auto-discovery of online devices
- 🎨 Beautiful, modern UI with glassmorphism design

## Development

### Prerequisites

- Node.js 16 or higher
- npm or yarn

### Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run electron:dev
```

This will start both the Vite dev server and Electron in development mode.

### Building

#### Build for all platforms:
```bash
npm run dist
```

#### Build for specific platforms:
```bash
# macOS
npm run dist:mac

# Windows
npm run dist:win

# Linux
npm run dist:linux
```

### Available Scripts

- `npm run dev` - Start Vite development server
- `npm run electron` - Start Electron (requires built files)
- `npm run electron:dev` - Start both Vite and Electron in development mode
- `npm run build` - Build web assets
- `npm run build:electron` - Build and package Electron app
- `npm run dist` - Build and create distributables for current platform
- `npm run dist:mac` - Build macOS distributables (.dmg)
- `npm run dist:win` - Build Windows distributables (.exe)
- `npm run dist:linux` - Build Linux distributables (.AppImage, .deb)

## Distribution

The built applications will be available in the `dist-electron` directory:

- **macOS**: `.dmg` installer
- **Windows**: `.exe` installer (NSIS)
- **Linux**: `.AppImage` (portable) and `.deb` (Debian/Ubuntu)

## How It Works

The app uses the browser's BroadcastChannel API to communicate between instances running on the same network. Each device running the app will automatically discover other devices and allow real-time messaging and file sharing.

## Security

- The Electron app runs with security best practices enabled
- No Node.js integration in the renderer process
- Context isolation enabled
- External links open in the default browser

## Customization

To customize the app:

1. Update `package.json` build configuration
2. Replace the icon in `electron/assets/icon.png`
3. Modify app metadata in `electron-builder.yml`
4. Update the app name and identifier in the build configuration