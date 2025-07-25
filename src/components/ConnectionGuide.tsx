import React from 'react';
import { Wifi, Smartphone, Share2, MessageSquare } from 'lucide-react';

export const ConnectionGuide: React.FC = () => {
  const steps = [
    {
      icon: <Wifi className="w-6 h-6" />,
      title: "Same Network",
      description: "All devices must be on the same Wi-Fi network"
    },
    {
      icon: <Smartphone className="w-6 h-6" />,
      title: "Open App",
      description: "Open this app on other devices to chat with"
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: "Auto Discovery",
      description: "Devices will appear online automatically - no connection needed"
    },
    {
      icon: <Share2 className="w-6 h-6" />,
      title: "Start Chatting",
      description: "Send messages and files instantly to any online device"
    }
  ];

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
      <h3 className="text-lg font-semibold text-white mb-4">How to Connect</h3>
      
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={index} className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <div className="text-blue-400">
                {step.icon}
              </div>
            </div>
            <div>
              <h4 className="text-white font-medium">{step.title}</h4>
              <p className="text-white/70 text-sm mt-1">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
        <p className="text-yellow-400 text-sm">
          <strong>Note:</strong> This uses browser's BroadcastChannel API for local communication. 
          All devices must have this app open in their browser on the same network.
        </p>
      </div>
    </div>
  );
};