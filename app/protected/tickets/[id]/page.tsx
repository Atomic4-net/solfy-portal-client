import { getTicket, getTicketMessages, getTicketContact, getContactTickets, hubspotRequest, getDeal } from "@/lib/hubspot";
import { createClient } from "@/lib/supabase/server";
import { TicketChat } from "@/components/ticket-chat";
import { Badge } from "@/components/ui/badge";
import { TicketInfoSidebar } from "@/components/ticket-info-sidebar";
import { ArrowLeft, ChevronRight, Phone, Video, MoreHorizontal, MessageSquare, Info } from "lucide-react";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { SyncRedirect } from "@/components/sync-redirect";
import { Button } from "@/components/ui/button";

export default async function TicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  let hubspotId = id;
  let displayPortalId = id;

  // 1. Resolve ID and handle redirection if it's a portal ID
  const isPortalId = id.startsWith('SOL-') || (id.length < 10 && !isNaN(Number(id)));

  if (isPortalId) {
    const numericId = id.startsWith('SOL-') ? id.replace('SOL-', '') : id;
    const { data: ticketMap } = await supabase
      .from('tickets')
      .select('hubspot_id, portal_id')
      .eq('portal_id', numericId)
      .single();
    
    if (ticketMap?.hubspot_id) {
      return redirect(`/protected/tickets/${ticketMap.hubspot_id}`);
    } else {
      return <SyncRedirect />;
    }
  }

  // 2. Fetch all necessary data for the new layout
  const [hsTicket, messages, portalLookup, contact] = await Promise.all([
    getTicket(hubspotId),
    getTicketMessages(hubspotId),
    supabase.from('tickets').select('portal_id').eq('hubspot_id', hubspotId).single(),
    getTicketContact(hubspotId)
  ]);

  if (!hsTicket) notFound();
  
  if (portalLookup.data?.portal_id) {
    displayPortalId = `SOL-${portalLookup.data.portal_id}`;
  }

  // 3. Fetch ticket associations (Deal/Project)
  const [dealAssoc] = await Promise.all([
    hubspotRequest(`/crm/v4/objects/ticket/${hubspotId}/associations/deal`).catch(() => ({ results: [] }))
  ]);

  const dealId = dealAssoc.results?.[0]?.toObjectId;
  const project = dealId ? await getDeal(dealId).catch(() => null) : null;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] -mt-8 -mx-8 bg-background overflow-hidden font-sans">
      {/* Top Header / Breadcrumbs */}
      <header className="h-16 px-6 border-b bg-background flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
          <Link href="/protected/tickets" className="hover:text-foreground transition-colors font-bold uppercase tracking-tight text-[10px]">Mis Tickets</Link>
          <ChevronRight className="h-3 w-3 opacity-50" />
          <span className="text-foreground font-black uppercase tracking-tight text-[10px]">Tiquet {displayPortalId}</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href={`/protected/tickets`}>
            <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary">Cerrar</Button>
          </Link>
        </div>
      </header>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Main Chat Canvas */}
        <main className="flex-1 flex flex-col min-w-0 bg-background border-r relative overflow-hidden">
          <div className="flex-1 flex flex-col min-h-0 relative">
               <TicketChat ticketId={hubspotId} initialMessages={messages} />
          </div>
        </main>

        {/* Right Sidebar - Ticket Info */}
        <aside className="w-80 shrink-0 hidden xl:block bg-background/50 backdrop-blur-sm">
          <div className="h-full p-6">
            <TicketInfoSidebar 
              ticket={{
                 subject: hsTicket.properties.subject,
                 priority: hsTicket.properties.hs_ticket_priority,
                 category: hsTicket.properties.hs_ticket_category,
                 status: hsTicket.properties.hs_pipeline_stage,
                 createdate: hsTicket.properties.createdate
              }}
              project={project ? {
                 name: project.properties.dealname,
                 id: project.id
              } : undefined}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
