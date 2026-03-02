'use client';

import { useState } from 'react';
import {
  EditorRoot,
  EditorContent,
  EditorCommand,
  EditorCommandItem,
  EditorCommandEmpty,
  EditorCommandList,
  EditorBubble,
  EditorBubbleItem,
  useEditor,
} from 'novel';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, Strikethrough, Code, Undo, Redo, Wand2, Sparkles, Shrink, Briefcase, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { GhostTextExtension } from './ghost-text-extension';

const extensions = [
  StarterKit.configure({
    bulletList: {
      HTMLAttributes: {
        class: 'list-disc list-outside leading-3 -mt-2',
      },
    },
    orderedList: {
      HTMLAttributes: {
        class: 'list-decimal list-outside leading-3 -mt-2',
      },
    },
    listItem: {
      HTMLAttributes: {
        class: 'leading-normal -mb-2',
      },
    },
    blockquote: {
      HTMLAttributes: {
        class: 'border-l-4 border-primary',
      },
    },
    codeBlock: {
      HTMLAttributes: {
        class: 'rounded-sm bg-muted p-5 font-mono font-medium text-muted-foreground',
      },
    },
    code: {
      HTMLAttributes: {
        class: 'rounded-md bg-muted px-1.5 py-1 font-mono font-medium text-muted-foreground',
        spellcheck: 'false',
      },
    },
    horizontalRule: false,
    dropcursor: {
      color: '#DBEAFE',
      width: 4,
    },
    gapcursor: false,
  }),
  Placeholder.configure({
    placeholder: 'Pressione "/" para comandos ou comece a digitar...',
    emptyEditorClass: 'is-editor-empty',
  }),
  GhostTextExtension,
];

const EditorToolbar = ({ editor }: { editor: any }) => {
  return (
    <div className="flex items-center gap-1 p-2 mb-4 border border-muted rounded-md bg-slate-50 dark:bg-slate-900/50">
      <button
        onClick={() => editor?.chain().focus().undo().run()}
        disabled={!editor?.can().undo()}
        className="p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-50 text-slate-600 dark:text-slate-400"
        title="Desfazer"
      >
        <Undo className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor?.chain().focus().redo().run()}
        disabled={!editor?.can().redo()}
        className="p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-50 text-slate-600 dark:text-slate-400"
        title="Refazer"
      >
        <Redo className="w-4 h-4" />
      </button>
    </div>
  );
};

const AIBubbleMenu = ({ editor }: { editor: any }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!editor) return null;

  const handleAIAction = async (command: string) => {
    const selection = editor.state.selection;
    const text = editor.state.doc.textBetween(selection.from, selection.to, ' ');
    
    if (!text) return;

    setIsProcessing(true);
    try {
      const response = await fetch('/api/edit-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, command })
      });

      if (!response.ok) throw new Error('Falha ao processar texto');

      const data = await response.json();
      
      if (data.text) {
        editor.chain().focus().insertContentAt({
          from: selection.from,
          to: selection.to
        }, data.text).run();
        
        toast.success('Texto atualizado com sucesso!');
      } else {
        toast.error('A IA não conseguiu gerar uma resposta.');
      }
    } catch (error) {
      toast.error('Erro ao processar texto com IA');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <EditorBubble 
      tippyOptions={{ placement: 'top' }}
      className="flex w-fit max-w-[90vw] overflow-hidden rounded-md border border-muted bg-background shadow-xl"
    >
      {isProcessing ? (
        <div className="flex items-center justify-center px-4 py-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processando...
        </div>
      ) : (
        <>
          <EditorBubbleItem
            value="ai-improve"
            onSelect={() => handleAIAction('improve')}
            className="flex items-center justify-center px-3 py-1 text-sm hover:bg-accent cursor-pointer gap-1 text-indigo-500 font-medium"
          >
            <Wand2 className="h-4 w-4" /> Melhorar
          </EditorBubbleItem>
          <EditorBubbleItem
            value="ai-summarize"
            onSelect={() => handleAIAction('summarize')}
            className="flex items-center justify-center px-3 py-1 text-sm hover:bg-accent cursor-pointer gap-1 text-indigo-500 font-medium"
          >
            <Shrink className="h-4 w-4" /> Resumir
          </EditorBubbleItem>
          <EditorBubbleItem
            value="ai-expand"
            onSelect={() => handleAIAction('expand')}
            className="flex items-center justify-center px-3 py-1 text-sm hover:bg-accent cursor-pointer gap-1 text-indigo-500 font-medium"
          >
            <Sparkles className="h-4 w-4" /> Expandir
          </EditorBubbleItem>
          <EditorBubbleItem
            value="ai-formal"
            onSelect={() => handleAIAction('formal')}
            className="flex items-center justify-center px-3 py-1 text-sm hover:bg-accent cursor-pointer gap-1 text-indigo-500 font-medium"
          >
            <Briefcase className="h-4 w-4" /> Formal
          </EditorBubbleItem>
          
          <div className="w-px bg-muted mx-1 my-1" />
          
          <EditorBubbleItem
            value="bold"
            onSelect={(editor) => editor.chain().focus().toggleBold().run()}
            className="flex items-center justify-center px-2 py-1 text-sm hover:bg-accent cursor-pointer"
          >
            <Bold className="h-4 w-4" />
          </EditorBubbleItem>
          <EditorBubbleItem
            value="italic"
            onSelect={(editor) => editor.chain().focus().toggleItalic().run()}
            className="flex items-center justify-center px-2 py-1 text-sm hover:bg-accent cursor-pointer"
          >
            <Italic className="h-4 w-4" />
          </EditorBubbleItem>
          <EditorBubbleItem
            value="strike"
            onSelect={(editor) => editor.chain().focus().toggleStrike().run()}
            className="flex items-center justify-center px-2 py-1 text-sm hover:bg-accent cursor-pointer"
          >
            <Strikethrough className="h-4 w-4" />
          </EditorBubbleItem>
          <EditorBubbleItem
            value="code"
            onSelect={(editor) => editor.chain().focus().toggleCode().run()}
            className="flex items-center justify-center px-2 py-1 text-sm hover:bg-accent cursor-pointer"
          >
            <Code className="h-4 w-4" />
          </EditorBubbleItem>
        </>
      )}
    </EditorBubble>
  );
};

export default function NovelEditor({
  initialContent,
  onChange,
}: {
  initialContent?: string;
  onChange?: (content: string) => void;
}) {
  const [content, setContent] = useState<any>(initialContent || '');
  const [editorInstance, setEditorInstance] = useState<any>(null);
  const [autocompleteTimeout, setAutocompleteTimeout] = useState<NodeJS.Timeout | null>(null);

  const fetchAutocomplete = async (editor: any) => {
    const { selection, doc } = editor.state;
    if (!selection.empty) return;

    // Get text before cursor (up to 500 chars)
    const textBeforeCursor = doc.textBetween(Math.max(0, selection.from - 500), selection.from, ' ');
    if (!textBeforeCursor.trim() || textBeforeCursor.endsWith(' ')) return;

    try {
      const response = await fetch('/api/autocomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ textBeforeCursor })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.text) {
          // Add leading space if needed
          const suggestion = data.text.startsWith(' ') || data.text.startsWith(',') || data.text.startsWith('.') ? data.text : ' ' + data.text;
          const tr = editor.state.tr.setMeta('ghostTextSuggestion', suggestion);
          editor.view.dispatch(tr);
        }
      }
    } catch (error) {
      console.error('Autocomplete error:', error);
    }
  };

  return (
    <div className="relative w-full max-w-screen-lg">
      <EditorRoot>
        {editorInstance && <EditorToolbar editor={editorInstance} />}
        <EditorContent
          initialContent={content}
          extensions={extensions}
          onSelectionUpdate={({ editor }) => {
            const tr = editor.state.tr.setMeta('ghostTextSuggestion', '');
            editor.view.dispatch(tr);
          }}
          onUpdate={({ editor }) => {
            setEditorInstance(editor);
            const html = editor.getHTML();
            setContent(html);
            if (onChange) onChange(html);

            // Clear existing suggestion on typing
            const tr = editor.state.tr.setMeta('ghostTextSuggestion', '');
            editor.view.dispatch(tr);

            // Clear previous timeout
            if (autocompleteTimeout) {
              clearTimeout(autocompleteTimeout);
            }

            // Set new timeout for autocomplete
            const newTimeout = setTimeout(() => {
              fetchAutocomplete(editor);
            }, 1000); // 1 second debounce
            
            setAutocompleteTimeout(newTimeout);
          }}
          onCreate={({ editor }) => {
            setEditorInstance(editor);
          }}
          editorProps={{
            attributes: {
              class: `prose prose-slate dark:prose-invert prose-headings:font-title font-default focus:outline-none max-w-full`,
            },
          }}
          className="min-h-[400px] w-full bg-transparent"
        >
          <EditorCommand className="z-50 h-auto max-h-[330px] overflow-y-auto rounded-md border border-muted bg-background px-1 py-2 shadow-md transition-all">
            <EditorCommandEmpty className="px-2 text-muted-foreground">Sem resultados</EditorCommandEmpty>
            <EditorCommandList>
              <EditorCommandItem
                value="continue"
                onCommand={(val) => console.log(val)}
                className="flex w-full items-center space-x-2 rounded-md px-2 py-1 text-left text-sm hover:bg-accent aria-selected:bg-accent"
              >
                <p className="font-medium">Continuar escrevendo</p>
              </EditorCommandItem>
            </EditorCommandList>
          </EditorCommand>

          {editorInstance && <AIBubbleMenu editor={editorInstance} />}
        </EditorContent>
      </EditorRoot>
    </div>
  );
}
