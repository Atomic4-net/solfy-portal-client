export type TicketStatusGroup = "proceso" | "gestion" | "cerrado";

export interface TicketStatus {
  label: string;
  group: TicketStatusGroup;
  variant: "default" | "secondary" | "outline" | "destructive" | "success";
}

export const TICKET_STATUS_MAP: Record<string, TicketStatus> = {
  // --- EN PROCESO ---
  "145196488": { label: "Apertura de ticket", group: "proceso", variant: "default" },
  "526496209": { label: "Apertura de Ticket", group: "proceso", variant: "default" },
  "59784175": { label: "Nuevo expediente", group: "proceso", variant: "default" },
  
  // --- EN GESTIÓN ---
  "145196489": { label: "Elevada a la instaladora", group: "gestion", variant: "secondary" },
  "145196490": { label: "En verificación por Solfy", group: "gestion", variant: "secondary" },
  "145196491": { label: "Pendiente de confirmación", group: "gestion", variant: "secondary" },
  "4805863630": { label: "Agendado para visita", group: "gestion", variant: "secondary" },
  "4805863631": { label: "Elevado a BO", group: "gestion", variant: "secondary" },
  "4806738116": { label: "Pendiente de material", group: "gestion", variant: "secondary" },
  "4839585989": { label: "Sin cobertura propia", group: "gestion", variant: "secondary" },
  "4840816828": { label: "Reclamación", group: "gestion", variant: "secondary" },
  "5004294350": { label: "En seguros", group: "gestion", variant: "secondary" },
  "526496210": { label: "Elevado al área comercial", group: "gestion", variant: "secondary" },
  "526496211": { label: "Elevado a O.T", group: "gestion", variant: "secondary" },
  "538983155": { label: "Elevado a A.T.C", group: "gestion", variant: "secondary" },
  "574603757": { label: "Reclamación", group: "gestion", variant: "secondary" },
  "3": { label: "Agendar replanteo", group: "gestion", variant: "secondary" },
  "59784176": { label: "Upload to Marketplace", group: "gestion", variant: "secondary" },
  "59784177": { label: "Selección instalador", group: "gestion", variant: "secondary" },
  "49853917": { label: "Acuerdo de colaboración", group: "gestion", variant: "secondary" },
  "49853921": { label: "Agendar obra", group: "gestion", variant: "secondary" },
  "49885430": { label: "MT", group: "gestion", variant: "secondary" },
  "49853918": { label: "Firma digital", group: "gestion", variant: "secondary" },
  "49853920": { label: "Permiso Obras", group: "gestion", variant: "secondary" },
  "49853922": { label: "Inicio obra", group: "gestion", variant: "secondary" },
  "49853924": { label: "C.I.E.", group: "gestion", variant: "secondary" },
  "49853923": { label: "Solicitud CAU", group: "gestion", variant: "secondary" },
  "49853925": { label: "Declaración Responsable", group: "gestion", variant: "secondary" },
  "49853926": { label: "RITSIC", group: "gestion", variant: "secondary" },
  "49853927": { label: "RAC", group: "gestion", variant: "secondary" },

  // --- CERRADO ---
  "145196535": { label: "Cerrado favorable", group: "cerrado", variant: "success" },
  "145196536": { label: "Cerrado no conforme", group: "cerrado", variant: "outline" },
  "621478868": { label: "Cerrado favorable", group: "cerrado", variant: "success" },
  "3685697735": { label: "Cerrado favorable / RMA", group: "cerrado", variant: "success" },
  "526496212": { label: "Suspendido", group: "cerrado", variant: "outline" },
  "526223047": { label: "Cerrado favorable", group: "cerrado", variant: "success" },
  "1394222278": { label: "Cerrado / Sin novedad", group: "cerrado", variant: "outline" },
  "49853929": { label: "Fin de obra", group: "cerrado", variant: "success" },
};

export function getTicketStatus(stageId: string): TicketStatus {
  return TICKET_STATUS_MAP[stageId] || { 
    label: "En revisión", 
    group: "proceso", 
    variant: "default" 
  };
}

export function isTicketOpen(stageId: string): boolean {
  const status = getTicketStatus(stageId);
  return status.group !== "cerrado";
}
