import type { Metadata } from "next";
import Link from "next/link";
import { ArchiveIcon } from "lucide-react";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { CourseForm } from "@/features/courses/components/course-form";
import { getTermCourses } from "@/features/courses/queries";
import { suggestCourseColor } from "@/features/courses/utils";
import { termLabel } from "@/features/terms/labels";
import { findCurrentTerm } from "@/features/terms/queries";

export const metadata: Metadata = { title: "Nueva clase" };

export default async function NewCoursePage({
  params,
}: PageProps<"/trimestres/[termId]/clases/nueva">) {
  const term = await findCurrentTerm((await params).termId);
  if (!term) notFound();

  const backToCourses = (
    <Button variant="outline" asChild>
      <Link href={`/trimestres/${term.id}/clases`}>Volver a las clases</Link>
    </Button>
  );

  if (term.status === "archived") {
    return (
      <>
        <PageHeader title="Nueva clase" description={termLabel(term)} />
        <EmptyState
          icon={ArchiveIcon}
          title="Este trimestre está archivado"
          description="No se pueden crear clases en un trimestre archivado. Desarchívalo para editarlo."
          action={backToCourses}
        />
      </>
    );
  }

  const courses = await getTermCourses(term.id);

  return (
    <>
      <PageHeader title="Nueva clase" description={termLabel(term)} />
      <CourseForm
        mode="create"
        termId={term.id}
        submitLabel="Crear clase"
        defaultValues={{
          name: "",
          code: "",
          description: "",
          color: suggestCourseColor(courses.map((course) => course.color)),
          icon: "",
          room: "",
          credits: "",
        }}
      />
    </>
  );
}
