import { ChevronRight, FilePlus, FolderPlus, MoreHorizontal } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupAction,
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
import { useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai/react";
import { WorkspaceEntry } from "@/schemes";
import { readDir, BaseDirectory, DirEntry, mkdir, create } from "@tauri-apps/plugin-fs";
import { Button } from "./ui/button";
import { Tooltip } from "@nextui-org/react";

async function loadFolders(rootPath: string): Promise<WorkspaceEntry[]> {
  const results: WorkspaceEntry[] = [];
  const entries = await readDir(rootPath, { baseDir: BaseDirectory.Desktop });

  async function processEntriesRecursive(parent: string, entries: DirEntry[]): Promise<void> {
    for (const entry of entries) {
      if (entry.isDirectory) {
        const dir = `${parent}/${entry.name}`;
        const childEntries = await readDir(dir, { baseDir: BaseDirectory.Desktop });

        const workspaceEntry: WorkspaceEntry = {
          name: entry.name,
          emoji: '📁',
          pages: [],
          children: []
        };

        for (const childEntry of childEntries) {
          if (!childEntry.isDirectory) {
            workspaceEntry.pages.push({
              name: childEntry.name,
              url: `#/workspace/${dir}/${childEntry.name}`,
              emoji: '📄'
            });
          }
        }

        results.push(workspaceEntry);

        if (workspaceEntry.children) {
          await processEntriesRecursive(dir, childEntries.filter(e => e.isDirectory));
        }
      }
    }
  }

  await processEntriesRecursive(rootPath, entries);
  return results;
}

export function NavFolders() {
  const lastActiveSpace = useAtomValue(lastOpenSpaceAtom);
  const spaces = useAtomValue(spacesAtom);
  const { data: folders = [] } = useQuery({
    queryKey: ['folders', spaces[lastActiveSpace].name],
    queryFn: () => loadFolders(spaces[lastActiveSpace].name)
  });

  const handleAddFile = async () => {
    try {
      const currentPath = spaces[lastActiveSpace].name;
      const fileName = `New File ${Date.now()}.typ`;
      const filePath = `${currentPath}/${fileName}`;
      
      await create(filePath, {
        baseDir: BaseDirectory.Desktop
      });

    } catch (error) {
      console.error('Failed to create file:', error);
    }
  };

  const handleAddFolder = async () => {
    try {
      const currentPath = spaces[lastActiveSpace].name;
      const folderName = `New Folder ${Date.now()}`;
      const folderPath = `${currentPath}/${folderName}`;
      await mkdir(folderPath, {
        baseDir: BaseDirectory.Desktop,
        recursive: true
      });
    } catch (error) {
      console.error('Failed to create folder:', error);
    }
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel>
        Files
        <div className="ml-auto">
          <Tooltip content="Add File">
            <Button variant="ghost" size="sm" onClick={handleAddFile}><FilePlus /></Button>
          </Tooltip>
          <Tooltip content="Add Folder">
            <Button variant="ghost" size="sm" onClick={handleAddFolder}><FolderPlus /></Button>
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
                    <span>{folder.emoji}</span>
                    <span>{folder.name}</span>
                  </a>
                </SidebarMenuButton>
                <CollapsibleTrigger asChild>
                  <SidebarMenuAction
                    className="left-2 bg-sidebar-accent text-sidebar-accent-foreground data-[state=open]:rotate-90"
                    showOnHover
                  >
                    <ChevronRight />
                  </SidebarMenuAction>
                </CollapsibleTrigger>
                {/* <SidebarMenuAction showOnHover onClick={() => handleAddPage(`${spaces[lastActiveSpace].name}/${folder.name}`)}>
                  <Plus />
                </SidebarMenuAction> */}
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {folder.pages.map((page) => (
                      <SidebarMenuSubItem key={page.name}>
                        <SidebarMenuSubButton asChild>
                          <a href="#">
                            <span>{page.emoji}</span>
                            <span>{page.name}</span>
                          </a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
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
