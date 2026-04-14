import { NewTicketForm } from "@/components/new-ticket-form";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getDeal } from "@/lib/hubspot";
import { redirect } from "next/navigation";

export default async function NewTicketPage({
  searchParams,
}: {
  searchParams: Promise<{ dealId?: string }>;
}) {
  const { dealId } = await searchParams;
  const supabase = await createClient();
  
  // 1. Get user profile
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();

  // 2. Get Deal info if dealId exists
  let codigoExpediente = "";
  if (dealId) {
    try {
      const deal = await getDeal(dealId);
      codigoExpediente = deal.properties.codigo_de_expediente || "";
    } catch (e) {
      console.error("DEBUG: Failed to fetch deal for expediente:", e);
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Nuevo Ticket de Asistencia</h1>
        <p className="text-muted-foreground mt-2 font-medium">
          Explícanos qué necesitas y nos pondremos en contacto contigo lo antes posible.
        </p>
      </div>

      <Suspense fallback={<div className="h-64 flex items-center justify-center font-bold uppercase text-[10px] tracking-widest opacity-30 animate-pulse font-jakarta">Cargando formulario...</div>}>
         <NewTicketForm 
            defaultName={profile?.full_name || ""}
            defaultEmail={user.email || ""}
            defaultExpediente={codigoExpediente}
         />
      </Suspense>
    </div>
  );
}
