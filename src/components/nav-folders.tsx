import { ChevronRight, FilePlus, FolderPlus, Copy, Trash, Edit, MoreHorizontal, FileUp, FolderUp } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { lastOpenSpaceAtom, spacesAtom } from "@/store";
import { useAtomValue } from "jotai/react";
import { WorkspaceEntry } from "@/schemes";
import { readDir, DirEntry, mkdir, create, BaseDirectory, readTextFile, writeTextFile, exists, rename, remove } from "@tauri-apps/plugin-fs";
import { Button } from "./ui/button";
import { Tooltip } from "@nextui-org/react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu"

async function loadFolders(rootPath: string): Promise<WorkspaceEntry[]> {
  const entries = await readDir(rootPath, { baseDir: BaseDirectory.Desktop });

  async function processEntriesRecursive(parent: string, entries: DirEntry[]): Promise<WorkspaceEntry[]> {
    const items: WorkspaceEntry[] = [];

    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;

      const path = parent === '/'
        ? `${parent}${entry.name}`
        : `${parent}/${entry.name}`;

      if (entry.isDirectory) {
        try {
          const subEntries = await readDir(path);
          const children = await processEntriesRecursive(path, subEntries);
          items.push({
            name: entry.name,
            isDirectory: true,
            isFile: false,
            path,
            children
          });
        } catch (error) {
          console.warn(`Failed to read directory ${path}:`, error);
          items.push({
            name: entry.name,
            isDirectory: true,
            isFile: false,
            path,
            children: []
          });
        }
      } else {
        items.push({
          name: entry.name,
          isDirectory: false,
          isFile: true,
          path,
          children: []
        });
      }
    }
    return items;
  }

  return processEntriesRecursive(rootPath, entries);
}


interface FileItemProps {
  file: WorkspaceEntry;
  onRename: (path: string, isDirectory: boolean) => void;
  onDuplicate: (path: string, isDirectory: boolean) => void;
  onDelete: (path: string, isDirectory: boolean) => void;
}

function FileItem({ file, onRename, onDuplicate, onDelete }: FileItemProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <SidebarMenuItem>
          <SidebarMenuButton asChild className="pl-8">
            <a href={file.path}>
              <span>{file.name}</span>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onSelect={() => onRename(file.path, false)}>
          <Edit className="mr-2 h-4 w-4" />
          重命名
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => onDuplicate(file.path, false)}>
          <Copy className="mr-2 h-4 w-4" />
          复制
        </ContextMenuItem>
        <ContextMenuItem
          className="text-red-600"
          onSelect={() => onDelete(file.path, false)}
        >
          <Trash className="mr-2 h-4 w-4" />
          删除
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

interface FolderTreeProps {
  items: WorkspaceEntry[];
  onRename: (path: string, isDirectory: boolean) => void;
  onDuplicate: (path: string, isDirectory: boolean) => void;
  onDelete: (path: string, isDirectory: boolean) => void;
}

function FolderTree({ items, onRename, onDuplicate, onDelete }: FolderTreeProps) {
  return (
    <>
      {items.map((item) => (
        !item.isDirectory ? (
          <FileItem key={item.path} file={item} onRename={onRename} onDuplicate={onDuplicate} onDelete={onDelete} />
        ) : (
          <ContextMenu key={item.path}>
            <ContextMenuTrigger>
              <SidebarMenuItem>
                <Collapsible className="group/collapsible">
                  <CollapsibleTrigger asChild>
                    <SidebarMenuSubButton>
                      <ChevronRight size={16} className="transition-transform group-data-[state=open]/collapsible:rotate-90" />
                      <span>{item.name}</span>
                    </SidebarMenuSubButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <FolderTree items={item.children ?? []} onRename={onRename} onDuplicate={onDuplicate} onDelete={onDelete} />
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem onSelect={() => onRename(item.path, true)}>
                <Edit className="mr-2 h-4 w-4" />
                重命名
              </ContextMenuItem>
              <ContextMenuItem onSelect={() => onDuplicate(item.path, true)}>
                <Copy className="mr-2 h-4 w-4" />
                复制
              </ContextMenuItem>
              <ContextMenuItem
                className="text-red-600"
                onSelect={() => onDelete(item.path, true)}
              >
                <Trash className="mr-2 h-4 w-4" />
                删除
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        )
      ))}
    </>
  )
}

export function NavFolders() {
  const lastActiveSpace = useAtomValue(lastOpenSpaceAtom);
  const spaces = useAtomValue(spacesAtom);
  const [folders, setFolders] = useState<WorkspaceEntry[]>([]);

  useEffect(() => {
    const loadFolderData = async () => {
      try {
        const data = await loadFolders(spaces[lastActiveSpace].url);
        setFolders(data);
      } catch (error) {
        toast.error(`Failed to load folders: ${error}`);
      }
    };
    loadFolderData();
  }, [spaces, lastActiveSpace]);

  const handleRename = async (path: string, isDirectory: boolean) => {
    try {
      const oldPath = path;
      const oldName = oldPath.split('/').pop();
      const newName = prompt('Enter new name:', oldName);

      if (!newName || newName === oldName) return;

      const newPath = oldPath.replace(oldName!, newName);

      if (await exists(newPath, { baseDir: BaseDirectory.Desktop })) {
        toast.error('A file or folder with this name already exists');
        return;
      }
      await rename(oldPath, newPath, { oldPathBaseDir: BaseDirectory.Desktop, newPathBaseDir: BaseDirectory.Desktop });
      const updatedFolders = await loadFolders(spaces[lastActiveSpace].url);
      setFolders(updatedFolders);
      toast.success(`Renamed successfully`);
    } catch (error) {
      toast.error(`Failed to rename: ${error}`);
    }
  };

  const handleDelete = async (path: string, isDirectory: boolean) => {
    try {
      if (confirm(`Are you sure you want to delete ${path}?`)) {
        await remove(path, { recursive: true, baseDir: BaseDirectory.Desktop });
        const updatedFolders = await loadFolders(spaces[lastActiveSpace].url);
        setFolders(updatedFolders);
      }
    } catch (error) {
      toast.error(`Failed to delete: ${error}`);
    }
  };

  const handleDuplicate = async (path: string, isDirectory: boolean) => {
    try {

      const name = path.split('/').pop();
      const newPath = `${path}_copy`;

      if (isDirectory) {
        await mkdir(newPath, {
          recursive: true,
          baseDir: BaseDirectory.Desktop
        });
      } else {
        const content = await readTextFile(path, { baseDir: BaseDirectory.Desktop });
        await create(newPath, { baseDir: BaseDirectory.Desktop });
        await writeTextFile(newPath, content, { baseDir: BaseDirectory.Desktop });
      }
      const updatedFolders = await loadFolders(spaces[lastActiveSpace].url);
      setFolders(updatedFolders);
      toast.success(`Duplicated successfully`);
    } catch (error) {
      toast.error(`Failed to duplicate: ${error}`);
    }
  };

  const handleAddFile = async () => {
    try {
      const currentPath = spaces[lastActiveSpace].url;
      const fileName = `New File ${Date.now()}.typ`;
      const filePath = `${currentPath}/${fileName}`;
      await create(filePath, { baseDir: BaseDirectory.Desktop });
      const updatedFolders = await loadFolders(spaces[lastActiveSpace].url);
      setFolders(updatedFolders);
      toast.success(`File "${fileName}" created at ${filePath}`);
    } catch (error) {
      toast.error(`Failed to create file: ${error}`);
    }
  };

  const handleAddFolder = async () => {
    try {
      const currentPath = spaces[lastActiveSpace].url;
      const folderName = `New Folder ${Date.now()}`;
      const folderPath = `${currentPath}/${folderName}`;
      await mkdir(folderPath, {
        recursive: true
      });
      const updatedFolders = await loadFolders(spaces[lastActiveSpace].url);
      setFolders(updatedFolders);
      toast.success(`Folder "${folderName}" created at ${folderPath}`);
    } catch (error) {
      toast.error(`Failed to create folder: ${error}`);
    }
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel>
        Files
        <div className="ml-auto">
          <Tooltip content="Add File">
            <Button variant="ghost" size="sm" onClick={handleAddFile}><FilePlus size={16} /></Button>
          </Tooltip>
          <Tooltip content="Add Folder">
            <Button variant="ghost" size="sm" onClick={handleAddFolder}><FolderPlus size={16} /></Button>
          </Tooltip>
        </div>
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <FolderTree items={folders} onRename={handleRename} onDuplicate={handleDuplicate} onDelete={handleDelete} />
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
