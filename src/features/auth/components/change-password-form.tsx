"use client";

import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { applyServerErrors } from "@/components/forms/apply-server-errors";
import { FormAlert } from "@/components/forms/form-alert";
import { fieldDescribedBy, FormField } from "@/components/forms/form-field";
import { PasswordInput } from "@/components/forms/password-input";
import { SubmitButton } from "@/components/forms/submit-button";
import { changePasswordAction } from "../actions";
import { changePasswordSchema, PASSWORD_MIN, type ChangePasswordInput } from "../schemas";

const EMPTY: ChangePasswordInput = { current_password: "", new_password: "", confirm_password: "" };

export function ChangePasswordForm() {
  const [pending, startTransition] = useTransition();
  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: EMPTY,
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await changePasswordAction(values);
      if (!result.ok) return applyServerErrors(form, result.error);
      form.reset(EMPTY);
      toast.success("Contraseña actualizada.");
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <FormAlert message={errors.root?.server?.message} />

      <FormField
        id="current_password"
        label="Contraseña actual"
        error={errors.current_password?.message}
      >
        <PasswordInput
          id="current_password"
          autoComplete="current-password"
          aria-invalid={Boolean(errors.current_password)}
          aria-describedby={fieldDescribedBy("current_password", {
            error: errors.current_password,
          })}
          {...form.register("current_password")}
        />
      </FormField>

      <FormField
        id="new_password"
        label="Nueva contraseña"
        description={`Al menos ${PASSWORD_MIN} caracteres.`}
        error={errors.new_password?.message}
      >
        <PasswordInput
          id="new_password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.new_password)}
          aria-describedby={fieldDescribedBy("new_password", {
            error: errors.new_password,
            description: true,
          })}
          {...form.register("new_password")}
        />
      </FormField>

      <FormField
        id="confirm_password"
        label="Repite la nueva contraseña"
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

      <div>
        <SubmitButton pending={pending} pendingText="Guardando…">
          Cambiar contraseña
        </SubmitButton>
      </div>
    </form>
  );
}
