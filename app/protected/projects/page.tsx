import { getContactDeals, WON_STAGES } from "@/lib/hubspot";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, ChevronRight, FileText } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function ProjectsPage() {
  const supabase = await createClient();
  
  // 1. Get user and their HubSpot ID
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('hubspot_contact_id')
    .eq('id', user.id)
    .single();

  if (!profile?.hubspot_contact_id) {
     // If no profile yet, we might need to fetch it or redirect
     return <div className="p-8">No se ha encontrado perfil de HubSpot. Contacta con soporte.</div>;
  }

  // 2. Fetch Deals from HubSpot
  const deals = await getContactDeals(profile.hubspot_contact_id);
  const activeDeals = deals.filter((deal: any) => WON_STAGES.includes(deal.properties.dealstage));

  return (
    <div className="flex-1 w-full flex flex-col gap-8 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mis Proyectos</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona tus instalaciones y servicios contratados con Solfy.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {activeDeals.length > 0 ? (
          activeDeals.map((deal: any) => (
            <Card key={deal.id} className="hover:border-primary transition-all group overflow-hidden border-2">
              <CardHeader className="pb-4 bg-muted/30">
                <div className="flex justify-between items-start">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <CardTitle className="mt-4 text-xl group-hover:text-primary transition-colors">
                  {deal.properties.dealname}
                </CardTitle>
                <CardDescription>
                   {deal.properties.amount ? `${Number(deal.properties.amount).toLocaleString('es')} €` : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4">
                  <Link href={`/protected/projects/${deal.id}`} className="w-full">
                    <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-white transition-all border-2">
                      Ver Tickets del Proyecto
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-12 text-center border-2 border-dashed rounded-xl">
             <FileText className="mx-auto h-12 w-12 text-muted-foreground opacity-20" />
             <h3 className="mt-4 text-lg font-semibold">No tienes proyectos activos</h3>
             <p className="text-muted-foreground">Si acabas de firmar tu contrato, puede tardar unos minutos en aparecer aquí.</p>
          </div>
        )}
      </div>
    </div>
  );
}
