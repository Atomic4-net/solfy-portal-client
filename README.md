# Solfy Client Portal (Premium Ticket Management)

Este proyecto es un portal de gestión de tickets premium orientado a SaaS, integrado con **HubSpot CRM** para la gestión de incidencias y **Supabase** para la autenticación y base de datos.

## 🚀 Arquitectura Técnica

- **Framework**: [Next.js 14+](https://nextjs.org/) (App Router)
- **UI & Styling**: [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) (Tema Dark/Light semántico)
- **Autenticación**: [Supabase Auth](https://supabase.com/auth)
- **CRM**: [HubSpot API](https://developers.hubspot.com/) (Tickets, Emails, Notes, Communications)
- **Infraestructura de Email**: [Microsoft Graph API](https://learn.microsoft.com/en-us/graph/api/overview) vía Supabase Edge Functions.

## 📁 Estructura del Proyecto

```text
├── app/
│   ├── (auth)/             # Rutas de Login y Recuperación
│   ├── protected/          # Área privada del cliente
│   │   ├── tickets/        # Listado y Dashboard de tickets
│   │   │   └── [id]/       # Detalle del ticket y Chat en tiempo real
│   └── api/                # Endpoints internos
├── components/
│   ├── ticket-chat.tsx     # Componente de chat dinámico con lógica de remitentes
│   ├── ticket-list.tsx     # Listado de tickets con filtros semánticos
│   └── theme-provider.tsx  # Gestión de modo oscuro nativo
├── lib/
│   ├── hubspot.ts          # Integración core con HubSpot y mapeo de tickets
│   └── supabase/           # Configuración del cliente de Supabase
└── supabase/
    └── functions/          # Edge Functions (Deno)
        └── send-email-hook # Connector con Microsoft Graph API
```

## 🛠 Integraciones Clave

### 1. Microsoft Graph API (Auth Hook)
Hemos desactivado el SMTP estándar de Supabase para ganar fiabilidad. Cada Magic Link o Email de Notificación se envía a través de una Edge Function que:
- Obtiene un token OAuth2 de Azure AD.
- Envía el mail usando el endpoint `/sendMail` de Microsoft.
- **Seguridad**: Valida las peticiones mediante el `x-supabase-signature`.

### 2. HubSpot Intelligent Mapping
El sistema diferencia automáticamente entre mensajes del cliente y respuestas del equipo:
- Filtra frases de autorepuesta como "Hemos recibido su ticket" para asignarlas al agente.
- Normaliza emails, notas y comunicaciones en un solo feed cronológico.

## ⚙️ Configuración (.env)

Necesitarás las siguientes variables para que el portal funcione:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# HubSpot
HUBSPOT_ACCESS_TOKEN=pat-eu1-...

# Microsoft Azure (Para la Edge Function)
AZURE_AD_TENANT_ID=...
AZURE_AD_CLIENT_ID=...
AZURE_AD_CLIENT_SECRET=...
AZURE_AD_SENDER_EMAIL=...
```

## 📦 Despliegue en Easypanel

El proyecto está optimizado para Nixpacks/Buildpacks:
1. Conecta el repositorio de GitHub.
2. Añade las variables de entorno en la configuración de la App.
3. Easypanel detectará automáticamente Next.js y ejecutará el build.

---

Desarrollado con ❤️ para Solfy.
