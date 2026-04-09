"use server";

import { createTicket as hubspotCreateTicket } from "@/lib/hubspot";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createTicketAction(formData: FormData) {
  const subject = formData.get("subject") as string;
  const content = formData.get("content") as string;
  const dealId = formData.get("dealId") as string | undefined;
  
  const supabase = await createClient();

  // 1. Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Usuario no autenticado" };
  }

  // 2. Get HubSpot Contact ID from profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('hubspot_contact_id')
    .eq('id', user.id)
    .single();

  if (!profile?.hubspot_contact_id) {
    return { error: "Contacto de HubSpot no encontrado" };
  }

  try {
    // 3. Create ticket in Supabase first to get our portal_id
    const { data: dbTicket, error: dbError } = await supabase
      .from('tickets')
      .insert({
        user_id: user.id,
      })
      .select('portal_id')
      .single();

    if (dbError) throw dbError;

    // 4. Create ticket in HubSpot
    const hsTicket = await hubspotCreateTicket(profile.hubspot_contact_id, {
      subject,
      content,
      portalId: dbTicket.portal_id,
      dealId: dealId || undefined
    });

    // 5. Update Supabase with HubSpot ID and wait for confirmation
    const { error: updateError } = await supabase
      .from('tickets')
      .update({ hubspot_id: hsTicket.id })
      .eq('portal_id', dbTicket.portal_id);

    if (updateError) throw updateError;

    revalidatePath(`/protected/tickets`);
    return { success: true, portalId: dbTicket.portal_id, hubspotId: hsTicket.id };
  } catch (error) {
    console.error("Create ticket error:", error);
    return { error: "No se ha podido crear el ticket. Por favor, inténtalo de nuevo." };
  }
}
