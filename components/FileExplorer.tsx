import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { FileSystem, FileNode } from '../types';
import { LANGUAGE_MAP } from '../constants';
import { 
  Folder, 
  FolderOpen, 
  FileCode, 
  FileJson, 
  FileType, 
  ChevronRight, 
  ChevronDown, 
  FilePlus, 
  FolderPlus,
  Trash2,
  Edit2,
  Sparkles,
  Plus,
  Save,
  CloudUpload
} from 'lucide-react';

interface FileExplorerProps {
  files: FileSystem;
  activeFileId: string | null;
  onFileSelect: (fileId: string) => void;
  onFileCreate: (name: string, type: 'file' | 'folder', parentId: string) => void;
  onAiFileCreate: (name: string, description: string, parentId: string) => void;
  onDelete: (fileId: string) => void;
  onToggleFolder: (folderId: string) => void;
  onRename: (id: string, newName: string) => void;
  onMove: (fileId: string, newParentId: string) => void;
  onOpenGitHub: () => void;
}

export interface FileExplorerRef {
  triggerNewFile: () => void;
  triggerNewFolder: () => void;
  triggerNewAiFile: () => void;
  triggerRename: (fileId: string) => void;
}

const FileIcon = ({ name, type }: { name: string; type: 'file' | 'folder' }) => {
  if (type === 'folder') return null;
  
  const ext = name.split('.').pop()?.toLowerCase() || '';
  
  switch (ext) {
    case 'js':
    case 'ts':
    case 'jsx':
    case 'tsx':
      return <FileCode className="w-4 h-4 text-yellow-500" />;
    case 'py':
      return <FileCode className="w-4 h-4 text-blue-500" />;
    case 'html':
      return <FileCode className="w-4 h-4 text-orange-600" />;
    case 'css':
      return <FileCode className="w-4 h-4 text-blue-400" />;
    case 'json':
      return <FileJson className="w-4 h-4 text-green-500" />;
    case 'md':
      return <FileType className="w-4 h-4 text-gray-400" />;
    default:
      return <FileType className="w-4 h-4 text-gray-400" />;
  }
};

export const FileExplorer = forwardRef<FileExplorerRef, FileExplorerProps>(({ 
  files, 
  activeFileId, 
  onFileSelect, 
  onFileCreate,
  onAiFileCreate,
  onDelete,
  onToggleFolder,
  onRename,
  onMove,
  onOpenGitHub
}, ref) => {
  const [newFileParent, setNewFileParent] = useState<string | null>(null);
  const [newFileType, setNewFileType] = useState<'file' | 'folder' | 'ai-file' | null>(null);
  const [newFileName, setNewFileName] = useState('');
  const [newFileDescription, setNewFileDescription] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLInputElement>(null);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

  // Helper to handle header creation logic
  const handleHeaderCreate = (type: 'file' | 'folder' | 'ai-file') => {
    let parentId = 'root';
    const targetId = selectedNodeId || activeFileId;
    if (targetId) {
      const activeNode = files.find(f => f.id === targetId);
      if (activeNode) {
        parentId = activeNode.parentId || 'root';
      }
    }
    if (parentId !== 'root') {
      const parentNode = files.find(f => f.id === parentId);
      if (parentNode && !parentNode.isOpen) onToggleFolder(parentId);
    }
    setNewFileParent(parentId);
    setNewFileType(type);
    setNewFileName('');
    setNewFileDescription('');
  };

  useImperativeHandle(ref, () => ({
    triggerNewFile: () => handleHeaderCreate('file'),
    triggerNewFolder: () => handleHeaderCreate('folder'),
    triggerNewAiFile: () => handleHeaderCreate('ai-file'),
    triggerRename: (fileId: string) => {
        const node = files.find(f => f.id === fileId);
        if (node) {
            setEditingId(node.id);
            setEditValue(node.name);
        }
    }
  }));

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingId]);

  useEffect(() => {
    if (activeFileId) setSelectedNodeId(activeFileId);
  }, [activeFileId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2' && selectedNodeId && !editingId) {
        const node = files.find(f => f.id === selectedNodeId);
        if (node) {
          setEditingId(node.id);
          setEditValue(node.name);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, editingId, files]);

  const handleCreateSubmit = (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (newFileName && newFileParent && newFileType) {
      if (newFileType === 'ai-file') {
        if (!newFileDescription.trim()) return;
        onAiFileCreate(newFileName, newFileDescription, newFileParent);
      } else {
        onFileCreate(newFileName, newFileType, newFileParent);
      }
      setNewFileParent(null);
      setNewFileType(null);
      setNewFileName('');
      setNewFileDescription('');
    }
  };

  const startRenaming = (e: React.SyntheticEvent | null, node: FileNode) => {
    e?.stopPropagation();
    setEditingId(node.id);
    setEditValue(node.name);
  };

  const confirmRename = () => {
    if (editingId && editValue.trim()) {
      onRename(editingId, editValue.trim());
    }
    setEditingId(null);
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    confirmRename();
  };

  const handleDragStart = (e: React.DragEvent, node: FileNode) => {
    e.dataTransfer.setData('fileId', node.id);
    e.stopPropagation();
  };

  const handleDragOver = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragOverFolderId !== folderId) setDragOverFolderId(folderId);
  };

  const handleDrop = (e: React.DragEvent, targetFolderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolderId(null);
    const draggedId = e.dataTransfer.getData('fileId');
    if (draggedId && draggedId !== targetFolderId) onMove(draggedId, targetFolderId);
  };

  const renderInputForm = (depth: number) => {
    return (
      <form onSubmit={handleCreateSubmit} className="px-2 py-1" style={{ paddingLeft: `${depth * 16 + 12}px` }}>
        <div className={`
            flex flex-col space-y-1 bg-white/10 border rounded px-2 py-1.5 shadow-sm
            ${newFileType === 'ai-file' ? 'border-purple-400 bg-purple-900/20' : 'border-indigo-300'}
        `}>
            <div className="flex items-center">
              {newFileType === 'folder' ? <Folder size={14} className="mr-2 text-indigo-200"/> 
              : newFileType === 'ai-file' ? <Sparkles size={14} className="mr-2 text-purple-300 animate-pulse"/>
              : <FileCode size={14} className="mr-2 text-indigo-200"/>}
              <input
                autoFocus
                type="text"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newFileType === 'ai-file' && !newFileDescription) {
                            descriptionInputRef.current?.focus();
                        } else {
                            handleCreateSubmit(e);
                        }
                    } else if (e.key === 'Escape') {
                        setNewFileType(null);
                        setNewFileParent(null);
                    }
                }}
                className="bg-transparent text-sm text-white placeholder-indigo-200 outline-none w-full"
                placeholder={newFileType === 'folder' ? "Folder name..." : "File name..."}
              />
            </div>
            {newFileType === 'ai-file' && (
                <input
                  ref={descriptionInputRef}
                  type="text"
                  value={newFileDescription}
                  onChange={(e) => setNewFileDescription(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateSubmit(e);
                    if (e.key === 'Escape') {
                        setNewFileType(null);
                        setNewFileParent(null);
                    }
                  }}
                  className="bg-indigo-900/50 text-xs text-white outline-none w-full px-1 py-1 rounded border border-indigo-700 placeholder-indigo-400"
                  placeholder="Describe file purpose..."
                />
            )}
        </div>
      </form>
    );
  };

  const renderTree = (parentId: string | null, depth = 0) => {
    const nodes = files.filter(f => f.parentId === parentId);
    
    return nodes.map(node => {
      const isFolder = node.type === 'folder';
      const isOpen = node.isOpen;
      const isActive = node.id === activeFileId;
      const isSelected = node.id === selectedNodeId;
      const isEditing = editingId === node.id;
      const isDragOver = dragOverFolderId === node.id;

      return (
        <div key={node.id}>
          <div 
            draggable={!isEditing}
            onDragStart={(e) => handleDragStart(e, node)}
            onDragOver={(e) => isFolder ? handleDragOver(e, node.id) : undefined}
            onDrop={(e) => isFolder ? handleDrop(e, node.id) : undefined}
            className={`
              flex items-center group px-3 py-1.5 cursor-pointer select-none text-sm transition-all rounded-r-md mr-2
              ${isDragOver ? 'bg-indigo-400/30' : ''}
              ${isActive && !isEditing
                ? 'bg-white/10 text-white font-medium border-l-2 border-green-400' 
                : isSelected && !isEditing
                    ? 'bg-indigo-800/30 text-white'
                    : 'text-indigo-100 hover:bg-indigo-800/30 hover:text-white'}
            `}
            style={{ paddingLeft: `${depth * 16 + 12}px` }}
            onClick={(e) => {
                e.stopPropagation();
                if (isEditing) return;
                setSelectedNodeId(node.id);
                isFolder ? onToggleFolder(node.id) : onFileSelect(node.id);
            }}
            onDoubleClick={(e) => {
                e.stopPropagation();
                startRenaming(e, node);
            }}
          >
            <div className="flex items-center flex-1 min-w-0">
              {isFolder && (
                <span className="mr-1.5 opacity-70">
                  {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </span>
              )}
              
              <span className="mr-2 shrink-0">
                {isFolder ? (
                  isOpen ? <FolderOpen className="w-4 h-4 text-indigo-300" /> : <Folder className="w-4 h-4 text-indigo-300" />
                ) : (
                  <FileIcon name={node.name} type={node.type} />
                )}
              </span>
              
              {isEditing ? (
                 <form onSubmit={handleRenameSubmit} className="flex-1 min-w-0" onClick={e => e.stopPropagation()}>
                    <input
                      ref={editInputRef}
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={confirmRename}
                      className="bg-indigo-900 text-sm text-white outline-none w-full border border-indigo-400 rounded px-1 py-0.5"
                    />
                 </form>
              ) : (
                <span className="truncate">{node.name}</span>
              )}
            </div>

            {!isEditing && (
                <div className="hidden group-hover:flex items-center space-x-1 opacity-80">
                {isFolder && (
                    <>
                    <button 
                        onClick={(e) => { e.stopPropagation(); setNewFileParent(node.id); setNewFileType('file'); }} 
                        className="p-1 hover:text-green-300"
                        title="New File"
                    >
                        <FilePlus size={12} />
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); setNewFileParent(node.id); setNewFileType('ai-file'); }} 
                        className="p-1 hover:text-purple-300"
                        title="New AI File"
                    >
                        <Sparkles size={12} />
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); setNewFileParent(node.id); setNewFileType('folder'); }} 
                        className="p-1 hover:text-blue-300"
                        title="New Folder"
                    >
                        <FolderPlus size={12} />
                    </button>
                    </>
                )}
                {node.id !== 'root' && (
                    <button onClick={(e) => { e.stopPropagation(); onDelete(node.id); }} className="p-1 hover:text-red-400" title="Delete"><Trash2 size={12} /></button>
                )}
                </div>
            )}
          </div>
          {newFileParent === node.id && isOpen && renderInputForm(depth + 1)}
          {isFolder && isOpen && renderTree(node.id, depth + 1)}
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col h-full bg-indigo-600 w-64 select-none flex-shrink-0 shadow-xl z-20">
      {/* Sidebar Header */}
      <div className="p-4 bg-indigo-700/50">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Project Files</h2>
          <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => handleHeaderCreate('file')}
                className="flex items-center justify-center space-x-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-md font-semibold text-xs transition-colors shadow-lg"
                title="Create a new empty file"
              >
                  <Plus size={14} />
                  <span>New File</span>
              </button>
              <button 
                onClick={() => handleHeaderCreate('ai-file')}
                className="flex items-center justify-center space-x-1 bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-md font-semibold text-xs transition-colors shadow-lg"
                title="Generate a file with AI"
              >
                  <Sparkles size={14} />
                  <span>AI File</span>
              </button>
              <button 
                onClick={() => handleHeaderCreate('folder')}
                className="flex items-center justify-center space-x-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-md font-semibold text-xs transition-colors shadow-lg"
                title="Create a new folder"
              >
                  <FolderPlus size={14} />
                  <span>Folder</span>
              </button>
              <button 
                onClick={onOpenGitHub}
                className="flex items-center justify-center space-x-1 bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-md font-semibold text-xs transition-colors shadow-lg"
                title="Save project to GitHub"
              >
                  <CloudUpload size={14} />
                  <span>Save</span>
              </button>
          </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto custom-scrollbar-indigo py-2">
        {newFileParent === 'root' && renderInputForm(0)}
        {renderTree('root')}
      </div>
      
      {/* Promo/Info Area */}
      <div className="p-4 bg-indigo-800/30 text-indigo-200 text-xs text-center border-t border-indigo-500/30">
          <p>Pavel AI Tools</p>
          <p className="opacity-60 mt-1">v3.0.0 • Enterprise</p>
      </div>
    </div>
  );
});

FileExplorer.displayName = "FileExplorer";