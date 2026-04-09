"use client";

import { useState } from "react";
import { setPasswordAction } from "@/app/actions/user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";

export function SetPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await setPasswordAction(formData);

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      router.push("/protected");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="password">Nueva contraseña</Label>
        <Input 
            id="password" 
            name="password" 
            type="password" 
            placeholder="Min. 6 caracteres"
            minLength={6}
            required 
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
        <Input 
            id="confirmPassword" 
            name="confirmPassword" 
            type="password" 
            placeholder="Repite tu contraseña"
            required 
        />
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 p-2 rounded-md">
          <p className="text-xs text-destructive text-center font-medium">{error}</p>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Guardando..." : "Guardar y continuar"}
      </Button>
    </form>
  );
}
