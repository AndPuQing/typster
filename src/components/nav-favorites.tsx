import { useState } from "react";
import {
  ArrowUpRight,
  Link,
  MoreHorizontal,
  StarOff,
  Trash2,
} from "lucide-react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
} from "@nextui-org/react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Favorite } from "@/schemes";
import { useAtom } from "jotai/react";
import { favoritesAtom } from "@/store";

export function NavFavorites() {
  const { isMobile } = useSidebar();
  const [favorites, setFavorites] = useAtom(favoritesAtom);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedItem, setSelectedItem] = useState<Favorite | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleRemoveFavorite = (item: Favorite) => {
    setFavorites(favorites.filter((fav) => fav.name !== item.name));
  };

  const handleOpenNewTab = (url: string) => {
    window.open(url, '_blank');
  };

  const handleDeleteClick = (item: Favorite) => {
    setSelectedItem(item);
    onOpen();
  };

  const handleConfirmDelete = async () => {
    if (!selectedItem) return;
    setIsDeleting(true);
    try {
      handleRemoveFavorite(selectedItem);
      onClose();
    } catch (error) {
      console.error('Failed to delete favorite:', error);
    } finally {
      setIsDeleting(false);
      setSelectedItem(null);
    }
  };

  return (
    <>
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel>Favorites</SidebarGroupLabel>
        <SidebarMenu>
          {favorites.length === 0 ? (
            <SidebarMenuItem>
              <SidebarMenuButton className="text-sidebar-foreground/70">
                <div className="flex flex-col items-center py-4 px-2">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">
                      Click the 🌟 icon on any page to add it to your favorites
                    </p>
                  </div>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ) : (
            <>
              {favorites.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton asChild>
                    <a href={item.url} title={item.name}>
                      <span>{item.emoji}</span>
                      <span>{item.name}</span>
                    </a>
                  </SidebarMenuButton>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuAction showOnHover>
                        <MoreHorizontal />
                        <span className="sr-only">More</span>
                      </SidebarMenuAction>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="w-56 rounded-lg"
                      side={isMobile ? "bottom" : "right"}
                      align={isMobile ? "end" : "start"}
                    >
                      <DropdownMenuItem onClick={() => handleRemoveFavorite(item)}>
                        <StarOff className="text-muted-foreground" />
                        <span>Remove from Favorites</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleOpenNewTab(item.url)}>
                        <ArrowUpRight className="text-muted-foreground" />
                        <span>Open in New Tab</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleDeleteClick(item)}>
                        <Trash2 className="text-muted-foreground" />
                        <span>Delete</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton className="text-sidebar-foreground/70">
                  <MoreHorizontal />
                  <span>More</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </>
          )}
        </SidebarMenu>
      </SidebarGroup>

      <Modal 
        isOpen={isOpen} 
        onClose={onClose}
        size="sm"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Confirm Delete
              </ModalHeader>
              <ModalBody>
                <p>
                  Are you sure you want to delete "
                  <span className="font-semibold">
                    {selectedItem?.name}
                  </span>
                  "?
                </p>
                <p className="text-sm text-default-500">
                  This action cannot be undone.
                </p>
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="light"
                  onPress={onClose}
                >
                  Cancel
                </Button>
                <Button
                  color="danger"
                  onPress={handleConfirmDelete}
                  isLoading={isDeleting}
                >
                  Delete
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
