'use client';

import * as React from 'react';
import { FileExplorer } from '@/features/dashboard/components/file-explorer';
import { fetchExplorerData, type FileSystemData, type TextItem } from '@/features/dashboard/actions';
import { Loader2, FileQuestion } from 'lucide-react';
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';

export function DashboardFileManager() {
  const [data, setData] = React.useState<FileSystemData>({ folders: [], texts: [] });
  const [loading, setLoading] = React.useState(true);
  const [selectedText, setSelectedText] = React.useState<TextItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);

  React.useEffect(() => {
    async function loadData() {
      try {
        const result = await fetchExplorerData();
        setData(result);
      } catch (error) {
        console.error('Error fetching file system:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleOpenText = (text: TextItem) => {
    setSelectedText(text);
    setIsDrawerOpen(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 border rounded-xl bg-muted/20">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  // Se não tem nem pastas nem textos, ele pode estar vazio na raiz,
  // mas o FileExplorer lida com a interface vazia de forma mais útil (permite arrastar ou criar pasta).
  // Então só mostramos outro componente de erro se a rede falhar.
  return (
    <>
      <div className="h-[600px]">
        <FileExplorer initialData={data} onOpenText={handleOpenText} />
      </div>

      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-4xl p-6 overflow-y-auto max-h-[85vh]">
            <DrawerHeader className="px-0">
              <DrawerTitle className="text-2xl">{selectedText?.title}</DrawerTitle>
              <DrawerDescription className="flex items-center gap-2 mt-2">
                <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-xs font-medium">
                  {selectedText?.category}
                </span>
                <span>
                  {selectedText?.created_at && new Date(selectedText.created_at).toLocaleDateString('pt-BR')}
                </span>
              </DrawerDescription>
            </DrawerHeader>
            <div className="prose prose-slate dark:prose-invert max-w-none mt-6 pb-12">
              <ReactMarkdown>{selectedText?.content || ''}</ReactMarkdown>
            </div>
            <DrawerFooter className="px-0 pt-6 border-t">
              <DrawerClose asChild>
                <Button variant="outline">Fechar</Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
