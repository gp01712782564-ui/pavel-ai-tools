import React, { useState, useEffect, useRef } from 'react';
import { Search, Command, ArrowRight } from 'lucide-react';

export interface CommandItem {
  id: string;
  label: string;
  category: string;
  shortcut?: string;
  action: () => void;
}

interface CommandPaletteProps {
  commands: CommandItem[];
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ commands, isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredCommands = commands.filter(cmd =>
    cmd.label.toLowerCase().includes(query.toLowerCase()) ||
    cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-black/40 backdrop-blur-[2px] transition-all" 
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl bg-white dark:bg-[#161b22] rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col transform transition-all animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <Search className="w-5 h-5 text-gray-400 mr-3" />
          <input
            ref={inputRef}
            className="flex-1 bg-transparent outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 text-sm"
            placeholder="Type a command..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="hidden sm:flex items-center space-x-1">
             <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-[10px] text-gray-500 font-mono">ESC</kbd>
          </div>
        </div>
        
        <div className="max-h-[350px] overflow-y-auto py-2 custom-scrollbar">
          {filteredCommands.length === 0 ? (
            <div className="px-4 py-8 text-sm text-gray-500 text-center">
                <p>No matching commands found.</p>
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => (
              <button
                key={cmd.id}
                className={`w-full text-left px-4 py-3 flex items-center justify-between text-sm transition-colors ${
                  idx === selectedIndex 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                onClick={() => { cmd.action(); onClose(); }}
                onMouseEnter={() => setSelectedIndex(idx)}
              >
                <div className="flex items-center space-x-3">
                    <div className={`p-1 rounded ${idx === selectedIndex ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-700'}`}>
                        <Command size={14} className={idx === selectedIndex ? 'text-white' : 'text-gray-500 dark:text-gray-400'} />
                    </div>
                    <div>
                        <span className="font-medium block">{cmd.label}</span>
                        <span className={`text-[10px] ${idx === selectedIndex ? 'text-indigo-200' : 'text-gray-400'}`}>{cmd.category}</span>
                    </div>
                </div>
                {cmd.shortcut && (
                  <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${
                      idx === selectedIndex ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                  }`}>
                    {cmd.shortcut}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
        
        <div className="px-4 py-2 bg-gray-50 dark:bg-[#0d1117] border-t border-gray-200 dark:border-gray-800 text-[10px] text-gray-500 flex justify-between items-center">
            <span>Use <strong>↑</strong> <strong>↓</strong> to navigate</span>
            <span><strong>↵</strong> to select</span>
        </div>
      </div>
    </div>
  );
};