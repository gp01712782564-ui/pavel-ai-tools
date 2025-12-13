import api from './api';
import { FileSystem, FileNode } from '../types';

export interface GitHubUser {
  id: string;
  username: string;
  avatar_url: string;
  html_url: string;
}

// Helper: Reconstruct the full relative path for a file
const getFullPath = (node: FileNode, allFiles: FileSystem): string | null => {
  // If the node is at the root (parentId is 'root' or null), return its name
  if (node.parentId === 'root' || !node.parentId) return node.name;
  
  const parent = allFiles.find(f => f.id === node.parentId);
  
  // If parent is the root folder itself, return name
  if (parent && parent.id === 'root') return node.name;

  if (!parent) return null; // Orphaned file, skip
  
  const parentPath = getFullPath(parent, allFiles);
  return parentPath ? `${parentPath}/${node.name}` : null;
};

// Safely get API URL avoiding "Cannot read properties of undefined"
const getBaseUrl = (): string => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) {
      // @ts-ignore
      return import.meta.env.VITE_API_URL;
    }
  } catch {
    // Ignore
  }
  return 'http://localhost:5000';
};

// 1. Login
export const loginWithGitHub = () => {
  const backendUrl = getBaseUrl().replace(/\/$/, '');
  window.location.href = `${backendUrl}/auth/github`;
};

// 2. Get User
export const getCurrentUser = async (): Promise<GitHubUser> => {
  const response = await api.get('/auth/me');
  return response.data;
};

// 3. Push Project
export const pushProjectToGitHub = async (
  files: FileSystem, 
  onProgress: (status: string) => void
) => {
  try {
    onProgress('Analyzing project structure...');
    
    // Filter for valid files only
    const validFiles = files.filter(f => 
      f.type === 'file' && 
      f.name && // Ensure name exists
      typeof f.content === 'string'
    );

    if (validFiles.length === 0) {
        throw new Error("Project is empty. Create some files before pushing.");
    }

    onProgress(`Preparing ${validFiles.length} files for upload...`);
    
    // Map files to their full paths
    const payload = validFiles.map(f => {
      const fullPath = getFullPath(f, files);
      if (!fullPath) return null;
      
      // Ensure no leading slashes
      const cleanPath = fullPath.replace(/^\/+/, '');

      return {
        path: cleanPath,
        content: f.content || ''
      };
    }).filter((item): item is { path: string; content: string } => item !== null);

    if (payload.length === 0) {
        throw new Error("Failed to resolve file paths. Check project structure.");
    }

    onProgress('Connecting to GitHub...');
    
    const response = await api.post('/api/github/push', {
      files: payload
    });

    onProgress('Finalizing commit...');
    return response.data.repoUrl;
    
  } catch (error: any) {
    console.error("Push Error Details:", error);
    const msg = error.response?.data?.error || error.message || 'Failed to sync with GitHub';
    throw new Error(msg);
  }
};