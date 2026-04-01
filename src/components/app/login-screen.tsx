"use client";

import { useState } from 'react';
import { getPassword } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function LoginScreen({ onLogin }: { onLogin: (name: string) => void }) {
  const [name, setName] = useState('');
  const [pw, setPw] = useState('');
  const [error, setError] = useState(false);

  const handleLogin = () => {
    if (!name.trim()) { setError(true); return; }
    if (pw !== getPassword()) { setError(true); setPw(''); return; }
    onLogin(name.trim());
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-[#0c0c14] via-[#151530] to-[#1e1450] flex items-center justify-center z-50">
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(91,95,199,.15),transparent_70%)] rounded-full" />
      <Card className="w-[400px] border-0 shadow-2xl relative z-10">
        <CardContent className="pt-10 pb-10 px-10 text-center">
          <div className="text-5xl mb-2">&#9889;</div>
          <h2 className="text-2xl font-extrabold tracking-tight mb-1">Säljös</h2>
          <p className="text-sm text-muted-foreground mb-8">Sales OS — unified B2B sales dashboard</p>
          <Input
            placeholder="Ditt namn"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && document.getElementById('pw')?.focus()}
            className="mb-3 text-center"
          />
          <Input
            id="pw"
            type="password"
            placeholder="Lösenord"
            value={pw}
            onChange={e => setPw(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            className="mb-4 text-center"
          />
          <Button
            onClick={handleLogin}
            className="w-full h-12 text-sm font-bold bg-gradient-to-r from-[#5b5fc7] to-[#7c7ff2] hover:opacity-90"
          >
            Logga in
          </Button>
          {error && <p className="text-red-500 text-xs mt-3">Fel lösenord eller namn saknas</p>}
        </CardContent>
      </Card>
    </div>
  );
}
