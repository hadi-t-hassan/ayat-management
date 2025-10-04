import React, { createContext, useContext, useEffect, useState } from 'react';

// API base URL
const API_BASE_URL = 'http://localhost:8000/api';

// User and profile types
interface User {
  id: string;
  username: string;
}

interface Session {
  user: User;
}

interface Profile {
  id: string;
  name: string;
  username: string;
  role: string;
  user_id: string;
  permissions?: Record<string, boolean>;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<{ error: any }>;
  signUp: (password: string, name: string, username: string, role?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>;
  refreshToken: () => Promise<boolean>;
  isTokenExpired: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check for existing session in localStorage
    const savedUser = localStorage.getItem('user');
    const savedProfile = localStorage.getItem('profile');
    
    if (savedUser && savedProfile) {
      setUser(JSON.parse(savedUser));
      setProfile(JSON.parse(savedProfile));
      setSession({ user: JSON.parse(savedUser) });
    }
  }, []);

  const signIn = async (username: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { error: new Error(errorData.detail || 'Login failed') };
      }

      const data = await response.json();
      
      // Extract user data from response
      const userData = data.user;
      const profileData = data.profile;
      const tokens = {
        access: data.access,
        refresh: data.refresh
      };

      const user: User = {
        id: userData.id.toString(),
        username: userData.username,
      };

      const profile: Profile = {
        id: profileData.id.toString(),
        name: profileData.name || `${userData.first_name} ${userData.last_name}`,
        username: profileData.username,
        role: profileData.role,
        user_id: userData.id.toString(),
        permissions: userData.permissions || {},
        created_at: profileData.created_at,
        updated_at: profileData.updated_at,
      };

      setUser(user);
      setSession({ user });
      setProfile(profile);
      
      // Save to localStorage
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('profile', JSON.stringify(profile));
      localStorage.setItem('access_token', tokens.access);
      localStorage.setItem('refresh_token', tokens.refresh);
      
      return { error: null };
    } catch (error) {
      return { error: new Error('Network error during login') };
    }
  };

  const signUp = async (password: string, name: string, username: string, role: string = 'user') => {
    try {
      // Validate password length
      if (password.length < 8) {
        return { error: new Error('Password must be at least 8 characters long') };
      }

      // Split name into first and last name
      const nameParts = name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Ensure last name is not empty
      const finalLastName = lastName || firstName;

      const response = await fetch(`${API_BASE_URL}/auth/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          first_name: firstName,
          last_name: finalLastName,
          password,
          password_confirm: password,
          role,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Handle specific validation errors
        if (errorData.password) {
          return { error: new Error(errorData.password[0]) };
        }
        if (errorData.username) {
          return { error: new Error(errorData.username[0]) };
        }
        if (errorData.first_name) {
          return { error: new Error(errorData.first_name[0]) };
        }
        if (errorData.last_name) {
          return { error: new Error(errorData.last_name[0]) };
        }
        return { error: new Error(errorData.detail || 'Registration failed') };
      }

      const data = await response.json();
      
      // Registration successful - don't automatically log in
      // Just return success without setting user state
      return { error: null };
    } catch (error) {
      return { error: new Error('Network error during registration') };
    }
  };

  const signOut = async () => {
    setUser(null);
    setSession(null);
    setProfile(null);
    localStorage.removeItem('user');
    localStorage.removeItem('profile');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  };

  // Check if token is expired
  const isTokenExpired = () => {
    const token = localStorage.getItem('access_token');
    if (!token) return true;
    
    try {
      // Decode JWT token to check expiration
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      return true; // If we can't decode the token, consider it expired
    }
  };

  // Refresh access token using refresh token
  const refreshToken = async (): Promise<boolean> => {
    try {
      const refreshTokenValue = localStorage.getItem('refresh_token');
      if (!refreshTokenValue) {
        return false;
      }

      const response = await fetch(`${API_BASE_URL}/auth/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh: refreshTokenValue,
        }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      localStorage.setItem('access_token', data.access);
      
      // Update refresh token if provided
      if (data.refresh) {
        localStorage.setItem('refresh_token', data.refresh);
      }
      
      return true;
    } catch (error) {
      return false;
    }
  };

  // Auto-logout when token expires
  useEffect(() => {
    const checkTokenExpiry = () => {
      if (user && isTokenExpired()) {
        signOut();
        // Redirect to login page
        window.location.href = '/auth';
      }
    };

    // Check token expiry every 30 seconds
    const interval = setInterval(checkTokenExpiry, 30000);
    
    // Also check immediately
    checkTokenExpiry();

    return () => clearInterval(interval);
  }, [user]);

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user || !profile) {
      return { error: new Error('No user logged in') };
    }

    const updatedProfile = { ...profile, ...updates };
    setProfile(updatedProfile);
    localStorage.setItem('profile', JSON.stringify(updatedProfile));

    return { error: null };
  };

  const value = {
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    refreshToken,
    isTokenExpired,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};