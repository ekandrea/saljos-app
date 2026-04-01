"use client";

import { useState, useEffect } from 'react';
import { Lead } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { bulkImportLeads, fetchSellers, createSeller, deleteSeller, changePassword } from '@/lib/store';
import { getSeedData } from '@/lib/seed';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Trash2, UserPlus, Key, Shield } from 'lucide-react';

function MigrateCard({ onReloadLeads }: { onReloadLeads?: () => void }) {
  const [migrateMsg, setMigrateMsg] = useState('');
  const [migrating, setMigrating] = useState(false);

  const handleMigrate = async () => {
    setMigrating(true);
    setMigrateMsg('Migrerar...');
    try {
      const res = await fetch('/api/migrate', { method: 'POST' });
      const data = await res.json();
      if (data.ok) {
        setMigrateMsg(`Klart! ${data.migrated} leads migrerade.`);
        if (onReloadLeads) onReloadLeads();
      } else {
        setMigrateMsg(data.error || 'Något gick fel');
      }
    } catch {
      setMigrateMsg('Nätverksfel');
    }
    setMigrating(false);
  };

  return (
    <Card className="border-blue-200">
      <CardContent className="p-6">
        <h3 className="font-bold mb-2">Migrera data från v1</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Flytta alla leads från gamla Säljös till nya databasen. Tryck bara en gång.
        </p>
        <Button variant="outline" onClick={handleMigrate} disabled={migrating}>
          {migrating ? 'Migrerar...' : 'Migrera nu'}
        </Button>
        {migrateMsg && <p className={`text-xs mt-2 ${migrateMsg.includes('Klart') ? 'text-green-600' : 'text-red-500'}`}>{migrateMsg}</p>}
      </CardContent>
    </Card>
  );
}

interface SettingsViewProps {
  leads: Lead[];
  onReloadLeads?: () => void;
}

export function SettingsView({ leads, onReloadLeads }: SettingsViewProps) {
  const { seller } = useAuth();

  // Change password
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [pwMsg, setPwMsg] = useState('');

  const handleChangePw = async () => {
    if (!oldPw || !newPw) { setPwMsg('Fyll i båda fälten'); return; }
    const res = await changePassword(oldPw, newPw);
    if (res.ok) { setPwMsg('Lösenord bytt!'); setOldPw(''); setNewPw(''); }
    else setPwMsg(res.error || 'Något gick fel');
  };

  // Admin: sellers
  const [sellers, setSellers] = useState<Array<{ id: string; name: string; display_name: string; is_admin: boolean }>>([]);
  const [newName, setNewName] = useState('');
  const [newDisplay, setNewDisplay] = useState('');
  const [newSellerPw, setNewSellerPw] = useState('');
  const [sellerMsg, setSellerMsg] = useState('');

  useEffect(() => {
    if (seller?.isAdmin) {
      fetchSellers().then(setSellers);
    }
  }, [seller?.isAdmin]);

  const handleAddSeller = async () => {
    if (!newName || !newSellerPw) { setSellerMsg('Namn och lösenord krävs'); return; }
    const res = await createSeller(newName, newDisplay || newName, newSellerPw, false);
    if (res.seller) {
      setSellers([...sellers, res.seller]);
      setNewName(''); setNewDisplay(''); setNewSellerPw('');
      setSellerMsg('Säljare tillagd!');
    } else {
      setSellerMsg(res.error || 'Något gick fel');
    }
  };

  const handleDeleteSeller = async (id: string, name: string) => {
    if (name === seller?.name) { setSellerMsg('Kan inte ta bort dig själv'); return; }
    await deleteSeller(id);
    setSellers(sellers.filter(s => s.id !== id));
  };

  // Test data
  const handleLoadTestData = async () => {
    const seed = getSeedData();
    const result = await bulkImportLeads(seed);
    if (result.count > 0 && onReloadLeads) onReloadLeads();
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-2xl font-extrabold tracking-tight mb-4">Inställningar</h1>

      {/* Change password */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Key size={18} className="text-blue-500" />
            <h3 className="font-bold">Byt lösenord</h3>
          </div>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground block mb-1">Nuvarande lösenord</label>
              <Input type="password" value={oldPw} onChange={e => setOldPw(e.target.value)} placeholder="..." className="h-9" />
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground block mb-1">Nytt lösenord</label>
              <Input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="..." className="h-9" />
            </div>
            <Button onClick={handleChangePw} size="sm" className="h-9">Byt</Button>
          </div>
          {pwMsg && <p className={`text-xs mt-2 ${pwMsg.includes('bytt') ? 'text-green-600' : 'text-red-500'}`}>{pwMsg}</p>}
        </CardContent>
      </Card>

      {/* Admin: Manage sellers */}
      {seller?.isAdmin && (
        <Card className="border-violet-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield size={18} className="text-violet-500" />
              <h3 className="font-bold">Hantera säljare</h3>
              <Badge className="bg-violet-100 text-violet-700 text-[10px]">Admin</Badge>
            </div>

            {/* Existing sellers */}
            <div className="space-y-2 mb-4">
              {sellers.map(s => (
                <div key={s.id} className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-lg">
                  <div>
                    <span className="font-medium text-sm">{s.display_name}</span>
                    <span className="text-xs text-muted-foreground ml-2">({s.name})</span>
                    {s.is_admin && <Badge className="ml-2 bg-violet-100 text-violet-700 text-[9px]">Admin</Badge>}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-600 h-7"
                    onClick={() => handleDeleteSeller(s.id, s.name)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
            </div>

            {/* Add seller */}
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-2">
                <UserPlus size={14} className="text-muted-foreground" />
                <span className="text-xs font-bold text-muted-foreground uppercase">Lägg till säljare</span>
              </div>
              <div className="flex gap-2">
                <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Användarnamn" className="h-9 text-sm" />
                <Input value={newDisplay} onChange={e => setNewDisplay(e.target.value)} placeholder="Visningsnamn" className="h-9 text-sm" />
                <Input type="password" value={newSellerPw} onChange={e => setNewSellerPw(e.target.value)} placeholder="Lösenord" className="h-9 text-sm" />
                <Button onClick={handleAddSeller} size="sm" className="h-9 shrink-0">Lägg till</Button>
              </div>
              {sellerMsg && <p className={`text-xs mt-2 ${sellerMsg.includes('tillagd') ? 'text-green-600' : 'text-red-500'}`}>{sellerMsg}</p>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Migrate from v1 */}
      {seller?.isAdmin && (
        <MigrateCard onReloadLeads={onReloadLeads} />
      )}

      {/* Test data */}
      <Card className="border-dashed">
        <CardContent className="p-6">
          <h3 className="font-bold mb-2">Testdata</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Ladda in exempeldata med prospekt och leads.
          </p>
          <Button variant="outline" onClick={handleLoadTestData}>
            Ladda testdata ({getSeedData().length} poster)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
