"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Filter, 
  Calendar, 
  AlertCircle, 
  HelpCircle, 
  Wrench, 
  MessageSquare,
  ChevronRight,
  Clock
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export function TicketList({ initialTickets }: { initialTickets: any[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const tickets = initialTickets || [];

  // Filter logic
  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch = ticket.properties.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ticket.properties.portal_ticket_id?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === "all") return matchesSearch;
    if (statusFilter === "open") return matchesSearch && ticket.properties.hs_pipeline_stage !== "Cerrado" && ticket.properties.hs_pipeline_stage !== "Resuelto";
    if (statusFilter === "closed") return matchesSearch && (ticket.properties.hs_pipeline_stage === "Cerrado" || ticket.properties.hs_pipeline_stage === "Resuelto");
    
    return matchesSearch;
  });

  const getPriorityStyle = (priority: string) => {
    switch (priority?.toUpperCase()) {
      case "HIGH":
      case "ALTA":
        return "text-destructive border-destructive/20 bg-destructive/10";
      case "MEDIUM":
      case "MEDIA":
        return "text-orange-500 border-orange-500/20 bg-orange-500/10";
      case "LOW":
      case "BAJA":
        return "text-emerald-500 border-emerald-500/20 bg-emerald-500/10";
      default:
        return "text-muted-foreground border-border bg-muted";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category?.toUpperCase()) {
      case "MAINTENANCE": return <Wrench className="h-3.5 w-3.5" />;
      case "QUESTION": return <HelpCircle className="h-3.5 w-3.5" />;
      default: return <MessageSquare className="h-3.5 w-3.5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Tabs Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-2 rounded-2xl border border-border">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por asunto o ID..." 
            className="pl-10 h-11 bg-transparent border-none focus-visible:ring-0 font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-auto">
          <TabsList className="bg-muted p-1 rounded-xl h-11 border border-border">
            <TabsTrigger value="all" className="rounded-lg px-6 font-black uppercase text-[10px] tracking-tight data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Todos</TabsTrigger>
            <TabsTrigger value="open" className="rounded-lg px-6 font-black uppercase text-[10px] tracking-tight data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Abiertos</TabsTrigger>
            <TabsTrigger value="closed" className="rounded-lg px-6 font-black uppercase text-[10px] tracking-tight data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Cerrados</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Table Container */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-transparent border-b">
              <TableHead className="w-[140px] font-black uppercase text-[10px] tracking-widest text-muted-foreground py-4 px-6">Ticket ID</TableHead>
              <TableHead className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Asunto</TableHead>
              <TableHead className="w-[120px] font-black uppercase text-[10px] tracking-widest text-muted-foreground">Prioridad</TableHead>
              <TableHead className="w-[150px] font-black uppercase text-[10px] tracking-widest text-muted-foreground">Categoría</TableHead>
              <TableHead className="w-[180px] font-black uppercase text-[10px] tracking-widest text-muted-foreground text-right px-6">Fecha de creación</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTickets.length > 0 ? (
              filteredTickets.map((ticket) => {
                const portalId = ticket.properties.portal_ticket_id ? `#SOL-${ticket.properties.portal_ticket_id}` : `#${ticket.id.slice(-5)}`;
                const priority = ticket.properties.hs_ticket_priority || "NORMAL";
                
                return (
                  <TableRow key={ticket.id} className="group hover:bg-muted/30 transition-colors cursor-pointer border-b last:border-0">
                    <TableCell className="px-6 py-5">
                      <Link href={`/protected/tickets/${ticket.id}`} className="block">
                        <span className="font-mono font-black text-xs text-primary bg-primary/10 px-2 py-1 rounded border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                          {portalId}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell>
                       <Link href={`/protected/tickets/${ticket.id}`} className="block">
                         <div className="flex flex-col">
                            <span className="font-black text-sm tracking-tight text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                {ticket.properties.subject || "Sin asunto"}
                            </span>
                            <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Clock className="h-2.5 w-2.5" />
                                Actualizado recientemente
                            </span>
                         </div>
                       </Link>
                    </TableCell>
                    <TableCell>
                       <Badge variant="outline" className={cn("rounded-full border font-black uppercase text-[9px] px-3 py-0.5", getPriorityStyle(priority))}>
                          {priority}
                       </Badge>
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-tight bg-muted/50 w-fit px-3 py-1 rounded-lg border border-border">
                           {getCategoryIcon(ticket.properties.hs_ticket_category)}
                           {ticket.properties.hs_ticket_category || "General"}
                        </div>
                    </TableCell>
                    <TableCell className="text-right px-6">
                       <span className="text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tighter">
                          {format(new Date(ticket.properties.createdate), "dd MMM yyyy '·' HH:mm", { locale: es })}
                       </span>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="py-24 text-center">
                  <div className="flex flex-col items-center gap-2 opacity-40">
                     <Search className="h-10 w-10 mb-2" />
                     <p className="text-sm font-black uppercase tracking-widest">No se han encontrado tickets</p>
                     <p className="text-xs font-medium">Prueba con otros criterios de búsqueda</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-2">
         <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Mostrando {filteredTickets.length} resultados</p>
         <div className="flex gap-4">
             <span className="text-[10px] font-bold text-muted-foreground hover:text-primary cursor-pointer transition-colors uppercase tracking-widest">Descargar CSV</span>
             <span className="text-[10px] font-bold text-muted-foreground hover:text-primary cursor-pointer transition-colors uppercase tracking-widest">Imprmir Lista</span>
         </div>
      </div>
    </div>
  );
}
