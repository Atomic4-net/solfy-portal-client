"use client";

import { useState } from "react";
import { createTicketAction } from "@/app/actions/tickets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter, useSearchParams } from "next/navigation";

export function NewTicketForm() {
  const searchParams = useSearchParams();
  const dealId = searchParams.get("dealId");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    const { error, success, portalId, hubspotId } = await createTicketAction(formData);

    if (error) {
      setError(error);
      setIsLoading(false);
    } else if (success) {
      // Redirect directly to HubSpot ID for immediate loading
      router.push(`/protected/tickets/${hubspotId || portalId}`);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="subject">Asunto</Label>
            <Input
              id="subject"
              name="subject"
              placeholder="Ej: No funciona el cargador"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Descripción</Label>
            <Textarea
              id="content"
              name="content"
              placeholder="Cuéntanos más detalles..."
              className="min-h-[150px]"
              required
            />
          </div>

          {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

          {/* Hidden input for dealId to associate with project */}
          {dealId && <input type="hidden" name="dealId" value={dealId} />}

          <div className="flex justify-end gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creando..." : "Crear Ticket"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
