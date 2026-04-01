"use client";

import { Lead } from './types';

const LOCK_MIN = 120;

export function getSellerName(): string {
  if (typeof window === 'undefined') return 'andy';
  return sessionStorage.getItem('saljos_seller') || 'andy';
}

export function setSellerName(name: string) {
  const n = name.toLowerCase().trim();
  sessionStorage.setItem('saljos_seller', n);
  sessionStorage.setItem('saljos_auth', '1');
}

export function isLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem('saljos_auth') === '1';
}

export function logout() {
  sessionStorage.clear();
}

function localKey(): string {
  return 'saljos_leads_' + getSellerName();
}

export function loadLeads(): Lead[] {
  if (typeof window === 'undefined') return [];
  try {
    // Try new key first, fallback to old key
    let raw = localStorage.getItem(localKey());
    if (!raw) {
      raw = localStorage.getItem('saljos_leads_v2');
      if (raw) localStorage.setItem(localKey(), raw);
    }
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function saveLeads(leads: Lead[]) {
  try {
    localStorage.setItem(localKey(), JSON.stringify(leads));
  } catch {}
}

export async function cloudPull(): Promise<Lead[]> {
  try {
    const res = await fetch('/api/sync?seller=' + encodeURIComponent(getSellerName()));
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    if (data.record?.leads?.length > 0) {
      return data.record.leads;
    }
  } catch {}
  return [];
}

export async function cloudPush(leads: Lead[]) {
  try {
    await fetch('/api/sync', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leads, seller: getSellerName(), updatedAt: new Date().toISOString() }),
    });
  } catch {}
}

export function lockLead(leads: Lead[], id: number, seller: string): Lead[] {
  return leads.map(l => {
    if (l.id !== id) return l;
    if (l.lockedBy && l.lockedBy !== seller && !lockExpired(l)) return l;
    return { ...l, lockedBy: seller, lockedAt: new Date().toISOString() };
  });
}

export function unlockLead(leads: Lead[], id: number, seller: string): Lead[] {
  return leads.map(l => {
    if (l.id !== id || l.lockedBy !== seller) return l;
    return { ...l, lockedBy: null, lockedAt: null };
  });
}

function lockExpired(l: Lead): boolean {
  if (!l.lockedAt) return true;
  return (Date.now() - new Date(l.lockedAt).getTime()) / 60000 > LOCK_MIN;
}

export function nextId(leads: Lead[]): number {
  return leads.length ? Math.max(...leads.map(l => l.id)) + 1 : 1;
}

export function getPassword(): string {
  if (typeof window === 'undefined') return 'saljos2026';
  return localStorage.getItem('saljos_pw') || 'saljos2026';
}
