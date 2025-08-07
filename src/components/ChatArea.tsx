import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Download, File, ArrowLeft } from 'lucide-react';
import { Message } from '../types';

interface OnlineDevice {
  id: string;
  name: string;
  lastSeen: number;
  isOnline: boolean;
}

interface ChatAreaProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  onSendFile: (file: File) => void;
  currentUserId: string;
  selectedDevice?: OnlineDevice | null;
  onBack?: () => void; // <-- Add this prop
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  onSendMessage,
  onSendFile,
  currentUserId,
  selectedDevice,
  onBack
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (inputMessage.trim()) {
      onSendMessage(inputMessage.trim());
      setInputMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSendFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      onSendFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!selectedDevice) {
    return (
      <div className="flex-1 flex items-center justify-center text-white/60 text-lg">
        Select a device to start chatting
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 flex flex-col h-full">
      {/* Chat Header */}
      <div className="p-4 border-b border-white/10 flex items-center space-x-3">
        {onBack && (
          <button
            className="mr-2 p-1 rounded-full hover:bg-white/20 focus:outline-none"
            onClick={onBack}
          >
            <ArrowLeft className="w-6 h-6 text-blue-400" />
          </button>
        )}
        <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
          <File className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <p className="text-white font-medium text-lg">{selectedDevice.name}</p>
          <span className="text-xs text-green-400">Online</span>
        </div>
      </div>
      {/* Messages Area */}
      <div
        className={`flex-1 p-6 overflow-y-auto space-y-4 ${isDragging ? 'bg-blue-500/10' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {isDragging && (
          <div className="absolute inset-0 border-2 border-dashed border-blue-400 rounded-2xl bg-blue-500/20 flex items-center justify-center z-10">
            <div className="text-center">
              <File className="w-12 h-12 text-blue-400 mx-auto mb-2" />
              <p className="text-blue-400 font-medium">Drop file to share</p>
            </div>
          </div>
        )}
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send className="w-8 h-8 text-white/40" />
            </div>
            <p className="text-white/60 text-lg">No messages yet</p>
            <p className="text-white/40 text-sm mt-1">Start a conversation with {selectedDevice.name}</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                  message.senderId === currentUserId
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/20 text-white'
                }`}
              >
                {message.senderId !== currentUserId && (
                  <p className="text-xs opacity-70 mb-1">{message.senderName}</p>
                )}
                {message.type === 'text' ? (
                  <p className="break-words">{message.content}</p>
                ) : (
                  <div className="flex items-center space-x-2">
                    <File className="w-5 h-5" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{message.fileName}</p>
                      <p className="text-xs opacity-70">{formatFileSize(message.fileSize || 0)}</p>
                    </div>
                    <button className="p-1 hover:bg-white/20 rounded-md" title="Download file">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <p className="text-xs opacity-70 mt-1">{formatTime(message.timestamp)}</p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      {/* Input Area */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-end space-x-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 hover:bg-white/20 rounded-xl transition-colors"
          >
            <Paperclip className="w-5 h-5 text-white/70 hover:text-white" />
          </button>
          <div className="flex-1">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={`Type a message to ${selectedDevice.name}...`}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none max-h-32"
              rows={1}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!inputMessage.trim()}
            className="p-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors"
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};