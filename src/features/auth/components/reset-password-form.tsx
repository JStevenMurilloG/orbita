"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { applyServerErrors } from "@/components/forms/apply-server-errors";
import { FormAlert } from "@/components/forms/form-alert";
import { fieldDescribedBy, FormField } from "@/components/forms/form-field";
import { PasswordInput } from "@/components/forms/password-input";
import { SubmitButton } from "@/components/forms/submit-button";
import { resetPasswordAction } from "../actions";
import { PASSWORD_MIN, resetPasswordSchema, type ResetPasswordInput } from "../schemas";

export function ResetPasswordForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirm_password: "" },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await resetPasswordAction(values);
      if (!result.ok) return applyServerErrors(form, result.error);
      toast.success("Contraseña actualizada.");
      router.replace("/hoy");
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <FormAlert message={errors.root?.server?.message} />

      <FormField
        id="password"
        label="Nueva contraseña"
        description={`Al menos ${PASSWORD_MIN} caracteres.`}
        error={errors.password?.message}
      >
        <PasswordInput
          id="password"
          autoComplete="new-password"
          autoFocus
          aria-invalid={Boolean(errors.password)}
          aria-describedby={fieldDescribedBy("password", {
            error: errors.password,
            description: true,
          })}
          {...form.register("password")}
        />
      </FormField>

      <FormField
        id="confirm_password"
        label="Repite la contraseña"
        error={errors.confirm_password?.message}
      >
        <PasswordInput
          id="confirm_password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.confirm_password)}
          aria-describedby={fieldDescribedBy("confirm_password", {
            error: errors.confirm_password,
          })}
          {...form.register("confirm_password")}
        />
      </FormField>

      <SubmitButton pending={pending} pendingText="Guardando…" size="lg" className="w-full">
        Guardar contraseña
      </SubmitButton>
    </form>
  );
}
