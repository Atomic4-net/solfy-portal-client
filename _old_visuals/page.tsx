import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getContactByEmail, getContactDeals, getTicketsByContactId, WON_STAGES } from "@/lib/hubspot";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, ChevronRight, MessageSquare, Ticket, User, Sparkles } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export default async function ProtectedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // 1. Get Profile
  let { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // HEAL: If no profile exists for an authenticated user, try to create it from HubSpot
  if (!profile && user.email) {
    console.log(`DEBUG: Profile missing for ${user.email}. Attempting auto-creation...`);
    const contact = await getContactByEmail(user.email);
    if (contact) {
      const { data: newProfile, error } = await supabase
        .from('user_profiles')
        .insert({
          id: user.id,
          hubspot_contact_id: contact.id,
          full_name: `${contact.properties.firstname || ''} ${contact.properties.lastname || ''}`.trim() || user.email
        })
        .select()
        .single();
      
      if (!error) {
        profile = newProfile;
        console.log(`DEBUG: Profile auto-created for ${user.email}`);
      } else {
        console.error("DEBUG: Failed to auto-create profile:", error);
      }
    }
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <User className="h-16 w-16 text-muted-foreground mb-4 opacity-20" />
        <h2 className="text-2xl font-bold">Perfil no encontrado</h2>
        <p className="text-muted-foreground mt-2 max-w-md">
          No hemos podido vincular tu cuenta con los datos de HubSpot. Por favor, contacta con soporte para sincronizar tu ficha.
        </p>
        <Link href="/auth/logout" className="mt-6">
            <Button variant="outline">Cerrar sesión e intentar de nuevo</Button>
        </Link>
      </div>
    );
  }

  // 2. Fetch Dashboard Data
  const [deals, tickets] = await Promise.all([
    getContactDeals(profile.hubspot_contact_id),
    getTicketsByContactId(profile.hubspot_contact_id)
  ]);

  const activeDeals = deals.filter((deal: any) => WON_STAGES.includes(deal.properties.dealstage));
  const openTickets = tickets.filter((t: any) => t.properties.hs_pipeline_stage !== 'CERRADO');
  const recentTickets = tickets.slice(0, 3);

  return (
    <div className="flex-1 w-full flex flex-col gap-8">
      {/* Welcome Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-primary/5 p-8 md:p-12 border-2 border-primary/10">
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-xs mb-4">
             <Sparkles className="h-4 w-4" /> Bienvenido a Solfy
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            Hola, {profile.full_name?.split(' ')[0] || "Cliente"}
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl">
            Desde aquí puedes gestionar tus instalaciones fotovoltaicas, seguir el estado de tus proyectos y comunicarte con nuestro equipo técnico.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-1/4 translate-y-1/4">
           <Building2 className="h-96 w-96 text-primary" />
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid gap-6 md:grid-cols-3">
         <Card className="border-2 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Proyectos Activos</CardTitle>
                <Building2 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-black">{activeDeals.length}</div>
            </CardContent>
         </Card>
         <Card className="border-2 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Tickets Abiertos</CardTitle>
                <Ticket className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-black">{openTickets.length}</div>
            </CardContent>
         </Card>
         <Card className="border-2 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Mensajes Nuevos</CardTitle>
                <MessageSquare className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-black">0</div>
            </CardContent>
         </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
         {/* Recent Projects */}
         <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
                <h2 className="text-xl font-black uppercase tracking-tight">Tus Proyectos</h2>
                <Link href="/protected/projects" className="text-sm font-bold text-primary hover:underline">Ver todos</Link>
            </div>
            <div className="space-y-4">
                {activeDeals.length > 0 ? (
                  activeDeals.slice(0, 2).map((deal: any) => (
                    <Card key={deal.id} className="border-2 group hover:border-primary transition-all">
                       <CardHeader className="p-6">
                          <div className="flex justify-between items-start">
                             <div className="space-y-1">
                                <Badge className="bg-primary/10 text-primary text-[10px] font-black uppercase">Instalación Solar</Badge>
                                <CardTitle className="text-xl group-hover:text-primary transition-colors">{deal.properties.dealname}</CardTitle>
                             </div>
                             <Link href={`/protected/projects/${deal.id}`}>
                                <Button size="sm" variant="ghost" className="rounded-full h-8 w-8 p-0">
                                   <ChevronRight className="h-6 w-6" />
                                </Button>
                             </Link>
                          </div>
                       </CardHeader>
                    </Card>
                  ))
                ) : (
                  <p className="text-muted-foreground p-8 text-center border-2 border-dashed rounded-xl italic">No hay proyectos activos todavía.</p>
                )}
            </div>
         </div>

         {/* Recent Tickets */}
         <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
                <h2 className="text-xl font-black uppercase tracking-tight">Última Actividad</h2>
                <Link href="/protected/tickets" className="text-sm font-bold text-primary hover:underline">Ver todos</Link>
            </div>
            <div className="space-y-4">
                {recentTickets.length > 0 ? (
                  recentTickets.map((ticket: any) => (
                    <Link key={ticket.id} href={`/protected/tickets/${ticket.id}`} className="block">
                       <Card className="border-2 hover:bg-muted/30 transition-all">
                          <CardContent className="p-4 flex items-center justify-between">
                             <div className="flex items-center gap-4">
                                <div className="h-10 w-10 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                                   <MessageSquare className="h-5 w-5 text-zinc-400" />
                                </div>
                                <div>
                                   <p className="text-sm font-bold">{ticket.properties.subject}</p>
                                   <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(ticket.properties.createdate), { addSuffix: true, locale: es })}</p>
                                </div>
                             </div>
                             <Badge variant="outline" className="text-[10px] uppercase font-black">{ticket.properties.hs_pipeline_stage}</Badge>
                          </CardContent>
                       </Card>
                    </Link>
                  ))
                ) : (
                  <p className="text-muted-foreground p-8 text-center border-2 border-dashed rounded-xl italic">No hay tickets recientes.</p>
                )}
            </div>
         </div>
      </div>
    </div>
  );
}
