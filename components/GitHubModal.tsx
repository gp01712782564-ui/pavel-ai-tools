import React, { useState, useEffect } from 'react';
import { Github, Loader2, CheckCircle, AlertCircle, X, ExternalLink } from 'lucide-react';
import { pushProjectToGitHub } from '../services/githubService';
import { FileSystem } from '../types';

interface GitHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: FileSystem;
}

export const GitHubModal: React.FC<GitHubModalProps> = ({ isOpen, onClose, files }) => {
  const [token, setToken] = useState('');
  const [repoName, setRepoName] = useState('my-ai-project');
  const [isPushing, setIsPushing] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successUrl, setSuccessUrl] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('github_pat');
    if (savedToken) setToken(savedToken);
  }, []);

  const handlePush = async () => {
    if (!token) {
      setError('Please provide a Personal Access Token');
      return;
    }
    
    setError(null);
    setSuccessUrl(null);
    setIsPushing(true);
    localStorage.setItem('github_pat', token);

    try {
      const url = await pushProjectToGitHub(token, repoName, files, setStatus);
      setSuccessUrl(url);
      setStatus('Successfully pushed to GitHub!');
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred');
    } finally {
      setIsPushing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#161b22] w-full max-w-md rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#0d1117]">
          <div className="flex items-center space-x-2 text-gray-900 dark:text-white font-semibold">
            <Github size={20} />
            <span>Save to GitHub</span>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900 dark:hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {!successUrl ? (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Personal Access Token (Classic)
                </label>
                <input 
                  type="password" 
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="ghp_..."
                  className="w-full px-3 py-2 bg-white dark:bg-[#0d1117] border border-gray-300 dark:border-gray-700 rounded-md text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <p className="text-[10px] text-gray-500 mt-1">
                  Requires <strong>repo</strong> scope. Token is stored locally.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Repository Name
                </label>
                <input 
                  type="text" 
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  placeholder="my-awesome-project"
                  className="w-full px-3 py-2 bg-white dark:bg-[#0d1117] border border-gray-300 dark:border-gray-700 rounded-md text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {error && (
                <div className="flex items-start space-x-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md text-sm">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {isPushing && (
                <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-md text-sm">
                  <Loader2 size={16} className="animate-spin shrink-0" />
                  <span className="truncate">{status}</span>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-6 space-y-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Project Saved!</h3>
                <p className="text-sm text-gray-500 mt-1">Your code is now on GitHub.</p>
              </div>
              <a 
                href={successUrl} 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm"
              >
                <span>View Repository</span>
                <ExternalLink size={14} />
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        {!successUrl && (
          <div className="px-6 py-4 bg-gray-50 dark:bg-[#0d1117] border-t border-gray-200 dark:border-gray-800 flex justify-end">
             <button 
                onClick={handlePush}
                disabled={isPushing}
                className="bg-[#238636] hover:bg-[#2ea043] disabled:opacity-50 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2 transition-colors"
             >
                <Github size={16} />
                <span>{isPushing ? 'Pushing...' : 'Push to GitHub'}</span>
             </button>
          </div>
        )}
      </div>
    </div>
  );
};