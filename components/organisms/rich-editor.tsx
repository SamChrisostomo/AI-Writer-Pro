'use client';

import React, { useEffect, useState } from 'react';
import { EditorRoot, EditorContent, JSONContent } from 'novel';
import { marked } from 'marked';

interface RichEditorProps {
  content: string;
  onChange?: (content: string) => void;
}

export function RichEditor({ content, onChange }: RichEditorProps) {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (isInitialized) return;
    
    const parseMarkdown = async () => {
      // Check if content is already HTML (from previous edits)
      if (content.trim().startsWith('<')) {
        setHtmlContent(content);
      } else {
        const html = await marked.parse(content);
        setHtmlContent(html);
      }
      setIsInitialized(true);
    };
    parseMarkdown();
  }, [content, isInitialized]);

  if (!htmlContent && content) return null;

  return (
    <div className="relative w-full border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 shadow-sm overflow-hidden">
      <EditorRoot>
        <EditorContent
          initialContent={undefined}
          onCreate={({ editor }) => {
            editor.commands.setContent(htmlContent);
          }}
          onUpdate={({ editor }) => {
            if (onChange) {
              onChange(editor.getHTML());
            }
          }}
          className="min-h-[400px] w-full p-6 prose prose-slate dark:prose-invert max-w-none focus:outline-none"
        />
      </EditorRoot>
    </div>
  );
}
