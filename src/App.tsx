import { BreadcrumbItem, NextUIProvider } from "@nextui-org/react";

import { useNavigate } from "react-router-dom";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { NavActions } from "@/components/nav-actions";
import { Toaster } from "@/components/ui/sonner"
import { useTheme } from "./components/theme-provider";

export default function App() {
  const navigate = useNavigate();

  const { theme } = useTheme()

  return (
    <NextUIProvider navigate={navigate}>
      <SidebarProvider>
        <Toaster richColors theme={theme} closeButton toastOptions={{ classNames:{
          toast: "shadow-lg rounded-lg flex items-center p-4 text-xs gap-1.5",
        }}} />
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center gap-2">
            <div className="flex flex-1 items-center gap-2 px-3">
              <SidebarTrigger />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbPage className="line-clamp-1">
                      Project Management & Task Tracking
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="ml-auto px-3">
              <NavActions />
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 px-4 py-10">
            <div className="mx-auto h-24 w-full max-w-3xl rounded-xl bg-muted/50" />
            <div className="mx-auto h-full w-full max-w-3xl rounded-xl bg-muted/50" />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </NextUIProvider>
  );
}
