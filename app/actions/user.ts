"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function setPasswordAction(formData: FormData) {
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  
  if (password !== confirmPassword) {
    return { error: "Las contraseñas no coinciden." };
  }

  const supabase = await createClient();

  // Update the user's password
  // This works even if they haven't set one before because they are already authenticated via Magic Link.
  const { error } = await supabase.auth.updateUser({
    password: password
  });

  if (error) {
    console.error("Set password error:", error);
    return { error: error.message };
  }

  revalidatePath("/protected");
  return { success: true };
}
