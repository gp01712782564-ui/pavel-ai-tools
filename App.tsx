import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Play, Terminal as TerminalIcon, Bot, Save, Moon, Sun, Github, GitBranch, Share2, MessageSquare, LayoutTemplate, User, Users, Globe, ChevronDown, CheckCircle } from 'lucide-react';
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
import { GitHubUser } from './services/githubService';

const generateId = () => Math.random().toString(36).substr(2, 9);

export default function App() {
  // --- State Initialization ---
  const [files, setFiles] = useState<FileSystem>(() => {
    try {
      const saved = localStorage.getItem('ai-code-studio-files');
      return saved ? JSON.parse(saved) : INITIAL_FILES;
    } catch {
      return INITIAL_FILES;
    }
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      return localStorage.getItem('ai-code-studio-theme') !== 'light';
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
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Modals & User
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [githubUser, setGithubUser] = useState<GitHubUser | null>(null);

  const filesRef = useRef(files);
  const fileExplorerRef = useRef<FileExplorerRef>(null);
  const activeTab = tabs.find(t => t.id === activeTabId);
  const activeFile = activeTab ? files.find(f => f.id === activeTab.fileId) : undefined;

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
      localStorage.setItem('ai-code-studio-theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('ai-code-studio-theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const interval = setInterval(() => {
      localStorage.setItem('ai-code-studio-files', JSON.stringify(filesRef.current));
      setLastSaved(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('github_pat');
    if (token) {
        import('./services/githubService').then(({ getGitHubUser }) => {
            getGitHubUser(token).then(setGithubUser).catch(() => localStorage.removeItem('github_pat'));
        });
    }
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

  const handleDebugProject = async () => {
     setShowPanel(true);
     setActivePanel('chat');
     addChatMessage("Analyzing project for errors...", 'user');
     const res = await analyzeProject(filesRef.current);
     addChatMessage(res, 'model');
  };

  // Commands Configuration
  const commands: CommandItem[] = useMemo(() => [
      { id: 'new-file', label: 'New File', category: 'File', action: () => fileExplorerRef.current?.triggerNewFile() },
      { id: 'new-folder', label: 'New Folder', category: 'File', action: () => fileExplorerRef.current?.triggerNewFolder() },
      { id: 'new-ai-file', label: 'New AI Generated File', category: 'File', action: () => fileExplorerRef.current?.triggerNewAiFile() },
      { id: 'rename', label: 'Rename Active File', category: 'File', shortcut: 'F2', action: () => activeFile && fileExplorerRef.current?.triggerRename(activeFile.id) },
      { id: 'save', label: 'Save Project', category: 'File', shortcut: 'Auto', action: () => setLastSaved(new Date()) },
      
      { id: 'run', label: 'Run Project', category: 'Project', shortcut: 'Play', action: handleRun },
      { id: 'debug', label: 'Debug Project (AI)', category: 'Project', action: handleDebugProject },
      { id: 'github', label: 'Push to GitHub', category: 'Project', action: () => setIsGitHubModalOpen(true) },
      
      { id: 'toggle-theme', label: `Switch to ${isDarkMode ? 'Light' : 'Dark'} Mode`, category: 'View', action: () => setIsDarkMode(prev => !prev) },
      { id: 'toggle-panel', label: 'Toggle Side Panel', category: 'View', action: () => setShowPanel(prev => !prev) },
      { id: 'open-preview', label: 'Open Web Preview', category: 'View', action: () => { setIsPreviewActive(true); setPreviewTrigger(p => p+1); } },
      { id: 'open-terminal', label: 'Focus Terminal', category: 'View', action: () => { setShowPanel(true); setActivePanel('terminal'); setIsPreviewActive(false); } },
      { id: 'open-chat', label: 'Open AI Chat', category: 'View', action: () => { setShowPanel(true); setActivePanel('chat'); setIsPreviewActive(false); } },
  ], [activeFile, isDarkMode]);

  return (
    <div className="flex h-screen bg-white dark:bg-[#0d1117] text-gray-900 dark:text-gray-300 font-sans overflow-hidden">
      <GitHubModal isOpen={isGitHubModalOpen} onClose={() => setIsGitHubModalOpen(false)} files={files} user={githubUser} onLogout={() => { localStorage.removeItem('github_pat'); setGithubUser(null); }} />
      <CommandPalette commands={commands} isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} />

      {/* --- Sidebar (Seller Friendly) --- */}
      <FileExplorer 
        ref={fileExplorerRef}
        files={files} activeFileId={activeFile?.id || null}
        onFileSelect={handleFileSelect} onFileCreate={handleFileCreate} onAiFileCreate={handleAiFileCreate}
        onDelete={handleFileDelete} onToggleFolder={id => setFiles(prev => prev.map(f => f.id === id ? { ...f, isOpen: !f.isOpen } : f))}
        onRename={handleRename} onMove={handleFileMove}
        onOpenGitHub={() => setIsGitHubModalOpen(true)}
      />

      {/* --- Main Content --- */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Colorful Navbar */}
        <header className="h-16 bg-indigo-600 dark:bg-[#0d1117] border-b border-indigo-500 dark:border-gray-800 flex items-center justify-between px-6 shadow-md z-10 shrink-0">
           {/* Logo Area */}
           <div className="flex items-center space-x-3">
               <h1 className="text-xl font-bold text-white tracking-tight">Pavel AI Tools</h1>
               <div className="px-2 py-0.5 bg-indigo-500 rounded text-[10px] text-white font-semibold uppercase tracking-wider">Beta</div>
           </div>

           {/* Center Actions */}
           <div className="flex items-center space-x-4">
              <button 
                onClick={handleRun}
                disabled={isRunning}
                className={`flex items-center space-x-2 px-8 py-2.5 rounded-full font-bold shadow-lg transition-transform transform active:scale-95 ${isRunning ? 'bg-gray-400 cursor-not-allowed' : 'bg-white text-indigo-700 hover:bg-gray-100'}`}
              >
                  <Play size={18} fill="currentColor"/>
                  <span>Run Project</span>
              </button>
           </div>

           {/* Right Actions & Collaboration */}
           <div className="flex items-center space-x-4">
               {/* Live Collaboration Mockup */}
               <div className="flex items-center -space-x-2 mr-4">
                  <div className="w-8 h-8 rounded-full border-2 border-indigo-600 bg-yellow-400 flex items-center justify-center text-xs font-bold text-yellow-900" title="User A">A</div>
                  <div className="w-8 h-8 rounded-full border-2 border-indigo-600 bg-green-400 flex items-center justify-center text-xs font-bold text-green-900" title="User B">B</div>
                  <div className="w-8 h-8 rounded-full border-2 border-indigo-600 bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">+2</div>
               </div>

               <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 bg-indigo-500 text-white rounded-full hover:bg-indigo-400 transition-colors">
                   {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
               </button>

               {githubUser ? (
                 <div onClick={() => setIsGitHubModalOpen(true)} className="flex items-center space-x-2 cursor-pointer bg-indigo-700 hover:bg-indigo-800 py-1.5 px-3 rounded-full transition-colors">
                    <img src={githubUser.avatar_url} alt="User" className="w-6 h-6 rounded-full border border-white"/>
                    <span className="text-white text-sm font-medium">{githubUser.login}</span>
                 </div>
               ) : (
                 <button onClick={() => setIsGitHubModalOpen(true)} className="flex items-center space-x-2 bg-gray-900 text-white px-4 py-2 rounded-full font-medium hover:bg-gray-800 transition-colors shadow-lg">
                    <Github size={18} />
                    <span>Login</span>
                 </button>
               )}
           </div>
        </header>

        {/* Workspace */}
        <div className="flex-1 flex min-h-0">
           {/* Editor Area */}
           <div className={`flex flex-col min-w-0 transition-all duration-300 ${isPreviewActive || showPanel ? 'w-1/2 border-r border-gray-200 dark:border-gray-800' : 'w-full'}`}>
               <Tabs tabs={tabs} activeTabId={activeTabId} files={files} onTabClick={setActiveTabId} onTabClose={handleTabClose} />
               <div className="flex-1 relative bg-white dark:bg-[#0d1117]">
                  <CodeEditor activeFile={activeFile} onChange={handleCodeChange} theme={isDarkMode ? 'dark' : 'light'} />
               </div>
           </div>

           {/* Right Panel */}
           {(isPreviewActive || showPanel) && (
              <div className="flex-1 flex flex-col min-w-0 bg-blue-50/50 dark:bg-[#0d1117]">
                  {/* Panel Tabs */}
                  <div className="h-10 flex items-center bg-gray-100 dark:bg-[#161b22] border-b border-gray-200 dark:border-gray-800 px-2 space-x-1">
                      {isPreviewActive && (
                        <button className="px-4 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 bg-white dark:bg-[#0d1117] rounded-t-md border-t border-x border-gray-200 dark:border-gray-800 shadow-sm">
                            <Globe size={12} className="inline mr-1"/> Web Preview
                        </button>
                      )}
                      <button onClick={() => { setActivePanel('terminal'); setIsPreviewActive(false); }} className={`px-4 py-1.5 text-xs font-medium rounded-t-md transition-colors ${activePanel === 'terminal' && !isPreviewActive ? 'bg-white dark:bg-[#0d1117] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                          Terminal
                      </button>
                      <button onClick={() => { setActivePanel('chat'); setIsPreviewActive(false); }} className={`px-4 py-1.5 text-xs font-medium rounded-t-md transition-colors ${activePanel === 'chat' && !isPreviewActive ? 'bg-white dark:bg-[#0d1117] text-purple-600 dark:text-purple-400 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                          AI Assistant
                      </button>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 relative overflow-hidden bg-white dark:bg-[#0d1117]">
                      {isPreviewActive ? (
                        <WebPreview {...{ html: files.find(f => f.name === 'index.html')?.content || '', css: files.find(f => f.name.endsWith('.css'))?.content, js: files.find(f => f.name.endsWith('.js') && f.name !== 'server.js')?.content, refreshTrigger: previewTrigger }} />
                      ) : activePanel === 'terminal' ? (
                        <Terminal messages={terminalMessages} isRunning={isRunning} onClear={() => setTerminalMessages([])} />
                      ) : (
                        <AIChatPanel 
                          messages={chatMessages} 
                          onSendMessage={handleAiChat} 
                          onDebugProject={handleDebugProject}
                          onGenerateImage={async (prompt, size) => {
                             addChatMessage(`Generating ${size} image: ${prompt}`, 'user');
                             const img = await generateImage(prompt, size);
                             addChatMessage(img ? "Image generated successfully." : "Failed to generate image.", 'model', undefined, img || undefined);
                          }}
                          isLoading={chatMessages.length > 0 && chatMessages[chatMessages.length-1].role === 'user'} 
                          onClose={() => setShowPanel(false)}
                          activeFileName={activeFile?.name}
                        />
                      )}
                  </div>
              </div>
           )}
        </div>

        {/* Status Footer */}
        <footer className="h-8 bg-indigo-50 dark:bg-[#161b22] border-t border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 text-xs font-medium text-gray-500 dark:text-gray-400 shrink-0">
            <div className="flex items-center space-x-4">
                <span className="flex items-center space-x-1.5">
                   <GitBranch size={12} className="text-indigo-500"/>
                   <span>main</span>
                </span>
                {lastSaved && (
                   <span className="flex items-center space-x-1.5 text-green-600 dark:text-green-400">
                      <CheckCircle size={12}/>
                      <span>Saved {lastSaved.toLocaleTimeString()}</span>
                   </span>
                )}
            </div>
            <div className="flex items-center space-x-4">
                <span>{activeFile ? `${activeFile.language || 'Text'} • UTF-8` : 'Ready'}</span>
                <span>Ln {activeFile?.content?.split('\n').length || 0}, Col 1</span>
            </div>
        </footer>

      </div>
    </div>
  );
}