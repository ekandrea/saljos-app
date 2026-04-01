"use client";

import { Lead } from './types';

// ============================================
// API-based store (replaces localStorage sync)
// ============================================

export async function fetchLeads(): Promise<Lead[]> {
  try {
    const res = await fetch('/api/leads');
    if (!res.ok) return [];
    const data = await res.json();
    return data.leads || [];
  } catch {
    return [];
  }
}

export async function updateLead(id: number, updates: Partial<Lead>): Promise<Lead | null> {
  try {
    const res = await fetch(`/api/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.lead;
  } catch {
    return null;
  }
}

export async function createLead(lead: Partial<Lead>): Promise<Lead | null> {
  try {
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lead),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.lead;
  } catch {
    return null;
  }
}

export async function bulkImportLeads(leads: Lead[]): Promise<{ leads: Lead[]; count: number }> {
  try {
    const res = await fetch('/api/leads/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leads }),
    });
    if (!res.ok) return { leads: [], count: 0 };
    return res.json();
  } catch {
    return { leads: [], count: 0 };
  }
}

export async function fetchPins(): Promise<number[]> {
  try {
    const res = await fetch('/api/pins');
    if (!res.ok) return [];
    const data = await res.json();
    return data.pinnedIds || [];
  } catch {
    return [];
  }
}

export async function addPin(leadId: number): Promise<void> {
  await fetch('/api/pins', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ leadId }),
  });
}

export async function removePin(leadId: number): Promise<void> {
  await fetch('/api/pins', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ leadId }),
  });
}

// ============================================
// Lead locking (still client-side logic, saves via API)
// ============================================

export function lockLeadLocal(leads: Lead[], id: number, seller: string): Lead[] {
  return leads.map(l => {
    if (l.id !== id) return l;
    if (l.lockedBy && l.lockedBy !== seller && !lockExpired(l)) return l;
    return { ...l, lockedBy: seller, lockedAt: new Date().toISOString() };
  });
}

export function unlockLeadLocal(leads: Lead[], id: number, seller: string): Lead[] {
  return leads.map(l => {
    if (l.id !== id || l.lockedBy !== seller) return l;
    return { ...l, lockedBy: null, lockedAt: null };
  });
}

function lockExpired(l: Lead): boolean {
  if (!l.lockedAt) return true;
  return (Date.now() - new Date(l.lockedAt).getTime()) / 60000 > 120;
}

// ============================================
// Admin: sellers management
// ============================================

export async function fetchSellers() {
  const res = await fetch('/api/admin/sellers');
  if (!res.ok) return [];
  const data = await res.json();
  return data.sellers || [];
}

export async function createSeller(name: string, displayName: string, password: string, isAdmin: boolean) {
  const res = await fetch('/api/admin/sellers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, displayName, password, isAdmin }),
  });
  return res.json();
}

export async function deleteSeller(id: string) {
  const res = await fetch('/api/admin/sellers', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  return res.json();
}

export async function changePassword(oldPassword: string, newPassword: string) {
  const res = await fetch('/api/auth/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ oldPassword, newPassword }),
  });
  return res.json();
}
