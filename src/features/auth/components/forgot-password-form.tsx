"use client";

import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheckIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { applyServerErrors } from "@/components/forms/apply-server-errors";
import { FormAlert } from "@/components/forms/form-alert";
import { fieldDescribedBy, FormField } from "@/components/forms/form-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";
import { forgotPasswordAction } from "../actions";
import { emailOnlySchema, type EmailOnlyInput } from "../schemas";

export function ForgotPasswordForm() {
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const form = useForm<EmailOnlyInput>({
    resolver: zodResolver(emailOnlySchema),
    defaultValues: { email: "" },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await forgotPasswordAction(values);
      if (result.ok) setSent(true);
      else applyServerErrors(form, result.error);
    });
  });

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-4 text-center" role="status">
        <MailCheckIcon className="size-10 text-primary" aria-hidden />
        <h2 className="text-lg font-semibold">Revisa tu correo</h2>
        <p className="text-sm text-muted-foreground">
          Si existe una cuenta con ese correo, te enviamos un enlace para elegir una nueva
          contraseña. Caduca en 1 hora.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <FormAlert message={errors.root?.server?.message} />

      <FormField id="email" label="Correo" error={errors.email?.message}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          autoFocus
          aria-invalid={Boolean(errors.email)}
          aria-describedby={fieldDescribedBy("email", { error: errors.email })}
          {...form.register("email")}
        />
      </FormField>

      <SubmitButton pending={pending} pendingText="Enviando…" size="lg" className="w-full">
        Enviar enlace
      </SubmitButton>
    </form>
  );
}
