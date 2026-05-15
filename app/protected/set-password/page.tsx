import { SetPasswordForm } from "@/components/set-password-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";

export default function SetPasswordPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-gradient-to-b from-primary/10 via-background to-background p-6 md:p-10">
      <Card className="w-full max-w-sm border-2 border-primary/15 shadow-2xl shadow-primary/10">
        <CardHeader>
          <Link href="/" className="mb-2 flex items-center justify-center">
            <img src="/logo-solfy.svg" alt="Solfy" className="h-12 w-auto object-contain" />
          </Link>
          <CardTitle className="text-2xl font-bold">Crea tu contraseña</CardTitle>
          <CardDescription>
            Para terminar tu registro, por favor elige una contraseña para tu cuenta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SetPasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
