'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';
import { api, getAuthToken, setAuthToken, removeAuthToken, getStoredUser, setStoredUser } from '@/lib/api';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const initAuth = async () => {
      const token = getAuthToken();
      const savedUser = getStoredUser();

      if (token && savedUser) {
        setUser(savedUser);
        try {
          const freshUser = await api.get<any>('/auth/me');
          if (freshUser) {
            setUser((prev) => ({ ...prev, ...freshUser }));
            setStoredUser({ ...savedUser, ...freshUser });
          }
        } catch (e) {
          console.error('Session expired or error verifying user', e);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = (token: string, userData: User) => {
    setAuthToken(token);
    setStoredUser(userData);
    setUser(userData);
  };

  const logout = () => {
    removeAuthToken();
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

