import { getTicketsByContactId, getContactDeals, getDealTickets } from "@/lib/hubspot";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { TicketList } from "@/components/ticket-list";
import { ProjectFilter } from "@/components/project-filter";
import { ensureUserProfile } from "@/lib/user-profile";

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ dealId?: string }>;
}) {
  const { dealId } = await searchParams;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const profile = await ensureUserProfile(user);
  const contactId = profile?.hubspot_contact_id;

  // 1. Fetch data based on filter
  const [projects, tickets] = await Promise.all([
    contactId ? getContactDeals(contactId) : [],
    contactId 
      ? (dealId ? getDealTickets(dealId) : getTicketsByContactId(contactId))
      : []
  ]);

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-3xl font-black tracking-tighter">Mis Tickets</h1>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground font-medium uppercase tracking-widest text-[10px]">
               <span>Tickets</span>
               <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
               <span>Histórico de consultas</span>
            </div>
          </div>
          
          <ProjectFilter projects={projects} currentDealId={dealId} />
        </div>
        <Button asChild className="rounded-full shadow-lg h-10 px-6 font-black uppercase text-[11px] tracking-tight transition-transform active:scale-95">
          <Link href={dealId ? `/protected/tickets/new?dealId=${dealId}` : "/protected/tickets/new"}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nuevo Ticket
          </Link>
        </Button>
      </div>

      <div className="pt-4">
          <TicketList initialTickets={tickets} />
      </div>
    </div>
  );
}
