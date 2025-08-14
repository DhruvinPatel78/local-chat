import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
        
        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          console.log('Received message from service worker:', event.data);
          if (event.data && event.data.type === 'APP_STATE_CHANGE') {
            // Notify the app about state changes
            window.dispatchEvent(new CustomEvent('appStateChange', {
              detail: event.data
            }));
          }
        });

        // PWA-specific app close detection
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        if (isStandalone) {
          console.log('PWA detected in standalone mode');
          
          // Handle PWA app close
          window.addEventListener('beforeunload', () => {
            console.log('PWA app closing detected');
            // Send message to service worker about app close
            if (navigator.serviceWorker.controller) {
              navigator.serviceWorker.controller.postMessage({
                type: 'PWA_APP_CLOSE',
                timestamp: Date.now()
              });
            }
          });

          // Handle PWA app going to background
          document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
              console.log('PWA app going to background');
              // Send message to service worker about app background
              if (navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                  type: 'PWA_APP_BACKGROUND',
                  timestamp: Date.now()
                });
              }
            }
          });
        }
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// PWA Install Prompt
let deferredPrompt: any;

// Check if app is already installed
function isAppInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as any).standalone === true;
}

// Show install prompt if app is not installed
function showInstallPrompt() {
  if (isAppInstalled()) {
    console.log('App is already installed, not showing install prompt');
    return;
  }
  
  const installPrompt = document.getElementById('pwa-install-prompt');
  const installBanner = document.getElementById('pwa-install-banner');
  
  if (installPrompt) {
    installPrompt.classList.remove('hidden');
    console.log('Showing main install prompt');
  }
  
  // Show banner after a delay if main prompt is dismissed
  setTimeout(() => {
    if (installBanner && !isAppInstalled()) {
      installBanner.classList.remove('hidden');
      console.log('Showing install banner');
    }
  }, 3000);
  
  // If no deferredPrompt is available yet, log it for debugging
  if (!deferredPrompt) {
    console.log('No deferred prompt available, waiting for beforeinstallprompt event...');
  }
}

// Hide install prompt
function hideInstallPrompt() {
  const installPrompt = document.getElementById('pwa-install-prompt');
  const installBanner = document.getElementById('pwa-install-banner');
  
  if (installPrompt) {
    installPrompt.classList.add('hidden');
  }
  if (installBanner) {
    installBanner.classList.add('hidden');
  }
}

// Setup install prompt event listeners
function setupInstallPromptListeners() {
  console.log('Setting up install prompt listeners...');
  
  // Use event delegation for better reliability
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    
    if (target.id === 'pwa-install-btn') {
      console.log('Install button clicked!');
      e.preventDefault();
      e.stopPropagation();
      
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult: any) => {
          console.log(`User response to the install prompt: ${choiceResult.outcome}`);
          deferredPrompt = null;
          hideInstallPrompt();
        });
      } else {
        console.log('No deferred prompt available, showing manual instructions');
        alert('To install ChitChat:\n\n1. Look for the install icon (📥) in your browser address bar\n2. Or go to browser menu → "Add to Home Screen"\n3. Or use Chrome DevTools → Application → Manifest → Install');
      }
    }
    
    if (target.id === 'pwa-dismiss-btn') {
      console.log('Dismiss button clicked!');
      e.preventDefault();
      e.stopPropagation();
      hideInstallPrompt();
    }
    
    if (target.id === 'pwa-banner-install-btn') {
      console.log('Banner install button clicked!');
      e.preventDefault();
      e.stopPropagation();
      
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult: any) => {
          console.log(`User response to the banner install prompt: ${choiceResult.outcome}`);
          deferredPrompt = null;
          hideInstallPrompt();
        });
      } else {
        console.log('No deferred prompt available for banner');
        alert('To install ChitChat:\n\n1. Look for the install icon (📥) in your browser address bar\n2. Or go to browser menu → "Add to Home Screen"\n3. Or use Chrome DevTools → Application → Manifest → Install');
      }
    }
    
    if (target.id === 'pwa-banner-dismiss-btn') {
      console.log('Banner dismiss button clicked!');
      e.preventDefault();
      e.stopPropagation();
      const installBanner = document.getElementById('pwa-install-banner');
      if (installBanner) {
        installBanner.classList.add('hidden');
      }
    }
  });
}

// Show prompt on page load if not installed
window.addEventListener('load', () => {
  // Setup listeners first
  setupInstallPromptListeners();
  
  // Small delay to ensure DOM is ready
  setTimeout(showInstallPrompt, 1000);
});

window.addEventListener('beforeinstallprompt', (e) => {
  console.log('beforeinstallprompt event fired!');
  e.preventDefault();
  deferredPrompt = e;
  
  // Setup listeners again in case they weren't ready before
  setupInstallPromptListeners();
});

// Hide prompt when app is successfully installed
window.addEventListener('appinstalled', () => {
  console.log('App was installed');
  hideInstallPrompt();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
