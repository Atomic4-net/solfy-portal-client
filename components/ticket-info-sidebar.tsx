"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Tag, AlertCircle, Briefcase, Info, Clock, Activity } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { getTicketStatus } from "@/lib/ticket-utils";

interface TicketInfoSidebarProps {
  ticket: {
    subject: string;
    priority: string;
    category: string;
    status: string;
    createdate: string;
  };
  project?: {
    name: string;
    id: string;
  };
}

export function TicketInfoSidebar({ ticket, project }: TicketInfoSidebarProps) {
  const isHighPriority = ticket.priority === "HIGH" || ticket.priority === "ALTA";
  const statusInfo = getTicketStatus(ticket.status);

  return (
    <div className="space-y-6 flex flex-col h-full overflow-y-auto pr-1 pb-8 custom-scrollbar">
      {/* Ticket Main Info */}
      <Card className="border-0 shadow-none bg-transparent">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground/80">
            Detalles de la Solicitud
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 space-y-6">
          <div className="space-y-4">
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

            <div className="space-y-1.5">
               <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <AlertCircle className="h-3 w-3" /> Prioridad
               </span>
               <Badge 
                  variant={isHighPriority ? "destructive" : "secondary"} 
                  className="uppercase font-black text-[10px] px-3 py-1 border-0 shadow-none"
               >
                  {ticket.priority || "Normal"}
               </Badge>
            </div>

            <div className="space-y-1.5">
               <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Tag className="h-3 w-3" /> Categoría
               </span>
               <p className="text-sm font-bold text-foreground/90 pl-1">
                  {ticket.category || "Consulta General"}
               </p>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-muted/50 mt-4">
               <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-3 w-3" /> Fecha de apertura
               </span>
               <p className="text-sm font-bold text-foreground/90 pl-1">
                  {format(new Date(ticket.createdate), "dd 'de' MMMM, yyyy", { locale: es })}
               </p>
            </div>

            <div className="space-y-1.5">
               <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Clock className="h-3 w-3" /> Última actualización
               </span>
               <p className="text-xs font-medium text-muted-foreground pl-1">
                  Hoy a las {format(new Date(), "HH:mm")}
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
            <p className="text-[9px] font-mono text-primary/40 mt-1 uppercase">ID: {project.id}</p>
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
