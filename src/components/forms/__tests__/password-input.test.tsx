import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { PasswordInput } from "../password-input";

describe("PasswordInput", () => {
  it("oculta la contraseña y permite mostrarla con un botón accesible", async () => {
    const user = userEvent.setup();
    render(
      <>
        <label htmlFor="pw">Contraseña</label>
        <PasswordInput id="pw" />
      </>,
    );

    const input = screen.getByLabelText("Contraseña");
    expect(input).toHaveAttribute("type", "password");

    const toggle = screen.getByRole("button", { name: "Mostrar contraseña" });
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    await user.click(toggle);

    expect(input).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "Ocultar contraseña" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
