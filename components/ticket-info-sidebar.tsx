"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Tag, Briefcase, Info, Activity } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { getTicketStatus, PIPELINE_INCIDENCIAS, PIPELINE_TRAMITES } from "@/lib/ticket-utils";

interface TicketInfoSidebarProps {
  ticket: {
    subject: string;
    priority: string;
    category: string;
    pipeline: string;
    status: string;
    createdate: string;
  };
  project?: {
    name: string;
    id: string;
  };
}

export function TicketInfoSidebar({ ticket, project }: TicketInfoSidebarProps) {
  const statusInfo = getTicketStatus(ticket.status, ticket.pipeline);
  const incidenciasStages = new Set([
    "145196488",
    "145196489",
    "145196490",
    "145196491",
    "4805863630",
    "4805863631",
    "4806738116",
    "4839585989",
    "4840816828",
    "5004294350",
    "145196535",
    "145196536",
    "621478868",
  ]);
  const requestType =
    ticket.pipeline === PIPELINE_INCIDENCIAS
      ? "Incidencia"
      : ticket.pipeline === PIPELINE_TRAMITES
        ? "Documentación"
        : incidenciasStages.has(ticket.status)
          ? "Incidencia"
          : "Documentación";

  return (
    <div className="space-y-6 flex flex-col h-full overflow-y-auto pr-1 pb-8 custom-scrollbar">
      {/* Ticket Main Info */}
      <Card className="border-0 shadow-none bg-transparent">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground/80">
            Detalles del ticket
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 space-y-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
               <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Tag className="h-3 w-3" /> Tipo de solicitud
               </span>
               <p className="text-sm font-bold text-foreground/90 pl-1">{requestType}</p>
            </div>

            <div className="space-y-1.5">
               <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Activity className="h-3 w-3" /> Estado Actual
               </span>
               <Badge 
                  variant={statusInfo.variant} 
                  className="uppercase font-black text-[10px] px-3 py-1 border-2 border-transparent shadow-none rounded-full"
               >
                  {statusInfo.label}
               </Badge>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-muted/50 mt-4">
               <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-3 w-3" /> Fecha de apertura
               </span>
               <p className="text-sm font-bold text-foreground/90 pl-1">
                  {format(new Date(ticket.createdate), "dd 'de' MMMM, yyyy", { locale: es })}
               </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Associated Project Section */}
      {project && (
        <Card className="border-2 border-primary/10 shadow-none bg-primary/5 rounded-2xl overflow-hidden">
          <CardHeader className="pb-2 bg-primary/5">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary/80 flex items-center gap-2">
              <Briefcase className="h-3 w-3" /> Proyecto Vinculado
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <h4 className="text-sm font-black leading-tight group-hover:text-primary transition-colors">
              {project.name}
            </h4>
          </CardContent>
        </Card>
      )}

      {/* Help Note */}
      <div className="pt-6 border-t border-muted/50 mt-auto">
         <div className="bg-muted/10 rounded-2xl p-4 border-2 border-muted/20 flex flex-col gap-3">
            <div className="flex items-center gap-2">
               <Info className="h-4 w-4 text-primary" />
               <h5 className="text-[11px] font-black uppercase">¿Necesitas algo más?</h5>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
               Nuestro equipo está revisando tu solicitud. Si el problema es crítico, puedes contactar con tu asesor.
            </p>
         </div>
      </div>
    </div>
  );
}
