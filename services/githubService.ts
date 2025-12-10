import { FileSystem } from '../types';

const GITHUB_API_BASE = 'https://api.github.com';

export interface GitHubUser {
  login: string;
  avatar_url: string;
  html_url: string;
}

// Helper to safely encode Unicode strings to Base64
const toBase64 = (str: string) => {
  return window.btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
      function toSolidBytes(match, p1) {
        return String.fromCharCode(parseInt(p1, 16));
      })
  );
};

export const getGitHubUser = async (token: string): Promise<GitHubUser> => {
  const res = await fetch(`${GITHUB_API_BASE}/user`, {
    headers: { Authorization: `token ${token}` }
  });
  if (!res.ok) throw new Error('Invalid Token or Network Error');
  return res.json();
};

export const createRepo = async (token: string, name: string, description: string) => {
  const res = await fetch(`${GITHUB_API_BASE}/user/repos`, {
    method: 'POST',
    headers: { 
      Authorization: `token ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ 
      name, 
      description,
      auto_init: true // Initialize so we can push immediately
    })
  });
  
  if (res.status === 422) {
    // Repo likely exists, which is fine for our use case (updating it)
    return { name }; 
  }
  
  if (!res.ok) throw new Error('Failed to create repository');
  return res.json();
};

export const getFileSha = async (token: string, owner: string, repo: string, path: string): Promise<string | undefined> => {
  const res = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}`, {
    headers: { Authorization: `token ${token}` }
  });
  if (res.ok) {
    const data = await res.json();
    return data.sha;
  }
  return undefined;
};

export const uploadFile = async (
  token: string, 
  owner: string, 
  repo: string, 
  path: string, 
  content: string, 
  message: string
) => {
  // 1. Check if file exists to get SHA (required for updates)
  const sha = await getFileSha(token, owner, repo, path);

  // 2. Create or Update file
  const res = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: { 
      Authorization: `token ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message,
      content: toBase64(content),
      sha
    })
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Failed to upload ${path}: ${err.message}`);
  }
  
  return res.json();
};

export const pushProjectToGitHub = async (
  token: string, 
  repoName: string, 
  files: FileSystem, 
  onProgress: (status: string) => void
) => {
  try {
    onProgress('Authenticating...');
    const user = await getGitHubUser(token);
    
    onProgress(`Ensuring repository '${repoName}' exists...`);
    await createRepo(token, repoName, 'Created via AI Code Studio');

    // Filter only files (not folders)
    const filesToUpload = files.filter(f => f.type === 'file' && f.content !== undefined);
    
    let completed = 0;
    for (const file of filesToUpload) {
      // Construct path based on parent folders
      // For simplicity in this flat-ish system, we might just use name or reconstruct path
      // A robust system would walk the tree. Here we assume unique names or flat for now, 
      // OR we can try to reconstruct the path if the state allows.
      // Given the current FileSystem type, we can traverse up.
      
      let fullPath = file.name;
      let currentParentId = file.parentId;
      
      // Simple path reconstruction
      while (currentParentId && currentParentId !== 'root') {
          const parent = files.find(f => f.id === currentParentId);
          if (parent) {
              fullPath = `${parent.name}/${fullPath}`;
              currentParentId = parent.parentId;
          } else {
              break;
          }
      }

      onProgress(`Uploading ${fullPath} (${completed + 1}/${filesToUpload.length})...`);
      
      await uploadFile(
        token, 
        user.login, 
        repoName, 
        fullPath, 
        file.content || '', 
        `Update ${fullPath} via AI Code Studio`
      );
      
      completed++;
    }
    
    onProgress('Done! Project synced successfully.');
    return `https://github.com/${user.login}/${repoName}`;
    
  } catch (error: any) {
    throw new Error(error.message);
  }
};