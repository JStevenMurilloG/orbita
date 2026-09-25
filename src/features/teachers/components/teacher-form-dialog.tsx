"use client";

import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { applyServerErrors } from "@/components/forms/apply-server-errors";
import { FormAlert } from "@/components/forms/form-alert";
import { fieldDescribedBy, FormField } from "@/components/forms/form-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createTeacherAction, updateTeacherAction } from "../actions";
import {
  TEACHER_EMAIL_MAX,
  TEACHER_NAME_MAX,
  TEACHER_NOTES_MAX,
  TEACHER_OFFICE_HOURS_MAX,
  TEACHER_OFFICE_MAX,
  TEACHER_PHONE_MAX,
  teacherFormSchema,
  type TeacherFormOutput,
  type TeacherFormValues,
} from "../schemas";
import type { Teacher } from "../types";

function toFormValues(teacher: Partial<Teacher>): TeacherFormValues {
  return {
    full_name: teacher.full_name ?? "",
    email: teacher.email ?? "",
    phone: teacher.phone ?? "",
    office: teacher.office ?? "",
    office_hours: teacher.office_hours ?? "",
    notes: teacher.notes ?? "",
  };
}

type TeacherFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Tras guardar con éxito (antes de cerrar). */
  onSaved?: () => void;
} & (
  { mode: "create"; courseId: string; defaultName?: string } | { mode: "edit"; teacher: Teacher }
);

/**
 * Crear un docente (y asignarlo como principal de la clase) o editar sus datos
 * (plan §24 `TeacherForm`). Se monta al abrir para empezar siempre con los datos actuales.
 */
export function TeacherFormDialog(props: TeacherFormDialogProps) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{props.mode === "create" ? "Nuevo docente" : "Editar docente"}</DialogTitle>
          <DialogDescription>
            {props.mode === "create"
              ? "Quedará como docente principal de esta clase y podrás reutilizarlo en otras."
              : "Los cambios se verán en todas las clases de este docente."}
          </DialogDescription>
        </DialogHeader>
        {props.open ? <TeacherForm {...props} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function TeacherForm(props: TeacherFormDialogProps) {
  const [pending, startTransition] = useTransition();
  const form = useForm<TeacherFormValues, unknown, TeacherFormOutput>({
    resolver: zodResolver(teacherFormSchema),
    defaultValues: toFormValues(
      props.mode === "edit" ? props.teacher : { full_name: props.defaultName ?? "" },
    ),
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result =
        props.mode === "create"
          ? await createTeacherAction({ ...values, course_id: props.courseId })
          : await updateTeacherAction({ ...values, id: props.teacher.id });
      if (!result.ok) return applyServerErrors(form, result.error);
      toast.success(props.mode === "create" ? "Docente asignado." : "Cambios guardados.");
      props.onSaved?.();
      props.onOpenChange(false);
    });
  });

  const text = (
    id: keyof TeacherFormValues,
    label: string,
    max: number,
    extra: React.ComponentProps<typeof Input> = {},
  ) => (
    <FormField id={`teacher-${id}`} label={label} error={errors[id]?.message}>
      <Input
        id={`teacher-${id}`}
        maxLength={max}
        aria-invalid={Boolean(errors[id])}
        aria-describedby={fieldDescribedBy(`teacher-${id}`, { error: errors[id] })}
        {...extra}
        {...form.register(id)}
      />
    </FormField>
  );

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <FormAlert message={errors.root?.server?.message} />
      {text("full_name", "Nombre", TEACHER_NAME_MAX, { autoComplete: "off" })}
      {text("email", "Correo (opcional)", TEACHER_EMAIL_MAX, {
        type: "email",
        inputMode: "email",
        autoComplete: "off",
        placeholder: "nombre@universidad.edu",
      })}
      {text("phone", "Teléfono (opcional)", TEACHER_PHONE_MAX, {
        type: "tel",
        inputMode: "tel",
        autoComplete: "off",
        placeholder: "+57 601 555 0101",
      })}
      {text("office", "Oficina (opcional)", TEACHER_OFFICE_MAX, { placeholder: "Bloque B, 204" })}
      <FormField
        id="teacher-office_hours"
        label="Horario de atención (opcional)"
        error={errors.office_hours?.message}
      >
        <Textarea
          id="teacher-office_hours"
          rows={2}
          maxLength={TEACHER_OFFICE_HOURS_MAX}
          placeholder="Martes y jueves de 14:00 a 16:00"
          aria-invalid={Boolean(errors.office_hours)}
          aria-describedby={fieldDescribedBy("teacher-office_hours", {
            error: errors.office_hours,
          })}
          {...form.register("office_hours")}
        />
      </FormField>
      <FormField
        id="teacher-notes"
        label="Información adicional (opcional)"
        error={errors.notes?.message}
      >
        <Textarea
          id="teacher-notes"
          rows={2}
          maxLength={TEACHER_NOTES_MAX}
          aria-invalid={Boolean(errors.notes)}
          aria-describedby={fieldDescribedBy("teacher-notes", { error: errors.notes })}
          {...form.register("notes")}
        />
      </FormField>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline" disabled={pending}>
            Cancelar
          </Button>
        </DialogClose>
        <SubmitButton pending={pending} pendingText="Guardando…">
          {props.mode === "create" ? "Crear y asignar" : "Guardar docente"}
        </SubmitButton>
      </DialogFooter>
    </form>
  );
}
