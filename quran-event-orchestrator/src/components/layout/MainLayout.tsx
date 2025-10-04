import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useLanguage } from "@/contexts/LanguageContext";
import { PanelLeft, PanelRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MainLayoutProps {
  children: React.ReactNode;
}

// Custom SidebarTrigger that adapts to RTL
const AdaptiveSidebarTrigger = () => {
  const { isRTL } = useLanguage();
  const { toggleSidebar } = useSidebar();
  
  return (
    <Button
      data-sidebar="trigger"
      variant="ghost"
      size="icon"
      className="h-7 w-7 md:hidden"
      onClick={toggleSidebar}
    >
      {isRTL ? <PanelRight /> : <PanelLeft />}
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
};

// Inner component that uses the sidebar context
const MainLayoutContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isRTL } = useLanguage();
  
  return (
    <div className={`min-h-screen flex w-full bg-background ${isRTL ? 'rtl' : 'ltr'}`}>
      <AppSidebar side={isRTL ? 'right' : 'left'} />
      
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className={`h-14 border-b bg-card flex items-center px-4 gap-4 sticky top-0 z-40 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <AdaptiveSidebarTrigger />
          <div className="flex-1 min-w-0">
            <h1 className={`text-lg font-semibold truncate ${isRTL ? 'text-right' : 'text-left'}`}>Ayat Events Management</h1>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <SidebarProvider>
      <MainLayoutContent>
        {children}
      </MainLayoutContent>
    </SidebarProvider>
  );
};