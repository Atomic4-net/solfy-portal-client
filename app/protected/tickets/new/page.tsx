import { NewTicketForm } from "@/components/new-ticket-form";
import { ServiceSelection } from "@/components/service-selection";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getDeal, getContactDeals, WON_STAGES } from "@/lib/hubspot";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { ensureUserProfile } from "@/lib/user-profile";

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

  const profile = await ensureUserProfile(user);

  // 2. Get Deal info if dealId exists, and all available projects
  let codigoExpediente = "";
  type Project = { id: string; properties: { dealname: string; dealstage: string } };
  let availableProjects: Project[] = [];
  
  if (profile?.hubspot_contact_id) {
    const deals = (await getContactDeals(profile.hubspot_contact_id)) as Project[];
    availableProjects = deals.filter((d) => WON_STAGES.includes(d.properties.dealstage));
  }

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
    <div className="max-w-5xl mx-auto py-3 px-3 md:py-4 md:px-4">
      {category && (
        <Link href={dealId ? `?dealId=${dealId}` : "/protected/tickets/new"} className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary mb-3 transition-colors">
          <ChevronLeft className="h-4 w-4" /> Volver a la selección
        </Link>
      )}

      <div className="mb-4">
        <h1 className="text-3xl md:text-4xl font-black tracking-tighter font-jakarta">{currentHeading.title}</h1>
        <p className="text-muted-foreground mt-1 font-medium">
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
              availableProjects={availableProjects}
           />
         )}

         {category === "documentacion" && (
           <NewTicketForm 
              defaultName={profile?.full_name || ""}
              defaultEmail={user.email || ""}
              defaultExpediente={codigoExpediente}
              formCategory="documentacion"
              availableProjects={availableProjects}
           />
         )}
      </Suspense>
    </div>
  );
}
