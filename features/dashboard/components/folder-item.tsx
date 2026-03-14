'use client';

import * as React from 'react';
import { Folder, MoreVertical, Trash, Edit2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { type FolderItem } from '../actions';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface FolderItemProps {
  folder: FolderItem;
  onClick: () => void;
  onRename: (folder: FolderItem) => void;
  onDelete: (folder: FolderItem) => void;
  onDrop: (e: React.DragEvent) => void;
}

export function FolderItemCard({ folder, onClick, onRename, onDelete, onDrop }: FolderItemProps) {
  const [isOver, setIsOver] = React.useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'folder', id: folder.id }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsOver(true);
  };

  const handleDragLeave = () => {
    setIsOver(false);
  };

  const handleDropEvent = (e: React.DragEvent) => {
    setIsOver(false);
    onDrop(e);
  };
  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDropEvent}
      onClick={(e) => {
        // Prevent clicking if triggering context menu
        const target = e.target as HTMLElement;
        if (target.closest('.dropdown-trigger')) return;
        onClick();
      }}
      className={cn(
        "group relative flex cursor-pointer select-none items-center gap-3 rounded-lg border bg-card p-3 shadow-sm transition-all hover:bg-accent hover:text-accent-foreground",
        isOver && "ring-2 ring-primary bg-primary/10"
      )}
    >
      <Folder className="h-6 w-6 text-blue-500 fill-blue-500/20" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <span className="truncate text-sm font-medium">{folder.name}</span>
      </div>
      
      <div className="dropdown-trigger ml-auto" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRename(folder); }}>
              <Edit2 className="mr-2 h-4 w-4" /> Renomear
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(folder); }} className="text-destructive focus:text-destructive">
              <Trash className="mr-2 h-4 w-4" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
