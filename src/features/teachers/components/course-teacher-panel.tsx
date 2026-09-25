"use client";

import { useState, useTransition } from "react";
import { PencilIcon, RefreshCwIcon, UserMinusIcon } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { unassignTeacherAction } from "../actions";
import type { Teacher, TeacherOption } from "../types";
import { TeacherCard } from "./teacher-card";
import { TeacherCombobox } from "./teacher-combobox";
import { TeacherFormDialog } from "./teacher-form-dialog";

function UnassignTeacherButton({ courseId, teacher }: { courseId: string; teacher: Teacher }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const unassign = () =>
    startTransition(async () => {
      const result = await unassignTeacherAction({ course_id: courseId, teacher_id: teacher.id });
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }
      setOpen(false);
      toast.success("Docente quitado de la clase.");
    });

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserMinusIcon aria-hidden /> Quitar
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Quitar a {teacher.full_name} de esta clase?</AlertDialogTitle>
          <AlertDialogDescription>
            Sus datos se conservan para que puedas asignarlo a otras clases.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
          <Button onClick={unassign} disabled={pending} aria-busy={pending || undefined}>
            Quitar docente
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Pestaña Profesor: docente principal de la clase con sus acciones (plan §13). En el MVP la
 * UI gestiona un único docente principal; el esquema ya admite varios.
 */
export function CourseTeacherPanel({
  courseId,
  primary,
  teachers,
  readOnly,
}: {
  courseId: string;
  primary: Teacher | null;
  teachers: TeacherOption[];
  readOnly: boolean;
}) {
  const [changing, setChanging] = useState(false);
  const [editing, setEditing] = useState(false);

  if (!primary) {
    if (readOnly) {
      return <p className="text-sm text-muted-foreground">Esta clase no tiene docente asignado.</p>;
    }
    return <TeacherCombobox courseId={courseId} teachers={teachers} />;
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <TeacherCard
        teacher={primary}
        isPrimary
        headingLevel={2}
        actions={
          readOnly ? null : (
            <>
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                <PencilIcon aria-hidden /> Editar datos
              </Button>
              <Button
                variant="outline"
                size="sm"
                aria-expanded={changing}
                onClick={() => setChanging((value) => !value)}
              >
                <RefreshCwIcon aria-hidden /> Cambiar docente
              </Button>
              <UnassignTeacherButton courseId={courseId} teacher={primary} />
            </>
          )
        }
      />
      {!readOnly && changing ? (
        <TeacherCombobox
          courseId={courseId}
          teachers={teachers}
          excludeTeacherId={primary.id}
          onAssigned={() => setChanging(false)}
          autoFocus
        />
      ) : null}
      {!readOnly ? (
        <TeacherFormDialog mode="edit" teacher={primary} open={editing} onOpenChange={setEditing} />
      ) : null}
    </div>
  );
}
