'use client';

import * as React from 'react';
import { 
  Upload, Loader2, Home, ChevronRight, FolderPlus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { FileSystemData, FolderItem, TextItem, moveItem, createFolder, renameItem, deleteItem } from '../actions';
import { FolderItemCard } from './folder-item';
import { FileItemCard } from './file-item';

interface FileExplorerProps {
  initialData: FileSystemData;
  onOpenText: (text: TextItem) => void;
}

export function FileExplorer({ initialData, onOpenText }: FileExplorerProps) {
  const [data, setData] = React.useState<FileSystemData>(initialData);
  const [currentFolderId, setCurrentFolderId] = React.useState<string | null>(null);
  const [activeDragId, setActiveDragId] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  
  // Dialog States
  const [isCreateFolderOpen, setIsCreateFolderOpen] = React.useState(false);
  const [isRenameOpen, setIsRenameOpen] = React.useState(false);
  const [newFolderName, setNewFolderName] = React.useState('');
  const [renameValue, setRenameValue] = React.useState('');
  const [itemToRename, setItemToRename] = React.useState<{id: string, type: 'folder' | 'text'} | null>(null);

  // Filter current view
  const currentFolders = data.folders.filter(f => f.parent_id === currentFolderId);
  const currentTexts = data.texts.filter(t => t.folder_id === currentFolderId);

  // Breadcrumbs
  const getBreadcrumbs = () => {
    const crumbs = [];
    let current = currentFolderId;
    while (current) {
      const folder = data.folders.find(f => f.id === current);
      if (folder) {
        crumbs.unshift(folder);
        current = folder.parent_id;
      } else {
        break;
      }
    }
    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  const handleDrop = async (e: React.DragEvent, targetFolderId: string) => {
    e.preventDefault();
    const draggedDataStr = e.dataTransfer.getData('application/json');
    if (!draggedDataStr) return;

    try {
      const draggedObj = JSON.parse(draggedDataStr);
      const draggedType = draggedObj.type as 'folder' | 'text';
      const draggedId = draggedObj.id;

      if (draggedId === targetFolderId) return;

      // Optimistic update
      setData(prev => {
        const newData = { ...prev };
        if (draggedType === 'folder') {
          const folderIndex = newData.folders.findIndex(f => f.id === draggedId);
          if (folderIndex > -1) {
            newData.folders[folderIndex] = { ...newData.folders[folderIndex], parent_id: targetFolderId };
          }
        } else {
          const textIndex = newData.texts.findIndex(t => t.id === draggedId);
          if (textIndex > -1) {
            newData.texts[textIndex] = { ...newData.texts[textIndex], folder_id: targetFolderId };
          }
        }
        return newData;
      });

      await moveItem(draggedType, draggedId, targetFolderId);
      toast.success('Item movido com sucesso');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao mover item');
      window.location.reload();
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    setIsLoading(true);
    try {
      const newFolder = await createFolder(newFolderName, currentFolderId);
      if (newFolder) {
         setData(prev => ({
           ...prev,
           folders: [...prev.folders, { ...newFolder, type: 'folder' } as FolderItem]
         }));
      }
      setIsCreateFolderOpen(false);
      setNewFolderName('');
      toast.success('Pasta criada com sucesso!');
    } catch (error) {
       toast.error('Erro ao criar pasta');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (item: FolderItem | TextItem) => {
    if (confirm(`Tem certeza que deseja excluir '${item.type === 'folder' ? item.name : item.title}'?`)) {
       try {
         await deleteItem(item.type, item.id);
         setData(prev => {
           if (item.type === 'folder') {
             return { ...prev, folders: prev.folders.filter(f => f.id !== item.id) };
           } else {
             return { ...prev, texts: prev.texts.filter(t => t.id !== item.id) };
           }
         });
         toast.success('Excluído com sucesso');
       } catch (error) {
         toast.error('Erro ao excluir item');
       }
    }
  };

  const startRename = (item: FolderItem | TextItem) => {
    setItemToRename({ id: item.id, type: item.type });
    setRenameValue(item.type === 'folder' ? item.name : item.title);
    setIsRenameOpen(true);
  };

  const handleRename = async () => {
    if (!itemToRename || !renameValue.trim()) return;
    setIsLoading(true);
    try {
       await renameItem(itemToRename.type, itemToRename.id, renameValue);
       setData(prev => {
         const newData = { ...prev };
         if (itemToRename.type === 'folder') {
           const idx = newData.folders.findIndex(f => f.id === itemToRename.id);
           if (idx > -1) newData.folders[idx] = { ...newData.folders[idx], name: renameValue };
         } else {
           const idx = newData.texts.findIndex(t => t.id === itemToRename.id);
           if (idx > -1) newData.texts[idx] = { ...newData.texts[idx], title: renameValue };
         }
         return newData;
       });
       setIsRenameOpen(false);
       toast.success('Renomeado com sucesso');
    } catch (error) {
       toast.error('Erro ao renomear');
    } finally {
       setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background rounded-xl border shadow-sm">
      {/* Explorer Header Header / Breadcrumbs */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground overflow-x-auto">
          <button 
            onClick={() => setCurrentFolderId(null)}
            className="flex items-center hover:text-foreground transition-colors"
          >
            <Home className="h-4 w-4 mr-1" /> Raiz
          </button>
          
          {breadcrumbs.map((crumb) => (
            <React.Fragment key={crumb.id}>
              <ChevronRight className="h-4 w-4 flex-shrink-0" />
              <button 
                onClick={() => setCurrentFolderId(crumb.id)}
                className="hover:text-foreground transition-colors truncate max-w-[120px]"
              >
                {crumb.name}
              </button>
            </React.Fragment>
          ))}
        </div>

        <div className="flex items-center gap-2">
           <Button variant="outline" size="sm" onClick={() => setIsCreateFolderOpen(true)}>
             <FolderPlus className="h-4 w-4 mr-2" /> Nova Pasta
           </Button>
           {/* Drop to upload hook could be added here in the future */}
        </div>
      </div>

      {/* Explorer Content Area */}
      <div className="flex-1 p-4 overflow-y-auto min-h-[400px]">
        {currentFolders.length === 0 && currentTexts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
             <Upload className="h-12 w-12 mb-4 opacity-20" />
             <p>Esta pasta está vazia.</p>
             <p className="text-sm">Arraste itens para cá ou crie novos usando o AI Writer.</p>
          </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              
              {/* Render Folders First */}
              {currentFolders.map(folder => (
                 <FolderItemCard 
                    key={folder.id} 
                    folder={folder} 
                    onClick={() => setCurrentFolderId(folder.id)}
                    onRename={startRename}
                    onDelete={handleDelete}
                    onDrop={(e: React.DragEvent) => handleDrop(e, folder.id)}
                 />
              ))}

              {/* Render Texts Second */}
              {currentTexts.map(text => (
                 <FileItemCard 
                    key={text.id} 
                    text={text} 
                    onClick={() => onOpenText(text)}
                    onRename={startRename}
                    onDelete={handleDelete}
                 />
              ))}
            </div>
        )}
      </div>

      {/* Create Folder Dialog */}
      <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Nova Pasta</DialogTitle>
          </DialogHeader>
          <Input 
             value={newFolderName}
             onChange={(e) => setNewFolderName(e.target.value)}
             placeholder="Nome da pasta"
             onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
             autoFocus
          />
          <DialogFooter>
             <Button variant="outline" onClick={() => setIsCreateFolderOpen(false)}>Cancelar</Button>
             <Button onClick={handleCreateFolder} disabled={isLoading || !newFolderName.trim()}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Criar
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renomear</DialogTitle>
          </DialogHeader>
          <Input 
             value={renameValue}
             onChange={(e) => setRenameValue(e.target.value)}
             placeholder="Novo nome"
             onKeyDown={(e) => e.key === 'Enter' && handleRename()}
             autoFocus
          />
          <DialogFooter>
             <Button variant="outline" onClick={() => setIsRenameOpen(false)}>Cancelar</Button>
             <Button onClick={handleRename} disabled={isLoading || !renameValue.trim()}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Salvar
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
