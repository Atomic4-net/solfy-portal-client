import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/protected/set-password";

  const redirectTo = request.nextUrl.clone();
  redirectTo.pathname = next;
  redirectTo.searchParams.delete("token_hash");
  redirectTo.searchParams.delete("type");
  redirectTo.searchParams.delete("code");

  const supabase = await createClient();

  // Handle PKCE flow (Standard for new Supabase projects)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(redirectTo);
    } else {
      console.error("Auth Confirm Code Error:", error);
      return NextResponse.redirect(`${request.nextUrl.origin}/auth/error?error=${encodeURIComponent(error.message)}`);
    }
  }

  // Handle OTP flow (Legacy or specific configurations)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!error) {
      return NextResponse.redirect(redirectTo);
    } else {
      console.error("Auth Confirm OTP Error:", error);
      return NextResponse.redirect(`${request.nextUrl.origin}/auth/error?error=${encodeURIComponent(error.message)}`);
    }
  }

  // Fallback error
  return NextResponse.redirect(`${request.nextUrl.origin}/auth/error?error=No valid token or code found`);
}
