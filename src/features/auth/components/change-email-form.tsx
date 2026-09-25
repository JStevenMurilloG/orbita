"use client";

import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { applyServerErrors } from "@/components/forms/apply-server-errors";
import { FormAlert } from "@/components/forms/form-alert";
import { fieldDescribedBy, FormField } from "@/components/forms/form-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";
import { changeEmailAction } from "../actions";
import { emailOnlySchema, type EmailOnlyInput } from "../schemas";

export function ChangeEmailForm() {
  const [pending, startTransition] = useTransition();
  const form = useForm<EmailOnlyInput>({
    resolver: zodResolver(emailOnlySchema),
    defaultValues: { email: "" },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await changeEmailAction(values);
      if (!result.ok) return applyServerErrors(form, result.error);
      form.reset({ email: "" });
      toast.success("Revisa ambos correos para confirmar el cambio.");
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <FormAlert message={errors.root?.server?.message} />

      <FormField
        id="email"
        label="Nuevo correo"
        description="Te enviaremos un enlace al correo actual y otro al nuevo; el cambio se aplica al confirmar ambos."
        error={errors.email?.message}
      >
        <Input
          id="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={fieldDescribedBy("email", {
            error: errors.email,
            description: true,
          })}
          {...form.register("email")}
        />
      </FormField>

      <div>
        <SubmitButton pending={pending} pendingText="Enviando…">
          Cambiar correo
        </SubmitButton>
      </div>
    </form>
  );
}
