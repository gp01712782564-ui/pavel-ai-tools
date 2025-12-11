
import React, { useState } from 'react';
import { Github, Loader2, CheckCircle, AlertCircle, X, ExternalLink, Zap, LogOut } from 'lucide-react';
import { pushProjectToGitHub, loginWithGitHub, GitHubUser } from '../services/githubService';
import { FileSystem } from '../types';

interface GitHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: GitHubUser | null;
  onLogout: () => void;
  files?: FileSystem;
}

export const GitHubModal: React.FC<GitHubModalProps> = ({ isOpen, onClose, user, onLogout, files }) => {
  const [isPushing, setIsPushing] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successUrl, setSuccessUrl] = useState<string | null>(null);
  const [authError, setAuthError] = useState(false);

  const handlePush = async () => {
    if (!user) {
      setError('Please login first.');
      return;
    }
    if (!files) {
        setError("No files to push. Please try saving your work first.");
        return;
    }
    
    setError(null);
    setSuccessUrl(null);
    setAuthError(false);
    setIsPushing(true);

    try {
      const url = await pushProjectToGitHub(files, setStatus);
      setSuccessUrl(url);
      setStatus('Successfully pushed to GitHub!');
    } catch (err: any) {
      const msg = err.message || 'An unknown error occurred';
      setError(msg);
      if (msg.includes('Auth expired') || msg.includes('Unauthorized')) {
          setAuthError(true);
      }
    } finally {
      setIsPushing(false);
    }
  };

  const handleRelogin = () => {
      onLogout();
      loginWithGitHub();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#161b22] w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden transform transition-all">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#0d1117]">
          <div className="flex items-center space-x-2 text-gray-900 dark:text-white font-bold text-lg">
            <Github size={24} />
            <span>GitHub Sync</span>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {!successUrl ? (
            <>
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800">
                  <div className="flex items-start space-x-3">
                      <div className="p-2 bg-indigo-100 dark:bg-indigo-800 rounded-lg">
                          <Zap size={20} className="text-indigo-600 dark:text-indigo-300" />
                      </div>
                      <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Automated Pipeline</h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              We use secure OAuth to create and sync your repo <code>pavel-ai-tools-project</code> automatically. No tokens required.
                          </p>
                      </div>
                  </div>
              </div>

              {!user ? (
                <div className="text-center py-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Connect your GitHub account to start syncing your projects.
                    </p>
                    <button 
                        onClick={loginWithGitHub}
                        className="w-full bg-[#24292F] hover:bg-[#24292F]/90 text-white py-3 rounded-lg font-bold flex items-center justify-center space-x-2 transition-transform active:scale-95"
                    >
                        <Github size={18} />
                        <span>Continue with GitHub</span>
                    </button>
                </div>
              ) : (
                  <div className="flex items-center justify-between bg-gray-50 dark:bg-[#0d1117] p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center space-x-3">
                          <img src={user.avatar_url} alt={user.username} className="w-10 h-10 rounded-full border border-gray-300 dark:border-gray-600" />
                          <div>
                              <div className="text-sm font-bold text-gray-900 dark:text-white">{user.username}</div>
                              <div className="text-xs text-green-600 dark:text-green-400 flex items-center">
                                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></div>
                                  Authenticated
                              </div>
                          </div>
                      </div>
                      <button onClick={onLogout} className="text-xs text-red-500 hover:text-red-600 underline">Logout</button>
                  </div>
              )}

              {error && (
                <div className="flex flex-col space-y-2">
                    <div className="flex items-start space-x-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md text-sm border border-red-100 dark:border-red-900/30">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <span>{error}</span>
                    </div>
                    {authError && (
                        <button 
                            onClick={handleRelogin}
                            className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-md font-medium text-xs flex items-center justify-center gap-2"
                        >
                            <LogOut size={14} /> Re-authenticate with GitHub
                        </button>
                    )}
                </div>
              )}

              {isPushing && (
                <div className="flex flex-col items-center justify-center py-4 space-y-3">
                  <Loader2 size={32} className="animate-spin text-indigo-600 dark:text-indigo-400" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300 animate-pulse">{status}</span>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-6 space-y-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-200 dark:shadow-green-900/20">
                <CheckCircle size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Sync Complete!</h3>
                <p className="text-sm text-gray-500 mt-2 px-4">
                    Your code is live on GitHub.
                </p>
              </div>
              <a 
                href={successUrl} 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center space-x-2 bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-lg font-medium transition-transform hover:scale-105 shadow-md"
              >
                <span>View Repository</span>
                <ExternalLink size={16} />
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        {user && !successUrl && !authError && (
          <div className="px-6 py-4 bg-gray-50 dark:bg-[#0d1117] border-t border-gray-200 dark:border-gray-800 flex justify-end">
             <button 
                onClick={handlePush}
                disabled={isPushing}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-bold flex items-center space-x-2 transition-all shadow-md hover:shadow-lg"
             >
                <Github size={18} />
                <span>Sync Now</span>
             </button>
          </div>
        )}
      </div>
    </div>
  );
};
