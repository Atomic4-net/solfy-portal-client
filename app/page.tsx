import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";
import { Suspense } from "react";

export default async function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-5 items-center font-semibold text-xl tracking-tight">
              <Link href={"/"}>Solfy <span className="text-primary">Portal</span></Link>
            </div>
            <div className="flex gap-4 items-center">
              {hasEnvVars && (
                <Suspense>
                  <AuthButton />
                </Suspense>
              )}
              <ThemeSwitcher />
            </div>
          </div>
        </nav>

        <div className="flex-1 flex flex-col gap-20 max-w-5xl p-5 items-center justify-center text-center">
          <div className="flex flex-col gap-6 items-center">
            <h1 className="text-4xl lg:text-6xl font-bold max-w-3xl leading-tight">
              Bienvenido al Portal de Cliente de Solfy
            </h1>
            <p className="text-xl text-muted-foreground max-w-xl">
              Gestiona tus tickets de asistencia de forma fácil y rápida.
            </p>
            <div className="flex gap-4 mt-4">
              <Link
                href="/protected"
                className="bg-primary text-primary-foreground px-8 py-3 rounded-md font-medium hover:opacity-90 transition-opacity"
              >
                Inicia sesión
              </Link>
            </div>
          </div>
        </div>

        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16">
          <p>
            &copy; {new Date().getFullYear()} Solfy. Todos los derechos reservados.
          </p>
        </footer>
      </div>
    </main>
  );
}
