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

// Cache seller info in sessionStorage for instant load
function getCachedSeller(): Seller | null {
  if (typeof window === 'undefined') return null;
  try {
    const cached = sessionStorage.getItem('saljos_seller_cache');
    if (cached) return JSON.parse(cached);
  } catch {}
  return null;
}

function setCachedSeller(seller: Seller | null) {
  try {
    if (seller) sessionStorage.setItem('saljos_seller_cache', JSON.stringify(seller));
    else sessionStorage.removeItem('saljos_seller_cache');
  } catch {}
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const cached = getCachedSeller();
  const [seller, setSeller] = useState<Seller | null>(cached);
  const [loading, setLoading] = useState(!cached); // If cached, no loading spinner

  // Validate session in background (don't block UI)
  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.seller) {
          setSeller(data.seller);
          setCachedSeller(data.seller);
        } else {
          setSeller(null);
          setCachedSeller(null);
        }
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
    setCachedSeller(data.seller);
    return null;
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setSeller(null);
    setCachedSeller(null);
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
