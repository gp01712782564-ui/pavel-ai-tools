import React, { useEffect, useRef } from 'react';
import { TerminalMessage } from '../types';
import { Terminal as TerminalIcon, XCircle, Play } from 'lucide-react';

interface TerminalProps {
  messages: TerminalMessage[];
  isRunning: boolean;
  onClear: () => void;
}

export const Terminal: React.FC<TerminalProps> = ({ messages, isRunning, onClear }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0d1117] border-t border-gray-200 dark:border-gray-800 transition-colors">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-[#161b22] border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center space-x-2">
          <TerminalIcon size={14} className="text-gray-500 dark:text-gray-400" />
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Console</span>
          {isRunning && (
            <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] border border-blue-200 dark:border-blue-800">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400 animate-pulse"></span>
              <span>Running...</span>
            </span>
          )}
        </div>
        <button 
          onClick={onClear}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          title="Clear Console"
        >
          <XCircle size={14} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 font-mono text-sm space-y-1 custom-scrollbar bg-white dark:bg-[#0d1117]">
        {messages.length === 0 && (
          <div className="text-gray-500 dark:text-gray-600 italic text-xs mt-2">
            Ready to execute. Output will appear here.
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div key={idx} className={`break-words whitespace-pre-wrap ${
            msg.type === 'stderr' ? 'text-red-600 dark:text-red-400' : 
            msg.type === 'system' ? 'text-blue-600 dark:text-blue-400 italic' : 
            msg.type === 'info' ? 'text-gray-500' :
            'text-gray-800 dark:text-gray-300'
          }`}>
            <span className="opacity-30 mr-2 text-[10px] select-none">
              {new Date(msg.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}
            </span>
            {msg.type === 'system' && '> '}
            {msg.content}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};