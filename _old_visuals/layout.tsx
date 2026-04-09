import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { AuthButton } from "@/components/auth-button";
import { Separator } from "@/components/ui/separator";
import { Suspense } from "react";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b">
            <div className="flex items-center gap-2 px-4 w-full justify-between">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Separator
                  orientation="vertical"
                  className="mr-2 data-[orientation=vertical]:h-4"
                />
                <span className="text-sm font-medium text-muted-foreground hidden md:inline-block">
                  Solfy Client Portal
                </span>
              </div>
              <div className="flex items-center gap-4">
                <Suspense>
                  <AuthButton />
                </Suspense>
                <ThemeSwitcher />
              </div>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-6 pt-6">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
