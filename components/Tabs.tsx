import React from 'react';
import { FileNode, Tab } from '../types';
import { X, FileCode, FileJson, FileType } from 'lucide-react';

interface TabsProps {
  tabs: Tab[];
  activeTabId: string | null;
  files: FileNode[];
  onTabClick: (tabId: string) => void;
  onTabClose: (tabId: string, e: React.MouseEvent) => void;
}

const getFileIcon = (name: string) => {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  switch (ext) {
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
      return <FileCode size={14} className="text-yellow-500 dark:text-yellow-400" />;
    case 'py':
      return <FileCode size={14} className="text-blue-500 dark:text-blue-400" />;
    case 'html':
      return <FileCode size={14} className="text-orange-600 dark:text-orange-500" />;
    case 'css':
      return <FileCode size={14} className="text-blue-400 dark:text-blue-300" />;
    case 'json':
      return <FileJson size={14} className="text-green-500 dark:text-green-400" />;
    case 'md':
      return <FileType size={14} className="text-gray-500 dark:text-gray-300" />;
    default:
      return <FileType size={14} className="text-gray-400" />;
  }
};

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTabId, files, onTabClick, onTabClose }) => {
  return (
    <div className="flex bg-gray-50 dark:bg-[#0d1117] border-b border-gray-200 dark:border-gray-800 overflow-x-auto custom-scrollbar pt-1 h-9 transition-colors">
      {tabs.map(tab => {
        const file = files.find(f => f.id === tab.fileId);
        if (!file) return null;
        
        const isActive = activeTabId === tab.id;
        
        return (
          <div
            key={tab.id}
            onClick={() => onTabClick(tab.id)}
            className={`
              group flex items-center space-x-2 px-3 min-w-[120px] max-w-[200px] border-r border-gray-200 dark:border-gray-800 cursor-pointer select-none text-xs h-full relative transition-colors
              ${isActive 
                ? 'bg-white dark:bg-[#161b22] text-gray-900 dark:text-gray-100' 
                : 'bg-gray-100 dark:bg-[#0d1117] text-gray-500 dark:text-gray-500 hover:bg-white dark:hover:bg-[#161b22]'}
            `}
          >
            {/* Top Highlight Line for Active Tab */}
            {isActive && <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500"></div>}
            
            <span className="shrink-0 flex items-center">{getFileIcon(file.name)}</span>
            <span className="truncate flex-1">{file.name}</span>
            <button
              onClick={(e) => onTabClose(tab.id, e)}
              className={`p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'opacity-100' : ''}`}
            >
              <X size={12} />
            </button>
          </div>
        );
      })}
    </div>
  );
};