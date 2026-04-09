"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, MapPin, Tag, ChevronDown, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";

interface Interaction {
  id: string;
  subject: string;
  status: string;
  date: string;
  portal_id?: string;
}

interface TicketSidebarProps {
  contact: {
    firstname?: string;
    lastname?: string;
    email?: string;
    phone?: string;
    city?: string;
    type?: string;
  };
  interactions: Interaction[];
}

export function TicketSidebar({ contact, interactions }: TicketSidebarProps) {
  return (
    <div className="space-y-6 flex flex-col h-full overflow-y-auto pr-1 pb-8 custom-scrollbar">
      {/* Contact Profile Section */}
      <Card className="border-0 shadow-none bg-transparent">
        <CardHeader className="px-0 pt-0 flex flex-row items-center justify-between group">
          <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground/80">
            Perfil del Cliente
          </CardTitle>
          <ChevronDown className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </CardHeader>
        <CardContent className="px-0 space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 border-2 border-background shadow-md">
              <AvatarFallback className="bg-primary/10 text-primary font-black text-xl">
                {contact.firstname?.[0]}{contact.lastname?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-black text-lg leading-tight">{contact.firstname} {contact.lastname}</h3>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">{contact.email}</p>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-3 text-sm">
              <div className="p-2 rounded-full bg-muted/40 text-muted-foreground">
                <Mail className="h-4 w-4" />
              </div>
              <span className="font-bold text-foreground/90">{contact.email || "No disponible"}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="p-2 rounded-full bg-muted/40 text-muted-foreground">
                <Phone className="h-4 w-4" />
              </div>
              <span className="font-bold text-foreground/90">{contact.phone || "No comunicado"}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="p-2 rounded-full bg-muted/40 text-muted-foreground">
                <MapPin className="h-4 w-4" />
              </div>
              <span className="font-bold text-foreground/90">{contact.city || "Solfy España"}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Badge variant="secondary" className="bg-primary/10 text-primary border-0 font-black text-[10px] uppercase px-3 py-1">
              {contact.type || "Cliente Premium"}
            </Badge>
            <Badge variant="outline" className="text-[10px] uppercase font-black px-3 py-1 border-2">
              VIP
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Interaction History Section */}
      <Card className="border-0 shadow-none bg-transparent">
        <CardHeader className="px-0 flex flex-row items-center justify-between group">
          <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground/80">
            Historial de Interacciones
          </CardTitle>
          <ChevronDown className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </CardHeader>
        <CardContent className="px-0 pt-2">
          <div className="space-y-1 relative">
            {/* Timeline Line */}
            <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-muted/30" />
            
            {interactions.length > 0 ? (
              interactions.map((item, idx) => (
                <Link key={item.id} href={`/protected/tickets/${item.id}`} className="block group relative pl-9 py-4 transition-all hover:bg-muted/30 rounded-xl px-4 -ml-4">
                  {/* Status Indicator DOT */}
                  <div className="absolute left-[10px] top-[22px] z-10">
                    {item.status === 'resolved' || item.status === 'Cerrado' ? (
                      <div className="h-4 w-4 rounded-full bg-emerald-500 border-4 border-background flex items-center justify-center shadow-sm" />
                    ) : item.status === 'open' || item.status === 'Abierto' ? (
                      <div className="h-4 w-4 rounded-full bg-amber-500 border-4 border-background flex items-center justify-center shadow-sm animate-pulse" />
                    ) : (
                      <div className="h-4 w-4 rounded-full bg-muted-foreground/30 border-4 border-background flex items-center justify-center shadow-sm" />
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between items-start gap-2">
                       <h4 className="text-[13px] font-black leading-tight line-clamp-1 group-hover:text-primary transition-colors">
                          {item.subject}
                       </h4>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                       <Clock className="h-3 w-3" />
                       {formatDistanceToNow(new Date(item.date), { addSuffix: true, locale: es })}
                       <span className="opacity-40">•</span>
                       <span className={item.status === 'resolved' || item.status === 'Cerrado' ? "text-emerald-600" : "text-amber-600"}>
                          {item.status}
                       </span>
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground/40 mt-1 block">
                       {item.portal_id || `#${item.id}`}
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="py-8 text-center bg-muted/20 rounded-xl">
                 <p className="text-xs text-muted-foreground font-medium">No hay interacciones previas</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* User Notes Placeholder */}
      <div className="pt-4 border-t border-muted/50">
         <div className="bg-muted/20 rounded-xl p-4 border border-dashed border-muted-foreground/20 italic text-[11px] text-muted-foreground leading-relaxed">
            "Este cliente prefiere comunicación vía portal y tiene una instalación activa de 5kW."
         </div>
      </div>
    </div>
  );
}
