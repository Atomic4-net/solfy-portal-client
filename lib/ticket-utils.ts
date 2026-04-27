export type TicketStatusGroup = "proceso" | "gestion" | "cerrado";

export interface TicketStatus {
  label: string;
  group: TicketStatusGroup;
  variant: "default" | "secondary" | "outline" | "destructive" | "success";
}

export const TICKET_STATUS_MAP: Record<string, TicketStatus> = {
  // --- EN PROCESO ---
  "145196488": { label: "Apertura de ticket", group: "proceso", variant: "default" },
  
  // --- EN GESTIÓN ---
  "145196489": { label: "Elevada a la instaladora", group: "gestion", variant: "secondary" },
  "145196490": { label: "En verificación Solfy", group: "gestion", variant: "secondary" },
  "145196491": { label: "Pendiente de confirmación por parte del cliente", group: "gestion", variant: "secondary" },
  "4805863630": { label: "Agendado para visita", group: "gestion", variant: "secondary" },
  "4805863631": { label: "Elevado a BO", group: "gestion", variant: "secondary" },
  "4806738116": { label: "Pendiente de material", group: "gestion", variant: "secondary" },
  "4839585989": { label: "Sin cobertura ppia", group: "gestion", variant: "secondary" },
  "4840816828": { label: "Reclamo", group: "gestion", variant: "secondary" },
  "5004294350": { label: "En seguros", group: "gestion", variant: "secondary" },
  
  // --- CERRADO ---
  "145196535": { label: "Cerrado favorable", group: "cerrado", variant: "success" },
  "145196536": { label: "Cerrado no conforme", group: "cerrado", variant: "outline" },
  "621478868": { label: "Cerrado/ant/sin novedad", group: "cerrado", variant: "outline" },
  "3685697735": { label: "Cerrado favorable / RMA", group: "cerrado", variant: "success" },
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
