"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Wrench, FileSearch, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export function ServiceSelection() {
  const searchParams = useSearchParams();
  const dealId = searchParams.get("dealId");

  const buildUrl = (category: string) => {
    const params = new URLSearchParams();
    params.set("category", category);
    if (dealId) params.set("dealId", dealId);
    return `?${params.toString()}`;
  };

  const services = [
    {
      id: "asistencia",
      eyebrow: "Informar de una incidencia",
      title: "Apertura de incidencia",
      description: "Reporta una incidencia o problema técnico en tu instalación.",
      icon: Wrench,
      color: "bg-primary/10 text-primary",
      hoverColor: "hover:border-primary",
    },
    {
      id: "documentacion",
      eyebrow: "Solicitud de documentación",
      title: "Solicitud de documentación",
      description:
        "Para la petición de tramitaciones y consultas sobre:\nPermisos de obra\nLegalizaciones de industria\nSolicitudes de IBI y/o ayudas",
      icon: FileSearch,
      color: "bg-blue-500/10 text-blue-600",
      hoverColor: "hover:border-blue-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
      {services.map((service) => (
        <Link key={service.id} href={buildUrl(service.id)} className="block group">
          <Card className={`h-full border-2 transition-all duration-300 rounded-[2rem] overflow-hidden ${service.hoverColor} group-hover:shadow-xl group-hover:shadow-primary/5 group-active:scale-[0.98]`}>
            <CardContent className="p-10 flex flex-col h-full">
              <div className={`h-16 w-16 ${service.color} rounded-2xl flex items-center justify-center mb-8 transition-transform group-hover:scale-110 duration-500`}>
                <service.icon className="h-8 w-8" />
              </div>
              
              <div className="flex-1">
                <p className="text-primary font-bold mb-2">
                  {service.eyebrow}
                </p>
                <h3 className="text-2xl font-black tracking-tighter mb-4 font-jakarta">
                  {service.title}
                </h3>
                <p className="text-muted-foreground font-medium leading-relaxed whitespace-pre-line">
                  {service.description}
                </p>
              </div>

              <div className="mt-10 flex items-center gap-2 text-xs font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0 duration-300">
                Seleccionar <ArrowRight className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
