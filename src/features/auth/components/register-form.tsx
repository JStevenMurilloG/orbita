"use client";

import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheckIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { applyServerErrors } from "@/components/forms/apply-server-errors";
import { FormAlert } from "@/components/forms/form-alert";
import { fieldDescribedBy, FormField } from "@/components/forms/form-field";
import { PasswordInput } from "@/components/forms/password-input";
import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";
import { DEFAULT_TIMEZONE, detectBrowserTimeZone } from "@/lib/dates/zone";
import { registerAction } from "../actions";
import { PASSWORD_MIN, registerSchema, type RegisterInput } from "../schemas";
import { ResendConfirmationButton } from "./resend-confirmation-button";

export function RegisterForm() {
  const [pending, startTransition] = useTransition();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { full_name: "", email: "", password: "", timezone: DEFAULT_TIMEZONE },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      // La zona se detecta al enviar (solo existe en el navegador) y se guarda en el perfil.
      const result = await registerAction({ ...values, timezone: detectBrowserTimeZone() });
      if (result.ok) setSentTo(result.data.email);
      else applyServerErrors(form, result.error);
    });
  });

  if (sentTo) {
    return (
      <div className="flex flex-col items-center gap-4 text-center" role="status">
        <MailCheckIcon className="size-10 text-primary" aria-hidden />
        <h2 className="text-lg font-semibold">Revisa tu correo</h2>
        <p className="text-sm text-muted-foreground">
          Si <strong className="text-foreground">{sentTo}</strong> no tenía ya una cuenta, te
          enviamos un enlace para confirmarla. Ábrelo para activar tu cuenta.
        </p>
        <ResendConfirmationButton email={sentTo} />
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <FormAlert message={errors.root?.server?.message} />

      <FormField id="full_name" label="Nombre" error={errors.full_name?.message}>
        <Input
          id="full_name"
          autoComplete="name"
          autoFocus
          aria-invalid={Boolean(errors.full_name)}
          aria-describedby={fieldDescribedBy("full_name", { error: errors.full_name })}
          {...form.register("full_name")}
        />
      </FormField>

      <FormField id="email" label="Correo" error={errors.email?.message}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={fieldDescribedBy("email", { error: errors.email })}
          {...form.register("email")}
        />
      </FormField>

      <FormField
        id="password"
        label="Contraseña"
        description={`Al menos ${PASSWORD_MIN} caracteres.`}
        error={errors.password?.message}
      >
        <PasswordInput
          id="password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.password)}
          aria-describedby={fieldDescribedBy("password", {
            error: errors.password,
            description: true,
          })}
          {...form.register("password")}
        />
      </FormField>

      <SubmitButton pending={pending} pendingText="Creando cuenta…" size="lg" className="w-full">
        Crear cuenta
      </SubmitButton>
    </form>
  );
}
