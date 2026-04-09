import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

console.log("Edge Function 'send-email-hook' started")

serve(async (req) => {
  // 1. Get Environment Variables
  const AZURE_AD_TENANT_ID = Deno.env.get('AZURE_AD_TENANT_ID')
  const AZURE_AD_CLIENT_ID = Deno.env.get('AZURE_AD_CLIENT_ID')
  const AZURE_AD_CLIENT_SECRET = Deno.env.get('AZURE_AD_CLIENT_SECRET')
  const AZURE_AD_SENDER_EMAIL = Deno.env.get('AZURE_AD_SENDER_EMAIL')
  const SEND_EMAIL_HOOK_SECRET = Deno.env.get('SEND_EMAIL_HOOK_SECRET')
  const SITE_URL = Deno.env.get('SITE_URL') // Primary domain for replacement

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  // 2. IMPORTANT: Verify environment variables exist
  if (!AZURE_AD_TENANT_ID || !AZURE_AD_CLIENT_ID || !AZURE_AD_CLIENT_SECRET || !AZURE_AD_SENDER_EMAIL) {
    console.error("DEBUG ERROR: Missing Azure AD configuration! Check your Supabase secrets.")
    return new Response(JSON.stringify({ error: 'Configuration missing' }), { status: 500 })
  }

  // 3. Verify the Hook Secret
  const signature = req.headers.get('x-supabase-signature')
  if (SEND_EMAIL_HOOK_SECRET && (signature !== SEND_EMAIL_HOOK_SECRET)) {
     console.error("DEBUG ERROR: Invalid or missing x-supabase-signature!")
     return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  try {
    const payload = await req.json()
    console.log("DEBUG: FULL PAYLOAD ->", JSON.stringify(payload, null, 2))

    const user = payload.user
    const email_data = payload.email_data || {}
    const email_action_type = payload.email_action_type || email_data.email_action_type || 'magiclink'
    const recipientEmail = user.email
    const hash = email_data.token_hash
    
    // FORCED URL REPAIR LOGIC
    // We want to ensure it ends at /auth/confirm even if Supabase tries to send us to the home
    let redirectTo = email_data.redirect_to || ""
    const cleanSiteUrl = (SITE_URL || "http://localhost:3000").replace(/\/$/, "")

    // Case 1: If it points to localhost, swap it
    if (redirectTo.includes("localhost:3000")) {
      redirectTo = redirectTo.replace(/https?:\/\/localhost:3000/, cleanSiteUrl)
    }

    // Case 2: If it points to the root of the site without /auth/confirm, we force it
    // Example: https://dominio.com/?token... -> https://dominio.com/auth/confirm/?token...
    const urlObj = new URL(redirectTo)
    if (urlObj.pathname === "/" || urlObj.pathname === "") {
        console.log("DEBUG: Forcing /auth/confirm path because it was missing in redirect_to")
        urlObj.pathname = "/auth/confirm"
        redirectTo = urlObj.toString().replace(/\/$/, "") // Remove trailing slash for consistency
    }
    
    const separator = redirectTo.includes('?') ? '&' : '?'
    const link = `${redirectTo}${separator}token_hash=${hash}&type=${email_action_type === 'magiclink' ? 'magiclink' : email_action_type}`

    console.log(`DEBUG: Final fixed link -> ${link}`)

    // 4. Prepare Email Content
    let subject = "Tu enlace de acceso a Solfy"
    if (email_action_type === 'recovery') subject = "Restablece tu contraseña en Solfy"

    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px; background-color: #fff;">
        <h2 style="color: #000; font-weight: 900; font-size: 24px; margin-bottom: 24px;">Solfy</h2>
        <p style="font-size: 16px; color: #333; line-height: 1.5;">Hola,</p>
        <p style="font-size: 16px; color: #333; line-height: 1.5;">Haz clic en el botón de abajo para acceder de forma segura a tu cuenta.</p>
        <div style="margin: 32px 0;">
          <a href="${link}" style="background-color: #000; color: #fff; padding: 14px 28px; border-radius: 99px; text-decoration: none; font-weight: bold; display: inline-block;">Iniciar sesión ahora</a>
        </div>
        <p style="color: #999; font-size: 12px; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
          Este es un enlace de un solo uso. Si no has solicitado este correo, puedes ignorarlo con seguridad.
        </p>
      </div>
    `

    // 5. Get Microsoft Graph Access Token
    const tokenResponse = await fetch(`https://login.microsoftonline.com/${AZURE_AD_TENANT_ID}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: AZURE_AD_CLIENT_ID!,
        client_secret: AZURE_AD_CLIENT_SECRET!,
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials',
      }),
    })

    const tokenData = await tokenResponse.json()
    if (!tokenResponse.ok) throw new Error(`MS Graph Token Error: ${JSON.stringify(tokenData)}`)

    const accessToken = tokenData.access_token

    // 6. Send Email
    const sendMailResponse = await fetch(`https://graph.microsoft.com/v1.0/users/${AZURE_AD_SENDER_EMAIL}/sendMail`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          subject: subject,
          body: { contentType: 'HTML', content: htmlContent },
          toRecipients: [{ emailAddress: { address: recipientEmail } }],
        },
        saveToSentItems: 'true',
      }),
    })

    if (!sendMailResponse.ok) {
      const errorText = await sendMailResponse.text()
      throw new Error(`MS Graph SendMail Error: ${errorText}`)
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error("DEBUG Hook Error ->", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
