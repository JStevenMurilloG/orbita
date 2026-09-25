import { ClockIcon } from "lucide-react";
import { EmptyState } from "@/components/feedback/empty-state";

/** Pestaña Horario: se completa con el horario semanal (Fase 4). */
export default function CourseSchedulePage() {
  return (
    <EmptyState
      icon={ClockIcon}
      title="El horario de esta clase llegará pronto"
      description="Podrás indicar los días y horas en que se dicta, con su aula."
    />
  );
}
