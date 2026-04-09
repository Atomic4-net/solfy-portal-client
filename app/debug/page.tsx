"use client";

import { useState } from "react";
import { testSupabaseConnection, testSignUpSimple } from "@/app/actions/debug";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";

export default function DebugPage() {
  const [email, setEmail] = useState("test@example.com");
  const [response, setResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleTestConnection = async () => {
    setIsLoading(true);
    setResponse(null);
    const res = await testSupabaseConnection();
    setResponse({ test: "Conexión", ...res });
    setIsLoading(false);
  };

  const handleTestSignUp = async () => {
    setIsLoading(true);
    setResponse(null);
    const res = await testSignUpSimple(email);
    setResponse({ test: "Registro", ...res });
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-zinc-50 dark:bg-zinc-950 font-sans">
      <Card className="w-full max-w-lg shadow-xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <CardHeader className="text-center pb-8">
          <CardTitle className="text-3xl font-black text-primary tracking-tight">Solfy Debug Panel</CardTitle>
          <CardDescription className="text-zinc-500 dark:text-zinc-400">Herramienta de diagnóstico para Supabase</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          
          <div className="space-y-4 p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Paso 1: ¿Supabase está vivo?</h3>
            <Button 
                onClick={handleTestConnection} 
                className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold transition-all"
                disabled={isLoading}
            >
              {isLoading ? "Consultando..." : "Test de Conectividad Base"}
            </Button>
          </div>

          <div className="space-y-4 p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Paso 2: ¿Auth (GoTrue) responde?</h3>
            <div className="flex gap-2">
                <Input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="Email de prueba"
                    className="border-zinc-200 dark:border-zinc-800"
                />
            </div>
            <Button 
                onClick={handleTestSignUp} 
                variant="outline" 
                className="w-full h-12 border-2 hover:bg-zinc-100 transition-all font-bold"
                disabled={isLoading}
            >
              {isLoading ? "Intentando..." : "Test de SignUp (Email/Password)"}
            </Button>
          </div>

          {response && (
            <div className={`mt-6 p-6 rounded-xl border-2 transition-all animate-in fade-in slide-in-from-bottom-4 ${response.success ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'}`}>
              <div className="flex items-center gap-2 mb-2 font-black">
                <span className="text-xs uppercase px-2 py-1 bg-current/10 rounded">{response.test} Result</span>
                <span className="text-lg">{response.success ? "✅ ÉXITO" : "❌ FALLO"}</span>
              </div>
              <p className="text-sm font-medium mb-4">{response.message || response.error}</p>
              {!response.success && response.status && (
                <div className="flex items-baseline gap-2 pt-4 border-t border-current/10">
                   <span className="text-xs font-bold uppercase opacity-60">Status Code:</span>
                   <span className="text-2xl font-black">{response.status}</span>
                </div>
              )}
            </div>
          )}
          
          <div className="text-center pt-4 text-xs text-zinc-400 font-medium">
             Si recibes un <span className="font-bold text-rose-500 underline underline-offset-4 decoration-rose-500/30">503</span>, es un problema de red en Kong/Filtro.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
