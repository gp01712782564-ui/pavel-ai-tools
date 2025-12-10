import React, { useEffect, useRef } from 'react';

interface WebPreviewProps {
  html: string;
  css?: string;
  js?: string;
  refreshTrigger: number;
}

export const WebPreview: React.FC<WebPreviewProps> = ({ html, css, js, refreshTrigger }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        // Inject basic CSS + User CSS + User JS
        const combinedContent = `
          ${html}
          <style>${css || ''}</style>
          <script>
            try {
              ${js || ''}
            } catch (err) {
              console.error(err);
            }
          </script>
        `;
        doc.write(combinedContent);
        doc.close();
      }
    }
  }, [html, css, js, refreshTrigger]);

  return (
    <div className="w-full h-full bg-white flex flex-col">
      <div className="bg-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700 px-2 py-1 flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 transition-colors">
        <div className="w-2 h-2 rounded-full bg-red-400"></div>
        <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
        <div className="w-2 h-2 rounded-full bg-green-400"></div>
        <span className="ml-2 bg-white dark:bg-[#0d1117] px-2 py-0.5 rounded border border-gray-200 dark:border-gray-600 flex-1 text-center font-mono text-gray-600 dark:text-gray-300">
          localhost:3000
        </span>
      </div>
      <iframe 
        ref={iframeRef}
        title="preview"
        className="flex-1 w-full h-full border-none"
        sandbox="allow-scripts allow-modals"
      />
    </div>
  );
};