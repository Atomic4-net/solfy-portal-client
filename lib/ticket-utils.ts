export type TicketStatusGroup = "proceso" | "gestion" | "cerrado";

export interface TicketStatus {
  label: string;
  group: TicketStatusGroup;
  variant: "default" | "secondary" | "outline" | "destructive" | "success";
}

export const PIPELINE_INCIDENCIAS = "58861555";
export const PIPELINE_TRAMITES = "333821424";

const INCIDENCIAS_STAGE_GROUP: Record<string, TicketStatusGroup> = {
  "145196488": "proceso",
  "145196489": "gestion",
  "145196490": "gestion",
  "145196491": "gestion",
  "4805863630": "gestion",
  "4805863631": "gestion",
  "4806738116": "gestion",
  "4839585989": "gestion",
  "4840816828": "gestion",
  "5004294350": "gestion",
  "145196535": "cerrado",
  "145196536": "cerrado",
  "621478868": "cerrado",
};

const TRAMITES_STAGE_GROUP: Record<string, TicketStatusGroup> = {
  "526496209": "proceso",
  "526496211": "gestion",
  "574603757": "gestion",
  "526496212": "gestion",
  "526223047": "cerrado",
};

function groupToStatus(group: TicketStatusGroup): TicketStatus {
  if (group === "proceso") return { label: "En proceso", group, variant: "default" };
  if (group === "gestion") return { label: "En gestión", group, variant: "secondary" };
  return { label: "Cerrado", group, variant: "success" };
}

export function getTicketStatus(stageId: string, pipelineId?: string): TicketStatus {
  if (pipelineId === PIPELINE_INCIDENCIAS) {
    return groupToStatus(INCIDENCIAS_STAGE_GROUP[stageId] || "proceso");
  }

  if (pipelineId === PIPELINE_TRAMITES) {
    return groupToStatus(TRAMITES_STAGE_GROUP[stageId] || "proceso");
  }

  const fallbackGroup =
    INCIDENCIAS_STAGE_GROUP[stageId] || TRAMITES_STAGE_GROUP[stageId] || "proceso";
  return groupToStatus(fallbackGroup);
}

export function isTicketOpen(stageId: string, pipelineId?: string): boolean {
  const status = getTicketStatus(stageId, pipelineId);
  return status.group !== "cerrado";
}

export function getTicketDisplayLabel(properties: Record<string, string | undefined>) {
  const pipeline = properties.hs_pipeline;
  const tipologiaIncidencia = properties.tipologia_incidencia?.trim();
  const tipologia = properties.tipologia?.trim();
  const tipologiaTramites = properties.tipologia_tramites?.trim();
  const subject = properties.subject?.trim();

  if (pipeline === PIPELINE_INCIDENCIAS && tipologiaIncidencia && tipologia) {
    return `${tipologiaIncidencia} - ${tipologia}`;
  }

  if (pipeline === PIPELINE_TRAMITES && tipologiaTramites) {
    return tipologiaTramites;
  }

  return subject || "Sin detalle";
}
