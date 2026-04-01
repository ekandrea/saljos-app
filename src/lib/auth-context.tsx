"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Seller {
  name: string;
  displayName: string;
  isAdmin: boolean;
}

interface AuthContextType {
  seller: Seller | null;
  loading: boolean;
  login: (name: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  seller: null,
  loading: true,
  login: async () => null,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.seller) setSeller(data.seller);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (name: string, password: string): Promise<string | null> => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, password }),
    });
    const data = await res.json();
    if (!res.ok) return data.error || 'Inloggning misslyckades';
    setSeller(data.seller);
    return null;
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setSeller(null);
  };

  return (
    <AuthContext.Provider value={{ seller, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
