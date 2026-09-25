import { ClockIcon, MailIcon, MapPinIcon, PhoneIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Teacher } from "../types";
import { mailtoHref, telHref } from "../utils";

const linkClass =
  "inline-flex min-w-0 items-center gap-2 rounded-sm font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50";

/**
 * Datos del docente con acciones rápidas (plan §24 `TeacherCard`): el correo abre el cliente
 * de correo (`mailto:`) y el teléfono marca (`tel:`) con un solo clic.
 */
export function TeacherCard({
  teacher,
  isPrimary = false,
  actions,
  headingLevel = 3,
}: {
  teacher: Teacher;
  isPrimary?: boolean;
  actions?: React.ReactNode;
  headingLevel?: 2 | 3;
}) {
  const Heading = headingLevel === 2 ? "h2" : "h3";

  return (
    <article
      aria-labelledby={`teacher-${teacher.id}-name`}
      data-testid="teacher-card"
      className="flex flex-col gap-4 rounded-xl border bg-card p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <Heading id={`teacher-${teacher.id}-name`} className="font-medium">
            {teacher.full_name}
          </Heading>
          {isPrimary ? (
            <Badge variant="secondary" className="mt-1">
              Docente principal
            </Badge>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>

      <ul className="flex flex-col gap-2 text-sm">
        {teacher.email ? (
          <li>
            <a href={mailtoHref(teacher.email)} className={linkClass}>
              <MailIcon className="size-4 shrink-0" aria-hidden />
              <span className="truncate">{teacher.email}</span>
            </a>
          </li>
        ) : null}
        {teacher.phone ? (
          <li>
            <a href={telHref(teacher.phone)} className={linkClass}>
              <PhoneIcon className="size-4 shrink-0" aria-hidden />
              <span>{teacher.phone}</span>
            </a>
          </li>
        ) : null}
        {teacher.office ? (
          <li className="flex items-center gap-2 text-muted-foreground">
            <MapPinIcon className="size-4 shrink-0" aria-hidden />
            <span>
              <span className="sr-only">Oficina: </span>
              {teacher.office}
            </span>
          </li>
        ) : null}
        {teacher.office_hours ? (
          <li className="flex items-start gap-2 text-muted-foreground">
            <ClockIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span className="whitespace-pre-line">
              <span className="sr-only">Horario de atención: </span>
              {teacher.office_hours}
            </span>
          </li>
        ) : null}
      </ul>

      {teacher.notes ? (
        <p className="text-sm whitespace-pre-line text-muted-foreground">{teacher.notes}</p>
      ) : null}
      {!teacher.email && !teacher.phone ? (
        <p className="text-sm text-muted-foreground">Sin datos de contacto todavía.</p>
      ) : null}
    </article>
  );
}
