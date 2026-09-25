"use client";

import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { applyServerErrors } from "@/components/forms/apply-server-errors";
import { FormAlert } from "@/components/forms/form-alert";
import { fieldDescribedBy, FormField } from "@/components/forms/form-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { createTermAction, updateTermAction } from "../actions";
import { termLabel } from "../labels";
import {
  TERM_DESCRIPTION_MAX,
  TERM_NAME_MAX,
  TERM_YEAR_MAX,
  TERM_YEAR_MIN,
  termFormSchema,
  type TermFormOutput,
  type TermFormValues,
} from "../schemas";
import type { TermSummary } from "../types";

type TermFormProps = {
  defaultValues: TermFormValues;
  /** Zonas IANA disponibles (calculadas en servidor para evitar diferencias de hidratación). */
  timeZones: string[];
  submitLabel: string;
} & (
  | {
      mode: "create";
      /** Casilla "Usar como trimestre activo" (no aplica al primer trimestre: siempre lo es). */
      offerMakeActive?: boolean;
      /** Destino tras crear; por defecto, la página del trimestre. */
      redirectTo?: string;
    }
  | { mode: "edit"; termId: string }
);

function warnOverlaps(overlaps: TermSummary[]) {
  if (overlaps.length === 0) return;
  toast.warning("Las fechas se cruzan con otro trimestre", {
    description: overlaps.map(termLabel).join(", "),
  });
}

/** Crear o editar un trimestre (plan §24 `TermForm`). */
export function TermForm(props: TermFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [makeActive, setMakeActive] = useState(true);
  const form = useForm<TermFormValues, unknown, TermFormOutput>({
    resolver: zodResolver(termFormSchema),
    defaultValues: props.defaultValues,
  });
  const { errors, isDirty } = form.formState;
  const currentTz = useWatch({ control: form.control, name: "timezone" });
  const zones = props.timeZones.includes(currentTz)
    ? props.timeZones
    : [currentTz, ...props.timeZones];

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      if (props.mode === "create") {
        const result = await createTermAction({
          ...values,
          make_active: props.offerMakeActive ? makeActive : undefined,
        });
        if (!result.ok) return applyServerErrors(form, result.error);
        toast.success("Trimestre creado.");
        warnOverlaps(result.data.overlaps);
        router.push(props.redirectTo ?? `/trimestres/${result.data.term.id}`);
        return;
      }

      const result = await updateTermAction({ ...values, id: props.termId });
      if (!result.ok) return applyServerErrors(form, result.error);
      const { term } = result.data;
      form.reset({
        name: term.name,
        year: term.year,
        start_date: term.start_date,
        end_date: term.end_date,
        timezone: term.timezone,
        description: term.description ?? "",
      });
      toast.success("Cambios guardados.");
      warnOverlaps(result.data.overlaps);
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex max-w-xl flex-col gap-6">
      <FormAlert message={errors.root?.server?.message} />

      <FormField id="name" label="Nombre" error={errors.name?.message}>
        <Input
          id="name"
          placeholder="Segundo trimestre"
          maxLength={TERM_NAME_MAX}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={fieldDescribedBy("name", { error: errors.name })}
          {...form.register("name")}
        />
      </FormField>

      <FormField id="year" label="Año" error={errors.year?.message}>
        <Input
          id="year"
          type="number"
          inputMode="numeric"
          min={TERM_YEAR_MIN}
          max={TERM_YEAR_MAX}
          className="w-32"
          aria-invalid={Boolean(errors.year)}
          aria-describedby={fieldDescribedBy("year", { error: errors.year })}
          {...form.register("year", { valueAsNumber: true })}
        />
      </FormField>

      <div className="grid gap-6 sm:grid-cols-2">
        <FormField id="start_date" label="Fecha de inicio" error={errors.start_date?.message}>
          <Input
            id="start_date"
            type="date"
            aria-invalid={Boolean(errors.start_date)}
            aria-describedby={fieldDescribedBy("start_date", { error: errors.start_date })}
            {...form.register("start_date")}
          />
        </FormField>
        <FormField id="end_date" label="Fecha de fin" error={errors.end_date?.message}>
          <Input
            id="end_date"
            type="date"
            aria-invalid={Boolean(errors.end_date)}
            aria-describedby={fieldDescribedBy("end_date", { error: errors.end_date })}
            {...form.register("end_date")}
          />
        </FormField>
      </div>

      <FormField
        id="timezone"
        label="Zona horaria"
        description="La de tu institución. El horario de clases se interpreta en esta zona."
        error={errors.timezone?.message}
      >
        <NativeSelect
          id="timezone"
          className="w-full sm:w-80"
          aria-invalid={Boolean(errors.timezone)}
          aria-describedby={fieldDescribedBy("timezone", {
            error: errors.timezone,
            description: true,
          })}
          {...form.register("timezone")}
        >
          {zones.map((tz) => (
            <NativeSelectOption key={tz} value={tz}>
              {tz.replaceAll("_", " ")}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </FormField>

      <FormField
        id="description"
        label="Descripción (opcional)"
        error={errors.description?.message}
      >
        <Textarea
          id="description"
          rows={3}
          maxLength={TERM_DESCRIPTION_MAX}
          aria-invalid={Boolean(errors.description)}
          aria-describedby={fieldDescribedBy("description", { error: errors.description })}
          {...form.register("description")}
        />
      </FormField>

      {props.mode === "create" && props.offerMakeActive ? (
        <div className="flex items-center gap-2">
          <input
            id="make_active"
            type="checkbox"
            className="size-4 accent-primary"
            checked={makeActive}
            onChange={(event) => setMakeActive(event.target.checked)}
          />
          <label htmlFor="make_active" className="text-sm">
            Usarlo como trimestre activo
          </label>
        </div>
      ) : null}

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
