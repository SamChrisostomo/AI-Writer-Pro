'use server';

import { createClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

export type FolderItem = {
  id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
  type: 'folder';
};

export type TextItem = {
  id: string;
  title: string;
  content: string;
  category: string;
  folder_id: string | null;
  created_at: string;
  type: 'text';
};

export type FileSystemData = {
  folders: FolderItem[];
  texts: TextItem[];
};

export async function fetchExplorerData(): Promise<FileSystemData> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  // Fetch folders
  const { data: folders, error: foldersError } = await supabase
    .from('folders')
    .select('*')
    .eq('user_id', user.id)
    .order('name', { ascending: true });

  if (foldersError) throw foldersError;

  // Fetch texts
  const { data: texts, error: textsError } = await supabase
    .from('texts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (textsError) throw textsError;

  return {
    folders: (folders || []).map(f => ({ ...f, type: 'folder' })),
    texts: (texts || []).map(t => ({ ...t, type: 'text' })),
  };
}

export async function createFolder(name: string, parentId: string | null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const { data, error } = await supabase
    .from('folders')
    .insert({
      user_id: user.id,
      name,
      parent_id: parentId,
    })
    .select()
    .single();

  if (error) throw error;
  
  revalidatePath('/dashboard');
  return data;
}

export async function renameItem(type: 'folder' | 'text', id: string, newName: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const table = type === 'folder' ? 'folders' : 'texts';
  const nameColumn = type === 'folder' ? 'name' : 'title';

  const { error } = await supabase
    .from(table)
    .update({ [nameColumn]: newName })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
  
  revalidatePath('/dashboard');
}

export async function deleteItem(type: 'folder' | 'text', id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const table = type === 'folder' ? 'folders' : 'texts';

  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
  
  revalidatePath('/dashboard');
}

export async function moveItem(type: 'folder' | 'text', itemId: string, targetFolderId: string | null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const table = type === 'folder' ? 'folders' : 'texts';
  const column = type === 'folder' ? 'parent_id' : 'folder_id';

  // Prevent moving folder into itself
  if (type === 'folder' && itemId === targetFolderId) {
    throw new Error('Cannot move folder into itself');
  }

  const { error } = await supabase
    .from(table)
    .update({ [column]: targetFolderId })
    .eq('id', itemId)
    .eq('user_id', user.id);

  if (error) throw error;
  
  revalidatePath('/dashboard');
}
