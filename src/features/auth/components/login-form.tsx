"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { applyServerErrors } from "@/components/forms/apply-server-errors";
import { FormAlert } from "@/components/forms/form-alert";
import { fieldDescribedBy, FormField } from "@/components/forms/form-field";
import { PasswordInput } from "@/components/forms/password-input";
import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";
import { loginAction } from "../actions";
import { loginSchema, type LoginInput } from "../schemas";
import { ResendConfirmationButton } from "./resend-confirmation-button";

export function LoginForm({ next }: { next?: string }) {
  const [pending, startTransition] = useTransition();
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null);
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) => {
    setUnconfirmedEmail(null);
    startTransition(async () => {
      // Si todo va bien, la acción redirige y no devuelve nada.
      const result = await loginAction(values, next);
      if (result.ok) return;
      applyServerErrors(form, result.error);
      if (result.error.code === "EMAIL_NOT_CONFIRMED") setUnconfirmedEmail(values.email);
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <FormAlert message={errors.root?.server?.message} />
      {unconfirmedEmail ? <ResendConfirmationButton email={unconfirmedEmail} /> : null}

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

      <FormField
        id="password"
        label="Contraseña"
        error={errors.password?.message}
        action={
          <Link
            href="/recuperar"
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        }
      >
        <PasswordInput
          id="password"
          autoComplete="current-password"
          aria-invalid={Boolean(errors.password)}
          aria-describedby={fieldDescribedBy("password", { error: errors.password })}
          {...form.register("password")}
        />
      </FormField>

      <SubmitButton pending={pending} pendingText="Entrando…" size="lg" className="w-full">
        Iniciar sesión
      </SubmitButton>
    </form>
  );
}
