"use client";
import { FallbackStateCard } from "@/components/ui/talky";
export default function Error({ reset }: { reset: () => void }) {
  return (
    <main className="page-container">
      <FallbackStateCard
        text="No podemos cargar TalkyTown. Comprueba el servidor y vuelve a intentarlo."
        retry={reset}
      />
    </main>
  );
}
