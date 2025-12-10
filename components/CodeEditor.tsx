import React, { useEffect } from 'react';
import Editor, { OnMount, useMonaco } from '@monaco-editor/react';
import { FileNode } from '../types';

interface CodeEditorProps {
  activeFile: FileNode | undefined;
  onChange: (value: string | undefined) => void;
  theme: 'light' | 'dark';
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ activeFile, onChange, theme }) => {
  const monaco = useMonaco();

  useEffect(() => {
    if (monaco) {
      // Define custom dark theme
      monaco.editor.defineTheme('custom-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [],
        colors: {
          'editor.background': '#0d1117',
          'editor.lineHighlightBackground': '#161b22',
          'editorCursor.foreground': '#58a6ff',
        }
      });
      // Set theme based on prop
      monaco.editor.setTheme(theme === 'dark' ? 'custom-dark' : 'light');
    }
  }, [monaco, theme]);

  if (!activeFile) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 bg-gray-50 dark:bg-[#0d1117] transition-colors">
        <div className="text-center">
          <p className="mb-2 text-lg font-medium">No file is open</p>
          <p className="text-sm opacity-60">Select a file from the explorer to start editing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-hidden">
      <Editor
        height="100%"
        width="100%"
        path={activeFile.id}
        defaultLanguage={activeFile.language || 'plaintext'}
        language={activeFile.language}
        value={activeFile.content}
        onChange={onChange}
        // Theme is controlled via useEffect, but we provide a fallback here
        theme={theme === 'dark' ? 'custom-dark' : 'light'}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: "'JetBrains Mono', monospace",
          lineHeight: 22,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          padding: { top: 16 },
          cursorBlinking: 'smooth',
          smoothScrolling: true,
          renderLineHighlight: 'all',
        }}
      />
    </div>
  );
};