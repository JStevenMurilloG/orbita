import Link from "next/link";
import { CalendarClockIcon, CheckSquareIcon, LayersIcon, OrbitIcon } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";

const FEATURES = [
  {
    icon: LayersIcon,
    title: "Todo por trimestre",
    text: "Clases, horario y tareas viven dentro de su trimestre. Los pasados quedan archivados.",
  },
  {
    icon: CalendarClockIcon,
    title: "Tu día de un vistazo",
    text: "Qué clases tienes hoy y cómo entrar a cada una con un clic.",
  },
  {
    icon: CheckSquareIcon,
    title: "Entregas bajo control",
    text: "Tareas ordenadas por cercanía y prioridad, para que nada se te pase.",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between px-4 py-3 sm:px-8">
        <span className="flex items-center gap-2 font-semibold">
          <OrbitIcon className="size-5 text-primary" aria-hidden />
          Órbita
        </span>
        <ThemeToggle />
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center gap-12 px-4 py-12 sm:px-8">
        <section className="flex flex-col items-start gap-5">
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Tu espacio académico, en órbita.
          </h1>
          <p className="max-w-xl text-lg text-pretty text-muted-foreground">
            Organiza tus trimestres, clases, horario y tareas en un solo lugar privado y seguro.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/hoy">Entrar</Link>
            </Button>
          </div>
        </section>

        <section aria-label="Qué puedes hacer" className="grid gap-4 sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-xl border p-4">
              <Icon className="mb-3 size-5 text-primary" aria-hidden />
              <h2 className="font-medium">{title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
