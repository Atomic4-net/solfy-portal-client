"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function SyncRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Refresh the page data every 1.5 seconds until sync is complete
    const timer = setTimeout(() => {
      router.refresh();
    }, 1500);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center h-screen space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      <h2 className="text-xl font-bold">Sincronizando ticket...</h2>
      <p className="text-muted-foreground text-center max-w-xs px-4">
        Estamos vinculando tu ticket con Solfy. <br/> 
        Esto suele tardar unos segundos.
      </p>
    </div>
  );
}
