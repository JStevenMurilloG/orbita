import Link from "next/link";
import { SearchXIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <SearchXIcon className="size-10 text-muted-foreground" aria-hidden />
      <div>
        <h1 className="text-xl font-semibold">No encontramos este elemento</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Puede que se haya movido, eliminado o que el enlace no sea correcto.
        </p>
      </div>
      <Button asChild>
        <Link href="/hoy">Ir a Hoy</Link>
      </Button>
    </div>
  );
}
