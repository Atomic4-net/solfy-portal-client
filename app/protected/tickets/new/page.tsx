import { NewTicketForm } from "@/components/new-ticket-form";
import { Suspense } from "react";

export default function NewTicketPage() {
  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Nuevo Ticket de Asistencia</h1>
        <p className="text-muted-foreground mt-2">
          Explícanos qué necesitas y nos pondremos en contacto contigo lo antes posible.
        </p>
      </div>

      <Suspense fallback={<div className="h-64 flex items-center justify-center font-bold uppercase text-[10px] tracking-widest opacity-30 animate-pulse">Cargando formulario...</div>}>
         <NewTicketForm />
      </Suspense>
    </div>
  );
}
