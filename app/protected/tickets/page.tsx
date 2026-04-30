import { getTicketsByContactId, getContactDeals, getDealTickets } from "@/lib/hubspot";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { TicketList } from "@/components/ticket-list";
import { isTicketOpen } from "@/lib/ticket-utils";
import { ProjectFilter } from "@/components/project-filter";

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ dealId?: string }>;
}) {
  const { dealId } = await searchParams;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('hubspot_contact_id')
    .eq('id', user.id)
    .single();
  
  const contactId = profile?.hubspot_contact_id;

  // 1. Fetch data based on filter
  const [projects, tickets] = await Promise.all([
    contactId ? getContactDeals(contactId) : [],
    contactId 
      ? (dealId ? getDealTickets(dealId) : getTicketsByContactId(contactId))
      : []
  ]);

  // KPI Calculations using new status utility
  const totalTickets = tickets.length;
  const openTickets = tickets.filter((t: any) => isTicketOpen(t.properties.hs_pipeline_stage)).length;
  const highPriority = tickets.filter((t: any) => 
    t.properties.hs_ticket_priority === "HIGH" || t.properties.hs_ticket_priority === "ALTA"
  ).length;
  const lastUpdate = tickets.length > 0 
    ? new Date(tickets[0].properties.createdate).toLocaleDateString('es', { day: '2-digit', month: 'short' }) 
    : "N/A";

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-3xl font-black tracking-tighter">Panel de Soporte</h1>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground font-medium uppercase tracking-widest text-[10px]">
               <span>Solicitudes</span>
               <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
               <span>Histórico de consultas</span>
            </div>
          </div>
          
          <ProjectFilter projects={projects} currentDealId={dealId} />
        </div>
        <Button asChild className="rounded-full shadow-lg h-10 px-6 font-black uppercase text-[11px] tracking-tight transition-transform active:scale-95">
          <Link href={dealId ? `/protected/tickets/new?dealId=${dealId}` : "/protected/tickets/new"}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nueva Solicitud
          </Link>
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border shadow-none rounded-2xl bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center justify-between">
              Total Solicitudes
              <div className="p-1 rounded bg-muted h-5 w-5" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black tracking-tighter">{totalTickets}</div>
          </CardContent>
        </Card>

        <Card className="border shadow-none rounded-2xl bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center justify-between">
              Solicitudes Abiertas
              <div className="p-1 rounded bg-secondary flex items-center justify-center h-5 w-5">
                 <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black tracking-tighter">{openTickets}</div>
          </CardContent>
        </Card>
      </div>

      <div className="pt-4">
          <TicketList initialTickets={tickets} />
      </div>
    </div>
  );
}
