import { NewTicketForm } from "@/components/new-ticket-form";
import { ServiceSelection } from "@/components/service-selection";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getDeal } from "@/lib/hubspot";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default async function NewTicketPage({
  searchParams,
}: {
  searchParams: Promise<{ dealId?: string; category?: string }>;
}) {
  const { dealId, category } = await searchParams;
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

  // Define headings based on selection
  const headings = {
    default: {
      title: "Nueva Solicitud",
      subtitle: "Selecciona el tipo de gestión que necesitas realizar.",
    },
    asistencia: {
      title: "Asistencia Técnica",
      subtitle: "Explícanos tu incidencia para que podamos ayudarte.",
    },
    documentacion: {
      title: "Solicitud de Documentación",
      subtitle: "Certificados, facturas y gestión de documentos.",
    }
  };

  const currentHeading = headings[category as keyof typeof headings] || headings.default;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {category && (
        <Link href={dealId ? `?dealId=${dealId}` : "/protected/tickets/new"} className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary mb-6 transition-colors">
          <ChevronLeft className="h-4 w-4" /> Volver a la selección
        </Link>
      )}

      <div className="mb-10">
        <h1 className="text-4xl font-black tracking-tighter font-jakarta">{currentHeading.title}</h1>
        <p className="text-muted-foreground mt-2 font-medium">
          {currentHeading.subtitle}
        </p>
      </div>

      <Suspense fallback={<div className="h-64 flex items-center justify-center font-bold uppercase text-[10px] tracking-widest opacity-30 animate-pulse font-jakarta">Cargando...</div>}>
         {!category && <ServiceSelection />}
         
         {category === "asistencia" && (
           <NewTicketForm 
              defaultName={profile?.full_name || ""}
              defaultEmail={user.email || ""}
              defaultExpediente={codigoExpediente}
           />
         )}

         {category === "documentacion" && (
           <NewTicketForm 
              defaultName={profile?.full_name || ""}
              defaultEmail={user.email || ""}
              defaultExpediente={codigoExpediente}
              formCategory="documentacion"
           />
         )}
      </Suspense>
    </div>
  );
}
