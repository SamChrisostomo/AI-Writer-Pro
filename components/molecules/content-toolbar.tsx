'use client';

import * as React from 'react';
import { Copy, Check, Download, Share2, Trash2, ShieldCheck, Loader2, Languages, FileText, File } from 'lucide-react';
import { Button } from '@/components/atoms/button';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from '@/components/atoms/badge';

interface ContentToolbarProps {
  content: string;
  onClear?: () => void;
  title?: string;
  onTranslate?: (translatedText: string) => void;
}

export function ContentToolbar({ content, onClear, title, onTranslate }: ContentToolbarProps) {
  const [isCopied, setIsCopied] = React.useState(false);
  const [isCheckingPlagiarism, setIsCheckingPlagiarism] = React.useState(false);
  const [plagiarismReport, setPlagiarismReport] = React.useState<any>(null);
  const [isPlagiarismDialogOpen, setIsPlagiarismDialogOpen] = React.useState(false);
  
  const [isTranslating, setIsTranslating] = React.useState(false);
  const [isTranslatePopoverOpen, setIsTranslatePopoverOpen] = React.useState(false);

  const languages = [
    { code: 'en', name: 'Inglês' },
    { code: 'es', name: 'Espanhol' },
    { code: 'fr', name: 'Francês' },
    { code: 'de', name: 'Alemão' },
    { code: 'it', name: 'Italiano' },
    { code: 'pt', name: 'Português' },
  ];

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

  const downloadTxt = () => {
    if (!content) return;
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${title || 'ai-content'}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('Download TXT iniciado!');
  };

  const downloadPdf = () => {
    if (!content) return;
    try {
      const doc = new jsPDF();
      const splitText = doc.splitTextToSize(content, 180);
      doc.text(splitText, 15, 15);
      doc.save(`${title || 'ai-content'}.pdf`);
      toast.success('Download PDF iniciado!');
    } catch (e) {
      toast.error('Erro ao gerar PDF');
    }
  };

  const downloadDocx = async () => {
    if (!content) return;
    try {
      const doc = new Document({
        sections: [{
          properties: {},
          children: content.split('\n').map(line => new Paragraph({
            children: [new TextRun(line)]
          }))
        }]
      });
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${title || 'ai-content'}.docx`);
      toast.success('Download DOCX iniciado!');
    } catch (e) {
      toast.error('Erro ao gerar DOCX');
    }
  };

  const handleTranslate = async (langName: string) => {
    if (!content) return;
    setIsTranslating(true);
    setIsTranslatePopoverOpen(false);
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: content, targetLanguage: langName }),
      });

      if (!response.ok) {
        throw new Error('Failed to translate');
      }

      const data = await response.json();
      toast.success(`Texto traduzido para ${langName}!`);
      if (onTranslate && data.translatedText) {
        onTranslate(data.translatedText);
      }
    } catch (error) {
      console.error(error);
      toast.error('Erro ao traduzir texto.');
    } finally {
      setIsTranslating(false);
    }
  };

  const checkPlagiarism = async () => {
    if (!content) return;
    setIsCheckingPlagiarism(true);
    setIsPlagiarismDialogOpen(true);
    setPlagiarismReport(null);
    try {
      const response = await fetch('/api/plagiarism', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: content }),
      });

      if (!response.ok) {
        throw new Error('Failed to check plagiarism');
      }

      const data = await response.json();
      setPlagiarismReport(data);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao verificar originalidade.');
      setIsPlagiarismDialogOpen(false);
    } finally {
      setIsCheckingPlagiarism(false);
    }
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

        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={!content}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>Exportar</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={downloadPdf}>
              <File className="mr-2 h-4 w-4" /> PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={downloadDocx}>
              <FileText className="mr-2 h-4 w-4" /> DOCX
            </DropdownMenuItem>
            <DropdownMenuItem onClick={downloadTxt}>
              <FileText className="mr-2 h-4 w-4" /> Texto Simples (TXT)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Popover open={isTranslatePopoverOpen} onOpenChange={setIsTranslatePopoverOpen}>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                  disabled={!content || isTranslating}
                >
                  {isTranslating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Languages className="h-4 w-4" />}
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent>Traduzir</TooltipContent>
          </Tooltip>
          <PopoverContent className="w-48 p-2" align="center">
            <div className="space-y-1">
              <h4 className="font-medium text-sm px-2 py-1.5 text-slate-500">Traduzir para:</h4>
              {languages.map((lang) => (
                <Button
                  key={lang.code}
                  variant="ghost"
                  className="w-full justify-start text-sm h-8"
                  onClick={() => handleTranslate(lang.name)}
                >
                  {lang.name}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Dialog open={isPlagiarismDialogOpen} onOpenChange={setIsPlagiarismDialogOpen}>
          <Tooltip>
            <TooltipTrigger asChild>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
                  onClick={checkPlagiarism}
                  disabled={!content}
                >
                  <ShieldCheck className="h-4 w-4" />
                </Button>
              </DialogTrigger>
            </TooltipTrigger>
            <TooltipContent>Verificar Originalidade</TooltipContent>
          </Tooltip>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Verificação de Originalidade</DialogTitle>
              <DialogDescription>
                Analisando o texto para garantir que ele é original e não contém plágio.
              </DialogDescription>
            </DialogHeader>
            <div className="py-6">
              {isCheckingPlagiarism ? (
                <div className="flex flex-col items-center justify-center space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-slate-500">Analisando o conteúdo...</p>
                </div>
              ) : plagiarismReport ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Score de Originalidade:</span>
                    <Badge variant={plagiarismReport.originalityScore > 80 ? 'default' : plagiarismReport.originalityScore > 50 ? 'secondary' : 'destructive'} className="text-lg px-3 py-1">
                      {plagiarismReport.originalityScore}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Risco de Plágio:</span>
                    <span className={`font-bold ${plagiarismReport.plagiarismRisk === 'Low' ? 'text-green-500' : plagiarismReport.plagiarismRisk === 'Medium' ? 'text-yellow-500' : 'text-red-500'}`}>
                      {plagiarismReport.plagiarismRisk === 'Low' ? 'Baixo' : plagiarismReport.plagiarismRisk === 'Medium' ? 'Médio' : 'Alto'}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <span className="font-medium">Análise:</span>
                    <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
                      {plagiarismReport.analysis}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center text-slate-500">
                  Nenhum relatório disponível.
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

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
          <AlertDialog>
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                    disabled={!content}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
              </TooltipTrigger>
              <TooltipContent>Limpar</TooltipContent>
            </Tooltip>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Limpar conteúdo?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja limpar o texto gerado da tela? Você poderá encontrá-lo no histórico posteriormente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={onClear} className="bg-red-600 hover:bg-red-700">
                  Limpar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </TooltipProvider>
  );
}
