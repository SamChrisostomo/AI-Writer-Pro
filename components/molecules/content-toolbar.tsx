'use client';

import * as React from 'react';
import { Copy, Check, Download, Share2, Trash2 } from 'lucide-react';
import { Button } from '@/components/atoms/button';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ContentToolbarProps {
  content: string;
  onClear?: () => void;
  title?: string;
}

export function ContentToolbar({ content, onClear, title }: ContentToolbarProps) {
  const [isCopied, setIsCopied] = React.useState(false);

  const copyToClipboard = async () => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setIsCopied(true);
      toast.success('Copiado para a área de transferência!');
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      toast.error('Erro ao copiar texto');
    }
  };

  const downloadText = () => {
    if (!content) return;
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${title || 'ai-content'}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('Download iniciado!');
  };

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={copyToClipboard}
              disabled={!content}
            >
              {isCopied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copiar texto</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={downloadText}
              disabled={!content}
            >
              <Download className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Baixar .txt</TooltipContent>
        </Tooltip>

        <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-1" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => toast.info('Feature em breve!')}
              disabled={!content}
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Compartilhar</TooltipContent>
        </Tooltip>

        {onClear && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                onClick={onClear}
                disabled={!content}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Limpar</TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
