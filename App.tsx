import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Play, Terminal as TerminalIcon, Bot, Save, Moon, Sun, Github, GitBranch, Share2, MessageSquare, LayoutTemplate, User, Users, Globe, ChevronDown, CheckCircle, Code2, Loader2, Circle, Clock } from 'lucide-react';
import { FileExplorer, FileExplorerRef } from './components/FileExplorer';
import { CodeEditor } from './components/CodeEditor';
import { Terminal } from './components/Terminal';
import { WebPreview } from './components/WebPreview';
import { AIChatPanel } from './components/AIChatPanel';
import { Tabs } from './components/Tabs';
import { GitHubModal } from './components/GitHubModal';
import { CommandPalette, CommandItem } from './components/CommandPalette';
import { executeCode, chatWithAi, generateFileContent, analyzeProject, generateImage } from './services/geminiService';
import { FileSystem, FileNode, Tab, TerminalMessage, ChatMessage, PanelMode } from './types';
import { INITIAL_FILES, LANGUAGE_MAP } from './constants';
import { getCurrentUser, type GitHubUser } from './services/githubService';

const generateId = () => Math.random().toString(36).substr(2, 9);

export default function App() {
  // --- State Initialization ---
  const [files, setFiles] = useState<FileSystem>(() => {
    try {
      const saved = localStorage.getItem('pavel-ai-tools-files');
      return saved ? JSON.parse(saved) : INITIAL_FILES;
    } catch {
      return INITIAL_FILES;
    }
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      return localStorage.getItem('pavel-ai-tools-theme') !== 'light';
    } catch {
      return true;
    }
  });

  // Tabs logic
  const initialReadme = files.find(f => f.name === 'README.md');
  const [tabs, setTabs] = useState<Tab[]>(() => initialReadme ? [{ id: generateId(), fileId: initialReadme.id }] : []);
  const [activeTabId, setActiveTabId] = useState<string | null>(() => tabs.length > 0 ? tabs[0].id : null);
  const [tabHistory, setTabHistory] = useState<string[]>(() => tabs.length > 0 ? [tabs[0].id] : []);

  // UI State
  const [terminalMessages, setTerminalMessages] = useState<TerminalMessage[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [activePanel, setActivePanel] = useState<PanelMode>('terminal');
  const [showPanel, setShowPanel] = useState(true);
  const [isPreviewActive, setIsPreviewActive] = useState(false);
  const [previewTrigger, setPreviewTrigger] = useState(0);
  
  // Save State
  const [saveStatus, setSaveStatus] = useState<'ready' | 'unsaved' | 'saving' | 'saved'>('ready');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  
  // Modals & User
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [githubUser, setGithubUser] = useState<GitHubUser | null>(null);

  const filesRef = useRef(files);
  const fileExplorerRef = useRef<FileExplorerRef>(null);
  const activeTab = tabs.find(t => t.id === activeTabId);
  const activeFile = activeTab ? files.find(f => f.id === activeTab.fileId) : undefined;
  const isFirstRender = useRef(true);

  // --- Effects ---
  useEffect(() => { filesRef.current = files; }, [files]);
  
  useEffect(() => {
    if (activeTabId) {
      setTabHistory(prev => [...prev.filter(id => id !== activeTabId), activeTabId]);
    }
  }, [activeTabId]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('pavel-ai-tools-theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('pavel-ai-tools-theme', 'light');
    }
  }, [isDarkMode]);

  // Enhanced Auto-save
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    setSaveStatus('unsaved');

    const timer = setTimeout(() => {
      setSaveStatus('saving');
      
      // Perform save
      localStorage.setItem('pavel-ai-tools-files', JSON.stringify(files));
      
      // Visual delay
      setTimeout(() => {
        setLastSavedAt(new Date());
        setSaveStatus('saved');
      }, 800);
    }, 2000); // 2 second debounce

    return () => clearTimeout(timer);
  }, [files]);

  // --- Auth & OAuth Callback Handling ---
  useEffect(() => {
    const checkAuth = async () => {
      // 1. Check for token in URL (Callback from Backend)
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get('token');
      
      if (urlToken) {
        localStorage.setItem('pavel_auth_token', urlToken);
        // Clean URL without reloading
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      // 2. Validate Token & Fetch User
      const token = localStorage.getItem('pavel_auth_token');
      if (token) {
        try {
          const user = await getCurrentUser();
          setGithubUser(user);
        } catch (err) {
          console.error("Auth Error", err);
          localStorage.removeItem('pavel_auth_token');
          setGithubUser(null);
        }
      }
    };
    
    checkAuth();
  }, []);

  // Command Palette Keyboard Listener
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'p') {
              e.preventDefault();
              setIsCommandPaletteOpen(true);
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // --- Helpers ---
  const addTerminalMessage = (content: string, type: TerminalMessage['type'] = 'stdout') => {
    setTerminalMessages(prev => [...prev, { type, content, timestamp: Date.now() }]);
  };

  const addChatMessage = (text: string, role: 'user' | 'model', sources?: any, image?: string) => {
    setChatMessages(prev => [...prev, { id: generateId(), text, role, timestamp: Date.now(), sources, image }]);
  };

  const getSmartPlaceholder = (name: string, description: string) => {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    let start = '//';
    if (['html', 'xml', 'md'].includes(ext)) start = '<!--';
    else if (['py', 'sh', 'yaml'].includes(ext)) start = '#';
    return `${start} AI generating content for "${name}"...\n${start} Description: ${description}`;
  };

  // --- Core Handlers ---
  const handleFileSelect = (fileId: string) => {
    const existingTab = tabs.find(t => t.fileId === fileId);
    if (existingTab) {
      setActiveTabId(existingTab.id);
    } else {
      const newTab = { id: generateId(), fileId };
      setTabs(prev => [...prev, newTab]);
      setActiveTabId(newTab.id);
    }
  };

  const handleTabClose = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newTabs = tabs.filter(t => t.id !== tabId);
    setTabs(newTabs);
    const newHistory = tabHistory.filter(id => id !== tabId);
    setTabHistory(newHistory);
    if (activeTabId === tabId) {
      const nextId = newHistory.length > 0 ? newHistory[newHistory.length - 1] : (newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null);
      setActiveTabId(nextId);
    }
  };

  const handleFileCreate = (name: string, type: 'file' | 'folder', parentId: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    const newFile: FileNode = {
      id: generateId(), name, type, parentId,
      isOpen: type === 'folder' ? true : undefined,
      language: type === 'file' ? (ext ? LANGUAGE_MAP[ext] : undefined) : undefined,
      content: type === 'file' ? '' : undefined
    };
    setFiles(prev => [...prev, newFile].sort((a, b) => a.type === b.type ? a.name.localeCompare(b.name) : (a.type === 'folder' ? -1 : 1)));
    if (type === 'file') handleFileSelect(newFile.id);
  };

  const handleAiFileCreate = async (name: string, description: string, parentId: string) => {
    const fileId = generateId();
    const ext = name.split('.').pop()?.toLowerCase();
    const newFile: FileNode = {
      id: fileId, name, type: 'file', parentId,
      language: ext ? LANGUAGE_MAP[ext] : undefined,
      content: getSmartPlaceholder(name, description)
    };
    setFiles(prev => [...prev, newFile].sort((a, b) => a.type === b.type ? a.name.localeCompare(b.name) : (a.type === 'folder' ? -1 : 1)));
    handleFileSelect(fileId);
    const content = await generateFileContent(name, description, filesRef.current);
    setFiles(prev => prev.map(f => f.id === fileId ? { ...f, content } : f));
  };

  const handleChatFileCreate = (name: string, description: string) => {
      let parentId = 'root';
      if (activeFile) {
          parentId = activeFile.type === 'folder' ? activeFile.id : (activeFile.parentId || 'root');
      }
      handleAiFileCreate(name, description, parentId);
      addChatMessage(`Generating file "${name}"...`, 'model');
  };

  const handleFileDelete = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    const tabToDelete = tabs.find(t => t.fileId === fileId);
    if (tabToDelete) handleTabClose(tabToDelete.id, { stopPropagation: () => {} } as React.MouseEvent);
  };

  const handleRename = (id: string, newName: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, name: newName } : f));
  };

  const handleFileMove = (fileId: string, newParentId: string) => {
    if (fileId !== newParentId) {
        setFiles(prev => prev.map(f => f.id === fileId ? { ...f, parentId: newParentId } : f));
    }
  };

  const handleCodeChange = (value: string | undefined) => {
    if (activeFile && value !== undefined) {
      setFiles(prev => prev.map(f => f.id === activeFile.id ? { ...f, content: value } : f));
    }
  };

  const handleRun = async () => {
    if (files.some(f => f.name === 'index.html') && !['python', 'cpp', 'javascript'].includes(activeFile?.language || '')) {
        setIsPreviewActive(true);
        setActivePanel('terminal');
        setPreviewTrigger(p => p + 1);
        addTerminalMessage("Starting Live Server...", 'system');
    } else if (activeFile?.content) {
        setIsPreviewActive(false);
        setActivePanel('terminal');
        setShowPanel(true);
        setIsRunning(true);
        setTerminalMessages([]);
        addTerminalMessage(`$ Running ${activeFile.name}...`, 'system');
        await new Promise(r => setTimeout(r, 600));
        const res = await executeCode(activeFile.content, activeFile.language || 'text');
        addTerminalMessage(res.output, res.error ? 'stderr' : 'stdout');
        setIsRunning(false);
    }
  };

  const handleAiChat = async (input: string) => {
    addChatMessage(input, 'user');
    const res = await chatWithAi(input, activeFile?.content || '', files);
    addChatMessage(res.text, 'model', res.sources);
  };

  const handleGenerateImage = async (prompt: string, size: '1K' | '2K' | '4K') => {
      addChatMessage(`Generate an image: ${prompt} (${size})`, 'user');
      const imgData = await generateImage(prompt, size);
      if (imgData) {
          addChatMessage("Here is your generated image:", 'model', undefined, imgData);
      } else {
          addChatMessage("Sorry, I couldn't generate that image. Please check your API key and try again.", 'model');
      }
  };

  const handleDebugProject = async () => {
     setShowPanel(true);
     setActivePanel('chat');
     addChatMessage("Analyzing project for errors...", 'user');
     const res = await analyzeProject(filesRef.current);
     addChatMessage(res, 'model');
  };

  const commands: CommandItem[] = useMemo(() => [
      { id: 'new-file', label: 'New File', category: 'File', action: () => fileExplorerRef.current?.triggerNewFile() },
      { id: 'new-folder', label: 'New Folder', category: 'File', action: () => fileExplorerRef.current?.triggerNewFolder() },
      { id: 'new-ai-file', label: 'New AI Generated File', category: 'File', action: () => fileExplorerRef.current?.triggerNewAiFile() },
      { id: 'run', label: 'Run Project', category: 'Editor', shortcut: '⌘R', action: handleRun },
      { id: 'save', label: 'Save Project', category: 'Editor', shortcut: '⌘S', action: () => localStorage.setItem('pavel-ai-tools-files', JSON.stringify(files)) },
      { id: 'debug', label: 'Debug Project', category: 'AI', action: handleDebugProject },
      { id: 'theme', label: 'Toggle Theme', category: 'View', action: () => setIsDarkMode(p => !p) },
      { id: 'github', label: 'Sync to GitHub', category: 'Cloud', action: () => setIsGitHubModalOpen(true) },
  ], [files, handleRun]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50 dark:bg-[#0d1117] text-gray-900 dark:text-gray-200 transition-colors">
      {/* Header */}
      <header className="h-14 bg-indigo-600 border-b border-indigo-700 flex items-center justify-between px-4 shrink-0 shadow-md z-30">
        <div className="flex items-center space-x-3">
           <div className="bg-white p-1.5 rounded-lg shadow-sm">
             <Code2 className="w-5 h-5 text-indigo-600" />
           </div>
           <span className="font-bold text-lg text-white tracking-tight">Pavel AI Tools</span>
        </div>

        <div className="flex items-center space-x-3">
          {/* Collaboration UI */}
          <div className="flex -space-x-2 mr-4">
              <div className="w-7 h-7 rounded-full bg-blue-500 border-2 border-indigo-600 flex items-center justify-center text-[10px] text-white font-bold" title="You">YOU</div>
              <div className="w-7 h-7 rounded-full bg-green-500 border-2 border-indigo-600 flex items-center justify-center text-[10px] text-white font-bold opacity-50" title="Teammate 1">TM</div>
              <div className="w-7 h-7 rounded-full bg-gray-600 border-2 border-indigo-600 flex items-center justify-center text-[10px] text-white font-bold flex items-center justify-center">
                  <Users size={10} />
              </div>
          </div>

          <button 
             onClick={() => setIsGitHubModalOpen(true)}
             className={`
               flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all
               ${githubUser 
                 ? 'bg-gray-800 text-white hover:bg-gray-900 border border-gray-700' 
                 : 'bg-white text-gray-900 hover:bg-gray-100 border border-transparent'}
             `}
          >
             {githubUser ? (
                 <>
                    <img src={githubUser.avatar_url} alt="Profile" className="w-5 h-5 rounded-full" />
                    <span>{githubUser.username}</span>
                 </>
             ) : (
                 <>
                    <Github size={16} />
                    <span>Login</span>
                 </>
             )}
          </button>

          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 text-indigo-100 hover:text-white rounded-md hover:bg-indigo-700 transition-colors">
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          
          <button onClick={() => setShowPanel(!showPanel)} className="p-2 text-indigo-100 hover:text-white rounded-md hover:bg-indigo-700 transition-colors">
             <LayoutTemplate size={18} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <FileExplorer 
          ref={fileExplorerRef}
          files={files} 
          activeFileId={activeFile?.id || null}
          onFileSelect={handleFileSelect}
          onFileCreate={handleFileCreate}
          onAiFileCreate={handleAiFileCreate}
          onDelete={handleFileDelete}
          onToggleFolder={(id) => setFiles(prev => prev.map(f => f.id === id ? { ...f, isOpen: !f.isOpen } : f))}
          onRename={handleRename}
          onMove={handleFileMove}
          onOpenGitHub={() => setIsGitHubModalOpen(true)}
        />

        {/* Editor Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-gray-50 dark:bg-[#0d1117] transition-colors relative">
          <Tabs 
            tabs={tabs} 
            activeTabId={activeTabId} 
            files={files} 
            onTabClick={setActiveTabId} 
            onTabClose={handleTabClose} 
          />
          <div className="flex-1 relative">
            <CodeEditor 
              activeFile={activeFile} 
              onChange={handleCodeChange} 
              theme={isDarkMode ? 'dark' : 'light'} 
            />
          </div>
          
          {/* Run Button (Floating) */}
          <button
            onClick={handleRun}
            disabled={isRunning || !activeFile}
            className={`
              absolute bottom-6 right-6 z-10 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all transform hover:scale-105 active:scale-95
              ${isRunning ? 'bg-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'}
            `}
            title="Run Code (Cmd+R)"
          >
             {isRunning ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/> : <Play size={20} className="ml-1" />}
          </button>
        </div>

        {/* Right Panel (Terminal / Preview / Chat) */}
        {showPanel && (
          <div className="w-[30vw] min-w-[350px] flex flex-col border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0d1117] transition-all">
            <div className="flex items-center border-b border-gray-200 dark:border-gray-800">
              <button 
                onClick={() => { setActivePanel('terminal'); setIsPreviewActive(false); }}
                className={`flex-1 px-4 py-2.5 text-sm font-medium flex items-center justify-center space-x-2 transition-colors ${activePanel === 'terminal' && !isPreviewActive ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
              >
                <TerminalIcon size={14} />
                <span>Console</span>
              </button>
              <button 
                onClick={() => { setActivePanel('terminal'); setIsPreviewActive(true); }}
                className={`flex-1 px-4 py-2.5 text-sm font-medium flex items-center justify-center space-x-2 transition-colors ${isPreviewActive ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
              >
                <Globe size={14} />
                <span>Web</span>
              </button>
              <button 
                onClick={() => { setActivePanel('chat'); setIsPreviewActive(false); }}
                className={`flex-1 px-4 py-2.5 text-sm font-medium flex items-center justify-center space-x-2 transition-colors ${activePanel === 'chat' ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
              >
                <MessageSquare size={14} />
                <span>AI Chat</span>
              </button>
            </div>

            <div className="flex-1 overflow-hidden relative">
              {isPreviewActive ? (
                <WebPreview 
                    html={files.find(f => f.name === 'index.html')?.content || '<h1>No index.html found</h1>'} 
                    refreshTrigger={previewTrigger}
                />
              ) : activePanel === 'terminal' ? (
                <Terminal 
                  messages={terminalMessages} 
                  isRunning={isRunning} 
                  onClear={() => setTerminalMessages([])} 
                />
              ) : (
                <AIChatPanel 
                   messages={chatMessages} 
                   onSendMessage={handleAiChat} 
                   onDebugProject={handleDebugProject}
                   onGenerateImage={handleGenerateImage}
                   onGenerateFile={handleChatFileCreate}
                   isLoading={chatMessages.length > 0 && chatMessages[chatMessages.length - 1].role === 'user'}
                   onClose={() => setShowPanel(false)}
                   activeFileName={activeFile?.name}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer / Status Bar */}
      <footer className="h-6 bg-indigo-600 text-indigo-100 flex items-center justify-between px-3 text-[10px] select-none shrink-0 z-30">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1 hover:text-white cursor-pointer">
            <GitBranch size={10} />
            <span>main</span>
          </div>
          <div className="flex items-center space-x-2 min-w-[120px]">
             {saveStatus === 'saving' ? (
                 <>
                    <Loader2 size={10} className="animate-spin text-amber-300" />
                    <span className="text-amber-100 font-semibold">Saving...</span>
                 </>
             ) : saveStatus === 'unsaved' ? (
                 <>
                    <Circle size={10} className="fill-amber-400 text-amber-400 animate-pulse" />
                    <span className="text-amber-100 italic">Unsaved changes</span>
                 </>
             ) : saveStatus === 'saved' ? (
                 <>
                    <CheckCircle size={10} className="text-green-300" />
                    <span>Saved recently {lastSavedAt ? `(${lastSavedAt.toLocaleTimeString()})` : ''}</span>
                 </>
             ) : (
                 <span className="opacity-50">Ready</span>
             )}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <span>{activeFile?.language || 'Plain Text'}</span>
          <span>Spaces: 2</span>
          <span>UTF-8</span>
        </div>
      </footer>

      {/* Modals */}
      <GitHubModal 
        isOpen={isGitHubModalOpen} 
        onClose={() => setIsGitHubModalOpen(false)} 
        user={githubUser}
        onLogout={() => { localStorage.removeItem('pavel_auth_token'); setGithubUser(null); }}
        files={files}
      />

      <CommandPalette 
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        commands={commands}
      />
    </div>
  );
}