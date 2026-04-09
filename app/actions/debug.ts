"use server";

import { createClient } from "@/lib/supabase/server";

export async function testSupabaseConnection() {
  const supabase = await createClient();
  
  console.log("DEBUG: Testing basic Supabase connection...");
  console.log(`DEBUG: Target URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);

  try {
    // Try to reach the health endpoint via the client
    // auth.getSession() is a good lightweight check
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("DEBUG: Supabase Connection Error ->", error);
      return { success: false, error: error.message, status: (error as any).status };
    }

    return { success: true, message: "Conexión a Supabase establecida (Gateway responde)." };
  } catch (err: any) {
    console.error("DEBUG: Fatal Supabase Connection Error ->", err);
    return { success: false, error: err.message, status: err.status || 500 };
  }
}

export async function testSignUpSimple(email: string) {
  const supabase = await createClient();
  
  console.log(`DEBUG: Testing simple Sign Up for ${email}`);

  try {
    // Basic password signup to test the Auth service (GoTrue)
    const { data, error } = await supabase.auth.signUp({
      email,
      password: "TestPassword123!",
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm`,
      }
    });

    if (error) {
      console.error("DEBUG: Sign Up Error ->", error);
      return { success: false, error: error.message, status: (error as any).status };
    }

    return { 
      success: true, 
      message: "Registro intentado con éxito. Revisa el log de Supabase para ver si se ha enviado el correo. Pero el servidor ha respondido!" 
    };
  } catch (err: any) {
    console.error("DEBUG: Fatal Sign Up Error ->", err);
    return { success: false, error: err.message, status: err.status || 500 };
  }
}
