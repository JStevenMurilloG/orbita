import { CheckSquareIcon } from "lucide-react";
import { EmptyState } from "@/components/feedback/empty-state";

/** Pestaña Tareas: se completa con el sistema de tareas (Fase 6). */
export default function CourseTasksPage() {
  return (
    <EmptyState
      icon={CheckSquareIcon}
      title="Las tareas de esta clase llegarán pronto"
      description="Podrás crear entregas con fecha, prioridad y notas, y marcarlas como completadas."
    />
  );
}
