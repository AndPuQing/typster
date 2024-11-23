import { ChevronRight, FilePlus, FolderPlus, MoreHorizontal } from "lucide-react"

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
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { lastOpenSpaceAtom, spacesAtom } from "@/store";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAtomValue } from "jotai/react";
import { WorkspaceEntry } from "@/schemes";
import { readDir, DirEntry, mkdir, create } from "@tauri-apps/plugin-fs";
import { Button } from "./ui/button";
import { Tooltip } from "@nextui-org/react";
import { toast } from "sonner";

async function loadFolders(rootPath: string): Promise<WorkspaceEntry[]> {
  const results: WorkspaceEntry[] = [];
  const entries = await readDir(rootPath);
  async function processEntriesRecursive(parent: string, entries: DirEntry[]): Promise<void> {
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      results.push({
        name: entry.name,
        isDirectory: entry.isDirectory,
        isFile: entry.isFile,
        path: `${parent}/${entry.name}`,
        children: []
      });
    }
    for (const entry of entries) {
      if (entry.isDirectory) {
        const path = `${parent}/${entry.name}`;
        const subEntries = await readDir(path);
        await processEntriesRecursive(path, subEntries);
      }
    }
  }
  await processEntriesRecursive(rootPath, entries);
  console.log(results);
  return results;
}

export function NavFolders() {
  const lastActiveSpace = useAtomValue(lastOpenSpaceAtom);
  const spaces = useAtomValue(spacesAtom);
  const queryClient = useQueryClient();

  const { data: folders = [] } = useQuery({
    queryKey: ['folders', spaces[lastActiveSpace].name],
    queryFn: () => loadFolders(spaces[lastActiveSpace].url)
  });

  const handleAddFile = async () => {
    try {
      const currentPath = spaces[lastActiveSpace].url;
      const fileName = `New File ${Date.now()}.typ`;
      const filePath = `${currentPath}/${fileName}`;
      await create(filePath);
      await queryClient.invalidateQueries({ queryKey: ['folders'] });
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
      await queryClient.invalidateQueries({ queryKey: ['folders'] });
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
          {folders.map((folder) => (
            <Collapsible key={folder.name}>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="#">
                    {folder.isDirectory ? "📁" : "📄"}
                    <span>{folder.name}</span>
                  </a>
                </SidebarMenuButton>
                {folder.isDirectory && (
                  <>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuAction
                        className="left-2 bg-sidebar-accent text-sidebar-accent-foreground data-[state=open]:rotate-90"
                        showOnHover
                      >
                        <ChevronRight />
                      </SidebarMenuAction>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {folder.children?.map((child) => (
                          <SidebarMenuSubItem key={child.name}>
                            <SidebarMenuSubButton asChild>
                              <a href="#">
                                {child.isDirectory ? "📁" : "📄"}
                                <span>{child.name}</span>
                              </a>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </>
                )}
              </SidebarMenuItem>
            </Collapsible>
          ))}
          <SidebarMenuItem>
            <SidebarMenuButton className="text-sidebar-foreground/70">
              <MoreHorizontal />
              <span>More</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
