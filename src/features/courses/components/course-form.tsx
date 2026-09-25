"use client";

import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useController, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { applyServerErrors } from "@/components/forms/apply-server-errors";
import { FormAlert } from "@/components/forms/form-alert";
import { fieldDescribedBy, FormField } from "@/components/forms/form-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { CourseColor } from "@/lib/design/course-colors";
import { createCourseAction, updateCourseAction } from "../actions";
import {
  COURSE_CODE_MAX,
  COURSE_DESCRIPTION_MAX,
  COURSE_NAME_MAX,
  COURSE_ROOM_MAX,
  courseFormSchema,
  type CourseFormOutput,
  type CourseFormValues,
} from "../schemas";
import { courseToFormValues } from "../utils";
import { ColorPicker } from "./color-picker";
import { CourseIcon } from "./course-icon";

/** Emojis frecuentes para elegir con un clic (también se puede escribir cualquiera). */
const SUGGESTED_ICONS = ["📐", "🧪", "💻", "📚", "🧬", "🌍", "🎨", "⚖️", "📊", "🎵", "✍️", "🏛️"];

type CourseFormProps = { defaultValues: CourseFormValues; submitLabel: string } & (
  { mode: "create"; termId: string } | { mode: "edit"; courseId: string }
);

/** Crear o editar una clase (plan §24 `CourseForm`). */
export function CourseForm(props: CourseFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const form = useForm<CourseFormValues, unknown, CourseFormOutput>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: props.defaultValues,
  });
  const { errors, isDirty } = form.formState;
  const color = useController({ control: form.control, name: "color" });
  const icon = useWatch({ control: form.control, name: "icon" });
  const name = useWatch({ control: form.control, name: "name" });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      if (props.mode === "create") {
        const result = await createCourseAction({ ...values, term_id: props.termId });
        if (!result.ok) return applyServerErrors(form, result.error);
        toast.success("Clase creada.");
        router.push(`/clases/${result.data.id}`);
        return;
      }

      const result = await updateCourseAction({ ...values, id: props.courseId });
      if (!result.ok) return applyServerErrors(form, result.error);
      form.reset(courseToFormValues(result.data));
      toast.success("Cambios guardados.");
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex max-w-xl flex-col gap-6">
      <FormAlert message={errors.root?.server?.message} />

      <FormField id="name" label="Nombre" error={errors.name?.message}>
        <Input
          id="name"
          placeholder="Cálculo diferencial"
          maxLength={COURSE_NAME_MAX}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={fieldDescribedBy("name", { error: errors.name })}
          {...form.register("name")}
        />
      </FormField>

      <div className="grid gap-6 sm:grid-cols-2">
        <FormField id="code" label="Código (opcional)" error={errors.code?.message}>
          <Input
            id="code"
            placeholder="MAT-204"
            maxLength={COURSE_CODE_MAX}
            aria-invalid={Boolean(errors.code)}
            aria-describedby={fieldDescribedBy("code", { error: errors.code })}
            {...form.register("code")}
          />
        </FormField>
        <FormField id="room" label="Aula (opcional)" error={errors.room?.message}>
          <Input
            id="room"
            placeholder="B-204"
            maxLength={COURSE_ROOM_MAX}
            aria-invalid={Boolean(errors.room)}
            aria-describedby={fieldDescribedBy("room", { error: errors.room })}
            {...form.register("room")}
          />
        </FormField>
      </div>

      <FormField id="credits" label="Créditos (opcional)" error={errors.credits?.message}>
        <Input
          id="credits"
          inputMode="decimal"
          placeholder="3"
          className="w-32"
          aria-invalid={Boolean(errors.credits)}
          aria-describedby={fieldDescribedBy("credits", { error: errors.credits })}
          {...form.register("credits")}
        />
      </FormField>

      <fieldset className="flex flex-col gap-3">
        <legend id="color-legend" className="mb-3 text-sm font-medium">
          Color
        </legend>
        <ColorPicker
          name={color.field.name}
          value={color.field.value as CourseColor}
          onChange={color.field.onChange}
          onBlur={color.field.onBlur}
          legendId="color-legend"
          describedBy={errors.color ? "color-error" : undefined}
          invalid={Boolean(errors.color)}
        />
        {errors.color ? <FieldError id="color-error">{errors.color.message}</FieldError> : null}
      </fieldset>

      <FormField
        id="icon"
        label="Emoji (opcional)"
        description="Se muestra junto al nombre de la clase. Elige uno o escribe el que quieras."
        error={errors.icon?.message}
      >
        <div className="flex items-center gap-3">
          <CourseIcon
            icon={icon || null}
            name={name || "?"}
            color={color.field.value as CourseColor}
          />
          <Input
            id="icon"
            className="w-24 text-center text-lg"
            autoComplete="off"
            aria-invalid={Boolean(errors.icon)}
            aria-describedby={fieldDescribedBy("icon", { error: errors.icon, description: true })}
            {...form.register("icon")}
          />
          {icon ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => form.setValue("icon", "", { shouldDirty: true, shouldValidate: true })}
            >
              Quitar
            </Button>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-1" role="group" aria-label="Emojis sugeridos">
          {SUGGESTED_ICONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              aria-label={`Usar ${emoji}`}
              aria-pressed={icon === emoji}
              onClick={() =>
                form.setValue("icon", emoji, { shouldDirty: true, shouldValidate: true })
              }
              className="flex size-9 items-center justify-center rounded-lg border text-lg transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 aria-pressed:border-foreground aria-pressed:bg-muted"
            >
              <span aria-hidden>{emoji}</span>
            </button>
          ))}
        </div>
      </FormField>

      <FormField
        id="description"
        label="Descripción (opcional)"
        error={errors.description?.message}
      >
        <Textarea
          id="description"
          rows={3}
          maxLength={COURSE_DESCRIPTION_MAX}
          aria-invalid={Boolean(errors.description)}
          aria-describedby={fieldDescribedBy("description", { error: errors.description })}
          {...form.register("description")}
        />
      </FormField>

      <div>
        <SubmitButton
          pending={pending}
          pendingText="Guardando…"
          disabled={pending || (props.mode === "edit" && !isDirty)}
        >
          {props.submitLabel}
        </SubmitButton>
      </div>
    </form>
  );
}
