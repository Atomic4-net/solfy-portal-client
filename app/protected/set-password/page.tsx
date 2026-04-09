import { SetPasswordForm } from "@/components/set-password-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function SetPasswordPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <Card className="w-full max-w-sm">
        <CardHeader>
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
