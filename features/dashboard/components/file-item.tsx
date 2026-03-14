'use client';

import * as React from 'react';
import { FileText, MoreVertical, Trash, Edit2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { type TextItem } from '../actions';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface FileItemProps {
  text: TextItem;
  onClick: () => void;
  onRename: (text: TextItem) => void;
  onDelete: (text: TextItem) => void;
}

export function FileItemCard({ text, onClick, onRename, onDelete }: FileItemProps) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'text', id: text.id }));
    e.dataTransfer.effectAllowed = 'move';
  };
  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest('.dropdown-trigger')) return;
        onClick();
      }}
      className={cn(
        "group relative flex cursor-pointer select-none items-center gap-3 rounded-lg border bg-card p-3 shadow-sm transition-all hover:bg-accent hover:text-accent-foreground"
      )}
    >
      <FileText className="h-6 w-6 text-slate-500" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <span className="truncate text-sm font-medium">{text.title}</span>
        <span className="truncate text-xs text-muted-foreground">{text.category}</span>
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
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRename(text); }}>
              <Edit2 className="mr-2 h-4 w-4" /> Renomear
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(text); }} className="text-destructive focus:text-destructive">
              <Trash className="mr-2 h-4 w-4" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
