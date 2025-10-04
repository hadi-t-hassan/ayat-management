import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

// Available pages for permissions
export const getAvailablePagesConfig = (t: any) => [
  { id: 'dashboard', title: t.dashboard, url: '/dashboard', icon: 'LayoutDashboard' },
  { id: 'users', title: t.users, url: '/users', icon: 'Users' },
  { id: 'events', title: t.events, url: '/events', icon: 'Calendar' },
  { id: 'parties', title: t.parties, url: '/parties', icon: 'PartyPopper' },
  { id: 'language-settings', title: t.settings, url: '/language-settings', icon: 'Languages' },
];

export const usePermissions = () => {
  const { profile } = useAuth();
  const { t } = useLanguage();

  const hasPermission = (pageId: string): boolean => {
    if (!profile) return false;
    
    // If user has no permissions set, give them dashboard access by default
    if (!profile.permissions || Object.keys(profile.permissions).length === 0) {
      return pageId === 'dashboard';
    }
    
    // Check user permissions (both admin and user roles respect their specific permissions)
    return profile.permissions && profile.permissions[pageId];
  };

  const getAvailablePages = () => {
    if (!profile) return [];
    
    const availablePagesConfig = getAvailablePagesConfig(t);
    
    // If user has no permissions set, give them dashboard access by default
    if (!profile.permissions || Object.keys(profile.permissions).length === 0) {
      return availablePagesConfig.filter(page => page.id === 'dashboard');
    }
    
    // Both admin and user roles see only pages they have permission for
    return availablePagesConfig.filter(page => hasPermission(page.id));
  };

  return {
    hasPermission,
    getAvailablePages,
    isAdmin: profile?.role === 'admin',
  };
};

