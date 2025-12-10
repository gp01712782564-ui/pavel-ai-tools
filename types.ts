export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  language?: string;
  content?: string;
  parentId: string | null;
  isOpen?: boolean;
}

export type FileSystem = FileNode[];

export interface Tab {
  id: string;
  fileId: string;
}

export interface TerminalMessage {
  type: 'stdout' | 'stderr' | 'system' | 'info';
  content: string;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  image?: string;
  timestamp: number;
  sources?: { title: string; uri: string }[];
}

export enum SupportedLanguage {
  JAVASCRIPT = 'javascript',
  PYTHON = 'python',
  CPP = 'cpp',
  HTML = 'html',
  CSS = 'css',
  JSON = 'json',
  TYPESCRIPT = 'typescript',
  MARKDOWN = 'markdown'
}

export type ViewMode = 'code' | 'split' | 'preview';
export type PanelMode = 'terminal' | 'chat';

export interface ExecutionResult {
  output: string;
  error?: boolean;
}