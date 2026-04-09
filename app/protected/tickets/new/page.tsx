import { NewTicketForm } from "@/components/new-ticket-form";

export default function NewTicketPage() {
  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Nuevo Ticket de Asistencia</h1>
        <p className="text-muted-foreground mt-2">
          Explícanos qué necesitas y nos pondremos en contacto contigo lo antes posible.
        </p>
      </div>

      <NewTicketForm />
    </div>
  );
}
