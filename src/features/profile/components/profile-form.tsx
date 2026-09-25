"use client";

import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTheme } from "next-themes";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { applyServerErrors } from "@/components/forms/apply-server-errors";
import { FormAlert } from "@/components/forms/form-alert";
import { fieldDescribedBy, FormField } from "@/components/forms/form-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import { FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { detectBrowserTimeZone } from "@/lib/dates/zone";
import { updateProfileAction } from "../actions";
import { updateProfileSchema, type UpdateProfileInput } from "../schemas";
import { THEME_LABELS, WEEKDAY_LABELS } from "../labels";

export function ProfileForm({
  defaultValues,
  timeZones,
}: {
  defaultValues: UpdateProfileInput;
  /** Zonas IANA disponibles (calculadas en servidor para evitar diferencias de hidratación). */
  timeZones: string[];
}) {
  const { setTheme } = useTheme();
  const [pending, startTransition] = useTransition();
  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues,
  });
  const { errors, isDirty } = form.formState;
  const currentTz = useWatch({ control: form.control, name: "timezone" });
  const zones = timeZones.includes(currentTz) ? timeZones : [currentTz, ...timeZones];

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await updateProfileAction(values);
      if (!result.ok) return applyServerErrors(form, result.error);
      setTheme(result.data.theme);
      form.reset({
        full_name: result.data.full_name,
        timezone: result.data.timezone,
        week_starts_on: result.data.week_starts_on,
        theme: result.data.theme,
      });
      toast.success("Perfil actualizado.");
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex max-w-xl flex-col gap-6">
      <FormAlert message={errors.root?.server?.message} />

      <FormField id="full_name" label="Nombre" error={errors.full_name?.message}>
        <Input
          id="full_name"
          autoComplete="name"
          aria-invalid={Boolean(errors.full_name)}
          aria-describedby={fieldDescribedBy("full_name", { error: errors.full_name })}
          {...form.register("full_name")}
        />
      </FormField>

      <FormField
        id="timezone"
        label="Zona horaria"
        description="Se usa para saber qué día es “hoy” y para mostrar horas y vencimientos."
        error={errors.timezone?.message}
      >
        <div className="flex flex-wrap items-center gap-2">
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
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              form.setValue("timezone", detectBrowserTimeZone(), {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          >
            Usar la de este dispositivo
          </Button>
        </div>
      </FormField>

      <FormField
        id="week_starts_on"
        label="La semana empieza el"
        error={errors.week_starts_on?.message}
      >
        <NativeSelect
          id="week_starts_on"
          className="w-full sm:w-48"
          aria-invalid={Boolean(errors.week_starts_on)}
          aria-describedby={fieldDescribedBy("week_starts_on", { error: errors.week_starts_on })}
          {...form.register("week_starts_on", { valueAsNumber: true })}
        >
          {WEEKDAY_LABELS.map((label, index) => (
            <NativeSelectOption key={label} value={index + 1}>
              {label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </FormField>

      <FieldSet>
        <FieldLegend variant="label">Tema</FieldLegend>
        <Controller
          control={form.control}
          name="theme"
          render={({ field }) => (
            <RadioGroup
              value={field.value}
              onValueChange={field.onChange}
              className="flex flex-wrap gap-4"
              aria-label="Tema"
            >
              {Object.entries(THEME_LABELS).map(([value, label]) => (
                <div key={value} className="flex items-center gap-2">
                  <RadioGroupItem id={`theme-${value}`} value={value} />
                  <FieldLabel htmlFor={`theme-${value}`} className="font-normal">
                    {label}
                  </FieldLabel>
                </div>
              ))}
            </RadioGroup>
          )}
        />
      </FieldSet>

      <div>
        <SubmitButton pending={pending} pendingText="Guardando…" disabled={pending || !isDirty}>
          Guardar cambios
        </SubmitButton>
      </div>
    </form>
  );
}
