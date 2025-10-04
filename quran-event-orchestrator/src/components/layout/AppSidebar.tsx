import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  PartyPopper, 
  Languages,
  LogOut
} from "lucide-react";
import logo from '@/assets/logo.png';
import { usePermissions } from "@/hooks/use-permissions";
import { useIsMobile } from "@/hooks/use-mobile";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { LanguageSwitch } from "@/components/LanguageSwitch";

// Icon mapping
const iconMap = {
  LayoutDashboard,
  Users,
  Calendar,
  PartyPopper,
  Languages,
};

interface AppSidebarProps {
  side?: 'left' | 'right';
}

export function AppSidebar({ side = 'left' }: AppSidebarProps) {
  const { state, setOpenMobile } = useSidebar();
  const location = useLocation();
  const { signOut, profile } = useAuth();
  const { t, isRTL } = useLanguage();
  const { getAvailablePages } = usePermissions();
  const isMobile = useIsMobile();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  // Auto-close sidebar on mobile when route changes
  useEffect(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }, [location.pathname, isMobile, setOpenMobile]);
  
  // Get navigation items based on user permissions
  const navigation = getAvailablePages().map(page => ({
    title: page.title,
    url: page.url,
    icon: iconMap[page.icon as keyof typeof iconMap],
  }));

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    `transition-colors ${isActive 
      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
      : "hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
    }`;

  const handleSignOut = async () => {
    await signOut();
  };

  const handleNavClick = () => {
    // Close sidebar on mobile when navigation item is clicked
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar 
      side={side}
      className={`${collapsed ? "w-14" : "w-64"} ${isRTL ? "rtl" : "ltr"}`} 
      collapsible="icon"
    >
      <SidebarContent>
        {/* Header */}
        <SidebarGroup>
          <div className={`flex items-center gap-2 px-4 py-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <img src={logo} alt="Ayat Events" className="h-8 w-8" />
            {!collapsed && (
              <div className={isRTL ? 'text-right' : 'text-left'}>
                <h2 className="text-lg font-semibold text-sidebar-foreground">
                  Ayat Events
                </h2>
                <p className="text-xs text-sidebar-foreground/70">
                  Management System
                </p>
              </div>
            )}
          </div>
        </SidebarGroup>

        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>{t.dashboard}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.filter(item => !item.title.includes('Settings')).map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end 
                      className={getNavCls}
                      onClick={handleNavClick}
                    >
                      <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span className={isRTL ? 'text-right' : 'text-left'}>{item.title}</span>}
                      </div>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Settings */}
        {navigation.filter(item => item.title.includes('Settings')).length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>{t.settings}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigation.filter(item => item.title.includes('Settings')).map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        end 
                        className={getNavCls}
                        onClick={handleNavClick}
                      >
                        <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <item.icon className="h-4 w-4" />
                          {!collapsed && <span className={isRTL ? 'text-right' : 'text-left'}>{item.title}</span>}
                        </div>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* User Info */}
        {!collapsed && profile && (
          <SidebarGroup>
            <SidebarGroupLabel>{t.users}</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className={`px-4 py-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                <p className="text-sm font-medium text-sidebar-foreground">
                  {profile.name}
                </p>
                <p className="text-xs text-sidebar-foreground/70 capitalize">
                  {profile.role}
                </p>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {!collapsed && (
            <SidebarMenuItem>
              <div className="px-2 py-1">
                <LanguageSwitch />
              </div>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <LogOut className="h-4 w-4" />
                {!collapsed && <span className={isRTL ? 'text-right' : 'text-left'}>{t.logout}</span>}
              </div>
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}