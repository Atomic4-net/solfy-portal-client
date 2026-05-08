import { getDeal, getDealTickets } from "@/lib/hubspot";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Tag, Calendar } from "lucide-react";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getTicketDisplayLabel } from "@/lib/ticket-utils";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  
  // 1. Get user and verify deal
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Fetch Deal and Tickets
  const [deal, tickets] = await Promise.all([
    getDeal(id),
    getDealTickets(id)
  ]);

  if (!deal) notFound();

  // Temporary mapping logic for the type (ideally use a real HubSpot property if available)
  const dealName = (deal.properties.dealname || "").toLowerCase();
  const inferredType = dealName.includes("aerotermia") 
    ? "Sistema de Aerotermia" 
    : dealName.includes("cargador") || dealName.includes("carregador")
    ? "Cargador de coche Eléctrico"
    : "Sistema Fotovoltaico";
  type DealTicket = { id: string; properties: Record<string, string | undefined> };
  const projectTickets = tickets as DealTicket[];

  return (
    <div className="flex-1 w-full flex flex-col gap-8 p-4 md:p-8">
      <div className="flex items-center gap-4">
        <Link href="/protected/projects" className="p-2 hover:bg-muted rounded-full">
            <ArrowLeft className="h-6 w-6" />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-black mt-1 tracking-tight">{deal.properties.dealname}</h1>
        </div>
        <Link href={`/protected/tickets/new?dealId=${id}&type=${encodeURIComponent(inferredType)}`}>
            <Button className="font-bold flex gap-2">
                <Plus className="h-4 w-4" /> Nuevo Ticket
            </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
          {/* Main Info Card */}
          <Card className="md:col-span-1 border-2">
            <CardHeader>
                <CardTitle className="text-lg">Detalles del Proyecto</CardTitle>
                <CardDescription>Información general</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2 font-bold uppercase text-[10px] tracking-widest"><Calendar className="h-3 w-3" /> Último cambio</span>
                    <span className="font-medium">{new Date(deal.properties.hs_lastmodifieddate).toLocaleDateString('es')}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2 font-bold uppercase text-[10px] tracking-widest"><Tag className="h-3 w-3" /> Tipo</span>
                    <span className="font-medium">{inferredType}</span>
                </div>
            </CardContent>
          </Card>

          {/* Tickets List for this Deal */}
          <Card className="md:col-span-3 border-2">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/10">
                <div>
                   <CardTitle className="text-xl font-bold">Mis tickets</CardTitle>
                </div>
                <span className="text-xs font-mono text-muted-foreground">{projectTickets.length}</span>
            </CardHeader>
            <CardContent className="p-0">
               <div className="divide-y">
                 {projectTickets.length > 0 ? (
                   projectTickets.map((ticket) => (
                     <Link key={ticket.id} href={`/protected/tickets/${ticket.id}`} className="block p-6 hover:bg-muted/50 transition-colors group">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <span className="text-xs font-mono text-muted-foreground">#{ticket.id}</span>
                                <h4 className="text-lg font-bold group-hover:text-primary transition-colors">
                                  {getTicketDisplayLabel(ticket.properties)}
                                </h4>
                            </div>
                        </div>
                     </Link>
                   ))
                 ) : (
                   <div className="p-12 text-center text-muted-foreground italic">
                      No hay tickets asociados a este proyecto.
                   </div>
                 )}
               </div>
            </CardContent>
          </Card>
      </div>
    </div>
  );
}
