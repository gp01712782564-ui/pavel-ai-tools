import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { Send, Bot, User, Sparkles, X, FileSearch, Bug, FileText, Globe, Image as ImageIcon, FilePlus } from 'lucide-react';

interface AIChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onDebugProject: () => void;
  onGenerateImage: (prompt: string, size: '1K' | '2K' | '4K') => void;
  onGenerateFile: (name: string, description: string) => void;
  isLoading: boolean;
  onClose: () => void;
  activeFileName?: string;
}

export const AIChatPanel: React.FC<AIChatPanelProps> = ({ messages, onSendMessage, onDebugProject, onGenerateImage, onGenerateFile, isLoading, onClose, activeFileName }) => {
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Image Gen State
  const [isImgGenMode, setIsImgGenMode] = useState(false);
  const [imgPrompt, setImgPrompt] = useState('');
  const [imgSize, setImgSize] = useState<'1K' | '2K' | '4K'>('1K');

  // File Gen State
  const [isFileGenMode, setIsFileGenMode] = useState(false);
  const [genFileName, setGenFileName] = useState('');
  const [genFileDesc, setGenFileDesc] = useState('');

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isImgGenMode, isFileGenMode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
    }
  };

  const handleImageSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (imgPrompt.trim() && !isLoading) {
          onGenerateImage(imgPrompt, imgSize);
          setImgPrompt('');
          setIsImgGenMode(false);
      }
  };

  const handleFileGenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (genFileName.trim() && genFileDesc.trim() && !isLoading) {
        onGenerateFile(genFileName, genFileDesc);
        setGenFileName('');
        setGenFileDesc('');
        setIsFileGenMode(false);
    }
  };

  const handleQuickAction = (action: string) => {
    if (isLoading) return;
    
    let prompt = "";
    switch (action) {
        case 'explain':
            prompt = `Explain the content of ${activeFileName || 'the active file'} in detail. What does it do?`;
            break;
        case 'fix':
            prompt = `Review ${activeFileName || 'the current code'} for bugs or improvements and show me the fixed version.`;
            break;
        case 'comments':
            prompt = `Add helpful documentation and comments to ${activeFileName || 'the active file'} to explain the logic.`;
            break;
        case 'website':
            setInput("I want to build a website for [DESCRIBE PROJECT]. Please generate index.html, style.css, and script.js.");
            inputRef.current?.focus();
            return;
    }
    if (prompt) onSendMessage(prompt);
  };

  const closeModes = () => {
      setIsImgGenMode(false);
      setIsFileGenMode(false);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0d1117] border-l border-gray-200 dark:border-gray-800 shadow-xl w-full transition-colors">
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#161b22]">
        <div className="flex items-center space-x-2 text-gray-800 dark:text-gray-200 font-semibold text-sm">
          <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span>AI Assistant (Gemini 3 Pro)</span>
        </div>
        <div className="flex items-center space-x-1">
          <button 
             onClick={onDebugProject}
             className="p-1.5 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 rounded-md transition-colors"
             title="Debug Project"
          >
             <Bug size={16} />
          </button>
          <button onClick={onClose} className="p-1.5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-md transition-colors">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.length === 0 && !isImgGenMode && !isFileGenMode && (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <Bot size={48} className="text-gray-400 dark:text-gray-700 mb-4" />
            <h3 className="text-gray-700 dark:text-gray-300 font-medium mb-2">How can I help you with {activeFileName || 'your code'}?</h3>
            <p className="text-xs text-gray-500 max-w-[250px] mb-6">
              I can explain logic, generate new functions, debug errors, or generate images.
            </p>
            
            <div className="grid grid-cols-1 w-full gap-2">
                <button 
                    onClick={() => handleQuickAction('explain')}
                    className="flex items-center space-x-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg text-left transition-colors group"
                >
                    <div className="p-2 bg-blue-100 dark:bg-blue-500/10 rounded-md group-hover:bg-blue-200 dark:group-hover:bg-blue-500/20">
                        <FileText size={18} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <div className="text-sm text-gray-800 dark:text-gray-200 font-medium">Explain Code</div>
                        <div className="text-[10px] text-gray-500">Understand the active file</div>
                    </div>
                </button>

                <button 
                    onClick={() => setIsFileGenMode(true)}
                    className="flex items-center space-x-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg text-left transition-colors group"
                >
                    <div className="p-2 bg-green-100 dark:bg-green-500/10 rounded-md group-hover:bg-green-200 dark:group-hover:bg-green-500/20">
                        <FilePlus size={18} className="text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <div className="text-sm text-gray-800 dark:text-gray-200 font-medium">New AI File</div>
                        <div className="text-[10px] text-gray-500">Generate code from description</div>
                    </div>
                </button>

                <button 
                    onClick={() => handleQuickAction('website')}
                    className="flex items-center space-x-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg text-left transition-colors group"
                >
                    <div className="p-2 bg-purple-100 dark:bg-purple-500/10 rounded-md group-hover:bg-purple-200 dark:group-hover:bg-purple-500/20">
                        <Globe size={18} className="text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                        <div className="text-sm text-gray-800 dark:text-gray-200 font-medium">Build a Website</div>
                        <div className="text-[10px] text-gray-500">Generate full landing page</div>
                    </div>
                </button>

                <button 
                    onClick={() => setIsImgGenMode(true)}
                    className="flex items-center space-x-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg text-left transition-colors group"
                >
                    <div className="p-2 bg-amber-100 dark:bg-amber-500/10 rounded-md group-hover:bg-amber-200 dark:group-hover:bg-amber-500/20">
                        <ImageIcon size={18} className="text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                        <div className="text-sm text-gray-800 dark:text-gray-200 font-medium">Generate Image</div>
                        <div className="text-[10px] text-gray-500">Create assets with Gemini</div>
                    </div>
                </button>
                
                <button 
                    onClick={onDebugProject}
                    className="flex items-center space-x-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg text-left transition-colors group"
                >
                    <div className="p-2 bg-red-100 dark:bg-red-500/10 rounded-md group-hover:bg-red-200 dark:group-hover:bg-red-500/20">
                        <Bug size={18} className="text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                        <div className="text-sm text-gray-800 dark:text-gray-200 font-medium">Debug Project</div>
                        <div className="text-[10px] text-gray-500">Find & fix errors project-wide</div>
                    </div>
                </button>
            </div>
          </div>
        )}
        
        {messages.map((msg) => (
          <div key={msg.id} className={`flex space-x-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'model' && (
              <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center shrink-0 border border-purple-200 dark:border-purple-500/30">
                <Bot size={14} className="text-purple-600 dark:text-purple-300" />
              </div>
            )}
            <div className={`
              max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap shadow-sm
              ${msg.role === 'user' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700'}
            `}>
              {msg.text}

              {/* Generated Image */}
              {msg.image && (
                  <div className="mt-3 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-black/5">
                      <img src={`data:image/png;base64,${msg.image}`} alt="Generated" className="w-full h-auto" />
                  </div>
              )}
              
              {/* Citations/Sources */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 block">Sources</span>
                  <div className="flex flex-wrap gap-2">
                    {msg.sources.map((source, idx) => (
                      <a 
                        key={idx} 
                        href={source.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1.5 px-2 py-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-[10px] text-blue-600 dark:text-blue-400 hover:underline max-w-[200px]"
                        title={source.title}
                      >
                        <Globe size={10} className="shrink-0" />
                        <span className="truncate">{source.title}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-500/30">
                <User size={14} className="text-blue-600 dark:text-blue-300" />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex space-x-3">
             <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center shrink-0">
                <Bot size={14} className="text-purple-600 dark:text-purple-300" />
              </div>
             <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-3 flex items-center space-x-1">
               <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
               <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
               <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
             </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {isImgGenMode ? (
          <form onSubmit={handleImageSubmit} className="p-3 border-t border-gray-200 dark:border-gray-800 bg-amber-50 dark:bg-[#161b22]">
              <div className="flex flex-col space-y-2">
                  <div className="flex justify-between items-center text-xs font-semibold text-amber-600 dark:text-amber-500">
                      <span>Generate Image</span>
                      <button onClick={closeModes} type="button" className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"><X size={14}/></button>
                  </div>
                  <textarea
                    value={imgPrompt}
                    onChange={(e) => setImgPrompt(e.target.value)}
                    placeholder="Describe the image you want..."
                    className="w-full h-16 bg-white dark:bg-[#0d1117] border border-amber-200 dark:border-gray-700 rounded-md p-2 text-sm text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
                    autoFocus
                  />
                  <div className="flex items-center space-x-2">
                      <select 
                        value={imgSize}
                        onChange={(e) => setImgSize(e.target.value as any)}
                        className="bg-white dark:bg-[#0d1117] border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-xs text-gray-700 dark:text-gray-300 outline-none"
                      >
                          <option value="1K">1K (1024x1024)</option>
                          <option value="2K">2K (2048x2048)</option>
                          <option value="4K">4K (4096x4096)</option>
                      </select>
                      <button 
                        type="submit" 
                        disabled={!imgPrompt.trim() || isLoading}
                        className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-1.5 rounded text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                      >
                        <Sparkles size={14}/>
                        <span>Generate</span>
                      </button>
                  </div>
              </div>
          </form>
      ) : isFileGenMode ? (
        <form onSubmit={handleFileGenSubmit} className="p-3 border-t border-gray-200 dark:border-gray-800 bg-green-50 dark:bg-[#161b22]">
            <div className="flex flex-col space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold text-green-600 dark:text-green-500">
                    <span>Generate New File</span>
                    <button onClick={closeModes} type="button" className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"><X size={14}/></button>
                </div>
                <input
                    type="text"
                    value={genFileName}
                    onChange={(e) => setGenFileName(e.target.value)}
                    placeholder="File Name (e.g., data_processor.py)"
                    className="w-full bg-white dark:bg-[#0d1117] border border-green-200 dark:border-gray-700 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-green-500"
                    autoFocus
                />
                <textarea
                    value={genFileDesc}
                    onChange={(e) => setGenFileDesc(e.target.value)}
                    placeholder="Describe what the code should do..."
                    className="w-full h-16 bg-white dark:bg-[#0d1117] border border-green-200 dark:border-gray-700 rounded-md p-2 text-sm text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-green-500 resize-none"
                />
                <button 
                    type="submit" 
                    disabled={!genFileName.trim() || !genFileDesc.trim() || isLoading}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-1.5 rounded text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                    <Sparkles size={14}/>
                    <span>Generate File</span>
                </button>
            </div>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="p-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#161b22]">
            <div className="relative flex items-center space-x-2">
            <button 
                type="button"
                onClick={() => { closeModes(); setIsFileGenMode(true); }}
                className="p-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-md transition-colors"
                title="Generate New File (AI)"
            >
                <FilePlus size={16} />
            </button>
            <button 
                type="button"
                onClick={() => { closeModes(); setIsImgGenMode(true); }}
                className="p-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-md transition-colors"
                title="Generate Image"
            >
                <ImageIcon size={16} />
            </button>
            <button 
                type="button"
                onClick={onDebugProject}
                className="p-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-md transition-colors"
                title="Debug Project (AI)"
            >
                <Bug size={16} />
            </button>
            <div className="relative flex-1">
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={activeFileName ? `Ask about ${activeFileName}...` : "Type a message..."}
                    className="w-full bg-white dark:bg-[#0d1117] border border-gray-300 dark:border-gray-700 rounded-md py-2 pl-3 pr-10 text-sm text-gray-900 dark:text-gray-200 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button 
                    type="submit" 
                    disabled={!input.trim() || isLoading}
                    className="absolute right-2 top-1.5 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 disabled:opacity-50 transition-colors"
                >
                    <Send size={16} />
                </button>
            </div>
            </div>
        </form>
      )}
    </div>
  );
};