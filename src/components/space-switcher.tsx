import * as React from "react";
import { ChevronsUpDown, Plus } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAtom } from "jotai/react";
import { lastOpenSpaceAtom, spacesAtom } from "@/store";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "./ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { Input } from "./ui/input";
import { useForm } from "react-hook-form"
import { open } from "@tauri-apps/plugin-dialog";
import { LogicalSize, Window } from "@tauri-apps/api/window"
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { invoke } from "@tauri-apps/api/core";
import { useNavigate } from "react-router-dom";

function openSpaceManager() {
  invoke("create_window")
}

export function SpaceSwitcher() {
  const { isMobile } = useSidebar();
  const [spaces, setSpaces] = useAtom(spacesAtom);
  const [lastActiveSpace, setLastActiveSpace] = useAtom(lastOpenSpaceAtom);
  const [activeTeam, setActiveTeam] = React.useState(spaces[lastActiveSpace]);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const form = useForm({
    defaultValues: {
      name: "",
      location: ""
    }
  });

  const handleCreateSpace = (values: { name: string; location: string }) => {
    if (!values.name || !values.location) {
      toast.error("Please fill in all fields");
      return;
    }
    const newSpace = {
      name: values.name,
      url: values.location,
      icon: "😊"
    };
    setSpaces([...spaces, newSpace]);
    toast.success(`Space "${values.name}" created at ${values.location}`);
    setIsDialogOpen(false);
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg text-sidebar-primary-foreground">
                {activeTeam.icon}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {activeTeam.name}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Workspaces
            </DropdownMenuLabel>
            {spaces.map((space, index) => (
              <DropdownMenuItem
                key={space.name}
                onClick={() => {
                  setActiveTeam(space);
                  setLastActiveSpace(index);
                }}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-sm border">
                  {/* {space.icon} */}
                  {space.icon != "" ? space.icon : "😊"}
                </div>
                {space.name}
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2" onClick={() => openSpaceManager()}>
              <Plus className="size-4" />
              <div className="font-medium text-muted-foreground">Add Space</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {/* <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a local Workspace</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreateSpace)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <div className="space-y-1 flex flex-row">
                        <div className="space-y-1 flex flex-col">
                          <FormLabel>Space Name</FormLabel>
                          <FormDescription>
                            This is the name of your workspace.
                          </FormDescription>
                        </div>
                        <FormControl className="w-1/3 ml-auto">
                          <Input placeholder="My Space" {...field} />
                        </FormControl>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <div className="space-y-1 flex flex-row">
                        <div className="space-y-1 flex flex-col">
                          <FormLabel>Space Location</FormLabel>
                          <FormDescription>
                            This is the location of your workspace on your local machine.
                          </FormDescription>
                        </div>
                        <div className="flex flex-col">
                          <FormControl className="w-1/2 ml-auto">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={async () => {
                                const dir = await open({ directory: true });
                                if (dir) {
                                  field.onChange(dir);
                                }
                              }}
                            >
                              Browse
                            </Button>
                          </FormControl>
                          <div className="text-xs text-muted-foreground">{field.value}</div>
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit">Create</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent> */}
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
