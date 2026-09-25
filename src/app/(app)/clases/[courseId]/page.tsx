import Link from "next/link";
import { CheckSquareIcon, ClockIcon, UserPlusIcon } from "lucide-react";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";
import { getCourseWithTerm } from "@/features/courses/queries";
import { formatCredits } from "@/features/courses/utils";
import { TeacherCard } from "@/features/teachers/components/teacher-card";
import { getCourseTeachers } from "@/features/teachers/queries";

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <h2 id={id} className="text-lg font-semibold">
        {title}
      </h2>
      {children}
    </section>
  );
}

/** Resumen de la clase (plan §13): datos, docente principal y lo próximo. */
export default async function CourseSummaryPage({ params }: PageProps<"/clases/[courseId]">) {
  const found = await getCourseWithTerm((await params).courseId);
  if (!found) notFound();
  const { course, term } = found;
  const teachers = await getCourseTeachers(course.id);
  const primary = teachers.find((entry) => entry.is_primary) ?? teachers[0] ?? null;
  const archived = term.status === "archived";

  const details = [
    course.room ? { label: "Aula", value: course.room } : null,
    course.credits !== null ? { label: "Créditos", value: formatCredits(course.credits) } : null,
    course.code ? { label: "Código", value: course.code } : null,
  ].filter((item) => item !== null);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
      <div className="flex flex-col gap-8">
        {details.length > 0 || course.description ? (
          <Section id="datos-titulo" title="Datos de la clase">
            {details.length > 0 ? (
              <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {details.map((item) => (
                  <div key={item.label}>
                    <dt className="text-sm text-muted-foreground">{item.label}</dt>
                    <dd className="font-medium">{item.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
            {course.description ? (
              <p className="max-w-2xl text-sm whitespace-pre-line">{course.description}</p>
            ) : null}
          </Section>
        ) : null}

        <Section id="sesiones-titulo" title="Próximas sesiones">
          <EmptyState
            icon={ClockIcon}
            title="Sin horario todavía"
            description="Cuando registres el horario de la clase, aquí verás sus próximas sesiones."
          />
        </Section>

        <Section id="tareas-titulo" title="Tareas pendientes">
          <EmptyState
            icon={CheckSquareIcon}
            title="Sin tareas todavía"
            description="Las entregas de esta clase aparecerán aquí, ordenadas por fecha."
          />
        </Section>
      </div>

      <Section id="docente-titulo" title="Docente">
        {primary ? (
          <TeacherCard teacher={primary.teacher} isPrimary={primary.is_primary} />
        ) : (
          <EmptyState
            icon={UserPlusIcon}
            title="Sin docente asignado"
            description={
              archived ? undefined : "Añade a tu docente para escribirle o llamarle con un clic."
            }
            action={
              archived ? null : (
                <Button variant="outline" asChild>
                  <Link href={`/clases/${course.id}/profesor`}>Asignar docente</Link>
                </Button>
              )
            }
          />
        )}
      </Section>
    </div>
  );
}
