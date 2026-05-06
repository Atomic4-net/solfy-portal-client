import { getContactByEmail } from "@/lib/hubspot";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type UserProfile = {
  id: string;
  full_name: string | null;
  hubspot_contact_id: string | null;
};

export async function ensureUserProfile(user: User): Promise<UserProfile | null> {
  const supabase = await createClient();

  const { data: existingProfile } = await supabase
    .from("user_profiles")
    .select("id, full_name, hubspot_contact_id")
    .eq("id", user.id)
    .maybeSingle<UserProfile>();

  if (existingProfile?.hubspot_contact_id) {
    return existingProfile;
  }

  const email = user.email;
  if (!email) {
    return existingProfile ?? null;
  }

  try {
    const contact = await getContactByEmail(email);
    if (!contact?.id) {
      return existingProfile ?? null;
    }

    const metadata = (user.user_metadata ?? {}) as {
      full_name?: string;
      hubspot_contact_id?: string;
    };

    const fullNameFromHubspot =
      `${contact.properties?.firstname || ""} ${contact.properties?.lastname || ""}`.trim();
    const fullName = metadata.full_name || fullNameFromHubspot || email;

    const { data: upsertedProfile } = await supabase
      .from("user_profiles")
      .upsert(
        {
          id: user.id,
          hubspot_contact_id: contact.id,
          full_name: fullName,
        },
        { onConflict: "id" },
      )
      .select("id, full_name, hubspot_contact_id")
      .single<UserProfile>();

    return upsertedProfile;
  } catch (error) {
    console.error("ensureUserProfile error:", error);
    return existingProfile ?? null;
  }
}

