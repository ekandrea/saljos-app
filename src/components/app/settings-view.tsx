"use client";

import { Lead } from '@/lib/types';
import { cloudPush } from '@/lib/store';
import { getSeedData } from '@/lib/seed';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface SettingsViewProps {
  leads: Lead[];
  onUpdateLeads?: (leads: Lead[]) => void;
}

export function SettingsView({ leads, onUpdateLeads }: SettingsViewProps) {
  const handleExport = () => {
    const b = new Blob([JSON.stringify({ leads }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(b);
    a.download = 'saljos_backup.json';
    a.click();
  };

  const handleLoadTestData = () => {
    if (!onUpdateLeads) return;
    const seed = getSeedData();
    const existingIds = new Set(leads.map(l => l.id));
    const newLeads = seed.filter(l => !existingIds.has(l.id));
    onUpdateLeads([...leads, ...newLeads]);
  };

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight mb-4">Inställningar</h1>
      <Card>
        <CardContent className="p-6">
          <h3 className="font-bold mb-4">Datahantering</h3>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => cloudPush(leads)}>Synka nu</Button>
            <Button variant="outline" onClick={handleExport}>Exportera</Button>
          </div>
        </CardContent>
      </Card>

      {onUpdateLeads && (
        <Card className="mt-4 border-dashed">
          <CardContent className="p-6">
            <h3 className="font-bold mb-2">Testdata</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Ladda in exempeldata med prospekt och leads för att testa systemet.
            </p>
            <Button variant="outline" onClick={handleLoadTestData}>
              Ladda testdata ({getSeedData().length} poster)
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
