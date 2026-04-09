"use server";

import { getContactByEmail, getContactDeals, WON_STAGES } from "@/lib/hubspot";
import { createClient } from "@/lib/supabase/server";

export async function signUpAction(formData: FormData) {
  const email = formData.get("email") as string;
  
  console.log(`DEBUG: Starting signUpAction for email: ${email}`);
  console.log(`DEBUG: Supabase URL configured: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
  
  const supabase = await createClient();

  // 1. Check HubSpot Contact
  try {
    const contact = await getContactByEmail(email);
    if (!contact) {
      console.log(`DEBUG: Contact NOT found in HubSpot for email: ${email}`);
      return { error: "Este correo no está asociado a ningún cliente de Solfy. Por favor, contacta con nosotros." };
    }
    console.log(`DEBUG: Contact found in HubSpot: ID ${contact.id}`);

    // 2. Check associated deals status (Won stages)
    const deals = await getContactDeals(contact.id);
    console.log(`DEBUG: Found ${deals.length} deals associated with contact ${contact.id}`);
    
    const hasWonDeal = deals.some((deal: any) => {
      const stage = deal.properties?.dealstage;
      const isWon = stage && WON_STAGES.includes(stage);
      if (isWon) console.log(`DEBUG: Valid 'Won' deal found! Deal ID: ${deal.id}, Stage: ${stage}`);
      return isWon;
    });

    if (!hasWonDeal) {
      console.log(`DEBUG: No 'Won' deals found for contact ${contact.id}. Stages checked:`, deals.map((d: any) => d.properties?.dealstage));
      return { 
        error: "Para registrarte, tu proyecto debe estar en estado 'Ganado - Finalizado'. Por favor, contacta con tu asesor." 
      };
    }

    // 3. Send Magic Link
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const redirectTo = `${siteUrl.replace(/\/$/, "")}/auth/confirm?next=/protected/tickets`;
    
    console.log(`DEBUG: Triggering Supabase signInWithOtp for ${email}. Redirecting to: ${redirectTo}`);
    
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: redirectTo,
        data: {
          hubspot_contact_id: contact.id,
          full_name: `${contact.properties.firstname || ''} ${contact.properties.lastname || ''}`.trim()
        }
      },
    });

    if (error) {
       console.error(`DEBUG: Supabase Auth error:`, error);
      return { error: error.message };
    }

    console.log(`DEBUG: Magic Link sent successfully to: ${email}`);
    return { success: true };
  } catch (error) {
    console.error("DEBUG: General error in signUpAction:", error);
    return { error: "Ha ocurrido un error inesperado." };
  }
}
